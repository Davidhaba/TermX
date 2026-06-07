class Modal {
  constructor(title = "Info") {
    this.appName = title;
    this.modWindow = document.createElement("div");
    this.modWindow.classList.add("modal-window");
    this.modWindow.tabIndex = 0;
    this.titleBar = document.createElement("div");
    this.titleBar.className = "title-bar";
    this.controls = document.createElement("div");
    this.controls.className = "controls";
    this.closeButton = document.createElement("div");
    this.closeButton.className = "control close";
    this.controls.appendChild(this.closeButton);
    this.titleContainer = document.createElement("div");
    this.titleContainer.className = "title-container";
    this.title = document.createElement("div");
    this.title.className = "title";
    this.titleBar.appendChild(this.controls);
    this.titleBar.appendChild(this.titleContainer);
    this.titleContainer.appendChild(this.title);
    this.modWindow.appendChild(this.titleBar);
    document.body.appendChild(this.modWindow);
    this.appMain = document.createElement("div");
    this.appMain.classList.add("app-io");
    this.modWindow.appendChild(this.appMain);
    this.isDragging = false;
    this.initialX = 0;
    this.initialY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this._mouseMoveHandler = this.dragging.bind(this);
    this._touchMoveHandler = this.dragging.bind(this);
    this._mouseUpHandler = this.stopDragging.bind(this);
    this._touchEndHandler = this.stopDragging.bind(this);
    this.titleBar.addEventListener("mousedown", (e) => this.startDragging(e));
    this.titleBar.addEventListener("touchstart", (e) => this.startDragging(e), {
      passive: false
    });
    this.modWindow.addEventListener("mousedown", (e) => {
      this.checkBlocking(e);
    });
    this.modWindow.addEventListener("touchstart", (e) => {
      this.checkBlocking(e);
    });
    this.modWindow.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.closeButton) this.closeButton.click();
    });
    this.modWindow.style.left = `${Math.random() * 50 + 10}px`;
    this.modWindow.style.top = `${Math.random() * 50 + 10}px`;
    this.transitionTimer = null;
    this.activeTouchId = null;
    this.isBlocked = false;
    this.dialogApp = null;
    this.parentApp = null;
    this.childApps = [];
    this.setActiveWindow();
    this.updateTitle(title);

    window.openApplications.push(this);
  }
  checkBlocking(e = null) {
    if (this.isBlocked) {
      e && e.preventDefault();
      if (this.dialogApp) {
        this.dialogApp.setActiveWindow();
        return;
      }
      if (this.childApps && this.childApps.length === 0) {
        this.unblockWindow();
      }
    }
    this.setActiveWindow();
  }
  updateTitle(newTitle) {
    this.title.textContent = newTitle || this.title;
  }
  setApp() {
    const minButton = document.createElement("div");
    minButton.className = "control min";
    const maxButton = document.createElement("div");
    maxButton.className = "control max";
    this.controls.appendChild(minButton);
    this.controls.appendChild(maxButton);
    minButton.addEventListener("click", () => this.handleMinimize());
    maxButton.addEventListener("click", () => this.handleMaximize());
    this.modWindow.classList.add("app-size");
    this.modWindow.style.width = window.innerWidth > 600 ? "600px" : "90vw";
    this.setupResizeHandle();
  }

  setupResizeHandle() {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    this.modWindow.appendChild(resizeHandle);
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    const startResize = (e) => {
      if (!this.modWindow || this.isFullscreen || this.isBlocked) return;
      isResizing = true;
      startX = e.touches ? e.touches[0].clientX : e.clientX;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = this.modWindow.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      this.modWindow.classList.add("resizing");
      e.preventDefault();
    };
    const doResize = (e) => {
      if (!this.modWindow || !isResizing || this.isFullscreen || this.isBlocked) return;
      const currentX = e.touches ? e.touches[0].clientX : e.clientX;
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const diffX = currentX - startX;
      const diffY = currentY - startY;
      const newWidth = Math.max(0, startWidth + diffX);
      const newHeight = Math.max(0, startHeight + diffY);
      this.modWindow.style.width = newWidth + 'px';
      this.modWindow.style.height = newHeight + 'px';
    };
    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      if (this.modWindow) this.modWindow.classList.remove("resizing");
    };
    resizeHandle.addEventListener('mousedown', startResize);
    resizeHandle.addEventListener('touchstart', startResize, { passive: false });
    document.addEventListener('mousemove', doResize);
    document.addEventListener('touchmove', doResize, { passive: false });
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchend', stopResize);
  }
  setupExitBtn(callback = null) {
    if (this.closeButton)
      this.closeButton.addEventListener("click", () => this.handleClose(callback));
  }
  async handleClose(callback = null) {
    if (callback && typeof callback === 'function' && await callback() === false) return;

    if (this.modWindow) this.modWindow.style.animation = "anHide 0.1s forwards";
    setTimeout(() => {
      if (this.modWindow) {
        this.modWindow.style.display = "none";
        this.modWindow.remove();
        this.modWindow = null;
      }
    }, 100);
  }
  setupInfoBtn(name, text) {
    if (!text) return;
    const button = document.createElement("div");
    button.className = "control info";
    button.innerHTML = "i";
    button.onclick = () => { new Dialog(name, `What is ${name}?`, text, 'info', ['Ok'], 'Ok', this); };
    this.titleBar.appendChild(button);
  }
  blockWindow() {
    this.isBlocked = true;
  }
  unblockWindow() {
    this.isBlocked = false;
  }
  handleMinimize(toggle = true) {
    if (toggle) {
      this.isMinimized = !this.isMinimized;
      this.handleMaximize(false);
      this.setTransition();
      this.modWindow.classList[this.isMinimized ? "add" : "remove"]("minimize");
    } else if (this.isMinimized) {
      this.isMinimized = false;
      this.modWindow.classList.remove("minimize");
    }
  }
  handleMaximize(toggle = true) {
    if (toggle) {
      this.handleMinimize(false);
      this.isFullscreen = !this.isFullscreen;
      this.setTransition();
      this.modWindow.classList[this.isFullscreen ? "add" : "remove"]("maximize");
    } else if (this.isFullscreen) {
      this.isFullscreen = false;
      this.modWindow.classList.remove("maximize");
      this.modWindow.style.top = "0";
      this.modWindow.style.left = "0";
    }
  }
  setTransition(transit = null) {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    if (transit == "shadow") {
      if (this.modWindow) this.modWindow.style.transition = "box-shadow 0.3s";
    } else {
      if (this.modWindow) this.modWindow.style.transition = "all 0.3s";
    }
    this.transitionTimer = setTimeout(() => {
      if (this.modWindow) this.modWindow.style.transition = "";
      this.transitionTimer = null;
    }, 300);
  }
  startDragging(e) {
    if (this.isBlocked || this.isMinimized || e.target.closest(".controls") || e.target.closest(".control")) return;
    if (e.cancelable) e.preventDefault();
    this.handleMaximize(false);
    if (e.type === "touchstart") {
      const touch = e.changedTouches[e.changedTouches.length - 1];
      this.activeTouchId = touch.identifier;
      this.initialX = touch.clientX;
      this.initialY = touch.clientY;
    } else {
      this.initialX = e.clientX;
      this.initialY = e.clientY;
    }
    this.isDragging = true;
    this.titleBar.style.cursor = "grabbing";
    const rect = this.modWindow.getBoundingClientRect();
    this.offsetX = this.initialX - rect.left;
    this.offsetY = this.initialY - rect.top;
    document.addEventListener("mousemove", this._mouseMoveHandler);
    document.addEventListener("touchmove", this._touchMoveHandler, {
      passive: false
    });
    document.addEventListener("mouseup", this._mouseUpHandler);
    document.addEventListener("touchend", this._touchEndHandler);
  }

  dragging(e) {
    if (!this.isDragging) return;
    let clientX, clientY;
    if (e.type === "touchmove") {
      const touch = Array.from(e.touches).find(
        (t) => t.identifier === this.activeTouchId
      );
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const vp = window.visualViewport || window;
    const newX = clientX - this.offsetX;
    const newY = clientY - this.offsetY;
    const appRect = this.modWindow.getBoundingClientRect();
    const maxX = vp.width - 30;
    const maxY = vp.height - 30;
    const boundedX = Math.max(0 - appRect.width + 30, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    this.modWindow.style.left = `${boundedX}px`;
    this.modWindow.style.top = `${boundedY}px`;
    if (e.cancelable) e.preventDefault();
  }
  stopDragging(e) {
    if (
      !this.isDragging ||
      (e.type === "touchend" &&
        Array.from(e.touches).find((t) => t.identifier === this.activeTouchId))
    )
      return;
    this.isDragging = false;
    this.activeTouchId = null;
    this.titleBar.style.cursor = "";
    document.removeEventListener("mousemove", this._mouseMoveHandler);
    document.removeEventListener("touchmove", this._touchMoveHandler);
    document.removeEventListener("mouseup", this._mouseUpHandler);
    document.removeEventListener("touchend", this._touchEndHandler);
  }
  setActiveWindow() {
    if (!this.modWindow?.classList.contains("active")) {
      document.querySelectorAll(".modal-window").forEach((window) => {
        window.classList.remove("active");
      });
      if (this.modWindow) {
        this.setTransition("shadow");
        this.modWindow.classList.add("active");
        this.bringToFront();
      }
    }
    if (this.modWindow && !this.modWindow.contains(document.activeElement)) this.modWindow.focus();
  }
  bringToFront() {
    const maxZ = Math.max(
      ...[...document.querySelectorAll(".modal-window")].map((w) =>
        parseInt(w.style.zIndex || 100, 10)
      )
    );
    if (this.modWindow) {
      this.modWindow.style.zIndex = maxZ + 1;
    }
  }
}

class Dialog {
  constructor(title, mainMessage, details, iconType, buttons, primaryButton, parentModal = null) {
    return new Promise(resolve => {
      const app = new Modal(title);
      const appMain = app.appMain;
      app.modWindow.classList.add('dialog');
      appMain.classList.add("padd");
      const standart = 'Cancel';
      app.setupExitBtn(async () => {
        closeDialog(standart);
        return false;
      });
      if (parentModal) {
        parentModal.blockWindow();
        parentModal.dialogApp = app;
        app.parentApp = parentModal;
        parentModal.childApps.push(app);
      }
      const buttonsHtml = buttons.map(label => {
        const isPrimary = label === primaryButton;
        const primaryClass = isPrimary ? ' primary' : '';
        return `<button class="mac-btn${primaryClass}" data-action="${label}">${label}</button>`;
      }).join('');
      appMain.innerHTML = `
                              <div class="icon-section">${icons[iconType] || ''}</div>
                                <div class="message-section">
                                    <h2>${mainMessage}</h2>
                                    <p>${details}</p>
                                </div>
                              `;
      const footer = document.createElement('div');
      footer.className = 'button-bar';
      footer.classList.add('title-bar');
      footer.innerHTML = buttonsHtml;
      app.modWindow.appendChild(footer);
      app.modWindow.style.width = 'auto';
      setTimeout(() => {
        const buttons = footer.querySelectorAll('button');
        let buttonsWidth = 40;
        buttons.forEach((btn, index) => {
          buttonsWidth += btn.offsetWidth;
          if (index < buttons.length - 1) buttonsWidth += 10;
        });
        app.modWindow.style.minWidth = buttonsWidth + 'px';
        app.modWindow.style.width = '';
      }, 10);

      const closeDialog = (result) => {
        if (parentModal) {
          const index = parentModal.childApps.indexOf(app);
          if (index > -1) {
            parentModal.childApps.splice(index, 1);
          }
        }
        app.handleClose();
        if (parentModal) {
          parentModal.dialogApp = null;
          parentModal.unblockWindow();
          parentModal.setActiveWindow();
        }
        resolve(result);
      };
      footer.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.getAttribute('data-action') || standart;
          closeDialog(action);
        });
      });
    });
  }
}

class TextEditor {
  constructor(path = null) {
    this.path = path;
    this.name = path?.split('/').pop();
    this.app = new Modal(`${this.name || 'New File'} - Text Editor`);
    this.app.setApp();
    this.app.setupInfoBtn('Text Editor',
      'Text Editor is a simple file editor for creating and saving text files in the virtual filesystem. It supports shortcuts like Ctrl+S to save and Ctrl+N for a new document.'
    );
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'text-editor';
    this.textarea.spellcheck = false;
    const toolbar = this.createToolbar();
    const infoBar = this.createInfoBar();
    this.app.appMain.appendChild(toolbar);
    this.app.appMain.appendChild(this.textarea);
    this.app.appMain.appendChild(infoBar);
    this.setupEventListeners();
    if (path) {
      this.loadFileContent();
    }
  }
  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    const fileMenu = document.createElement('div');
    fileMenu.className = 'file-menu';
    const fileBtn = document.createElement('button');
    fileBtn.innerHTML = 'File';
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-content';
    const newBtn = document.createElement('button');
    newBtn.innerHTML = 'New File <span class="btnKeyInfo">Ctrl+N</span>';
    newBtn.onclick = async () => {
      await this.newFile();
    }
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = 'Save <span class="btnKeyInfo">Ctrl+S</span>';
    saveBtn.onclick = () => this.saveFile();
    const saveAsBtn = document.createElement('button');
    saveAsBtn.innerHTML = 'Save As...';
    saveAsBtn.onclick = () => this.saveFile(true);
    dropdown.appendChild(newBtn);
    dropdown.appendChild(saveBtn);
    dropdown.appendChild(saveAsBtn);
    fileMenu.appendChild(fileBtn);
    fileMenu.appendChild(dropdown);
    toolbar.appendChild(fileMenu);
    fileBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    };
    document.addEventListener('click', (e) => {
      dropdown.classList.remove('show');
    });
    return toolbar;
  }
  createInfoBar() {
    const infoBar = document.createElement('div');
    infoBar.className = 'editor-info-bar';
    infoBar.innerHTML = `
          <div class="info-item status" data-info="status"></div>
          <div class="info-item" data-info="lines">Lines: 0</div>
          <div class="info-item" data-info="chars">Chars: 0</div>
          <div class="info-item" data-info="size">Size: 0 B</div>
          <div class="info-item" data-info="encoding">UTF-8</div>
        `;
    return infoBar;
  }
  updateInfoBar() {
    const lines = this.textarea.value.split('\n').length;
    const chars = this.textarea.value.length;
    const size = new TextEncoder().encode(this.textarea.value).length;
    this.app.appMain.querySelector('[data-info="lines"]').textContent = `Lines: ${lines}`;
    this.app.appMain.querySelector('[data-info="chars"]').textContent = `Chars: ${chars}`;
    this.app.appMain.querySelector('[data-info="size"]').textContent = `Size: ${fileSystem.formatSize(size)}`;
    const file = fileSystem._resolvePath(this.path);
    this.app.appMain.querySelector('[data-info="encoding"]').textContent = (file?.type === "file" && file.parameters) ? file.parameters.encoding :
      "UTF-8";
  }
  setupEventListeners() {
    this.textarea.addEventListener('keydown', (e) => {
      this.updateInfoBar();
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            this.saveFile();
            break;
          case 'n':
            e.preventDefault();
            this.newFile();
            break;
        }
      }
    });
    this.textarea.addEventListener('keyup', () => this.updateInfoBar());
    this.updateInfoBar();
    this.app.setupExitBtn(async () => {
      if (await this.checkChanges()) {
        const isSave = await this.confirmSave();
        if (isSave === null) return false;
      }
    });
  }
  async confirmSave() {
    const answer = await new Dialog(
      'Unsaved Changes',
      'Save your changes?',
      'Your changes will be lost if you don\'t save them.',
      'question',
      ['Cancel', "Don't Save", 'Save'],
      'Save',
      this.app
    );
    if (answer === 'Save') {
      await this.saveFile();
      return true;
    } else if (answer === 'Cancel') {
      return null;
    }
  }
  async loadFileContent() {
    try {
      this.textarea.value = await this.getFileContent();
      this.app.updateTitle(`${this.name} - Text Editor`);
      this.updateInfoBar();
    } catch (error) {
      this.showStatus(`Error loading file: ${error.message}`, 'error');
    }
  }
  async getFileContent() {
    return await fileSystem.decodeContent(await fileSystem.asyncReadFile(this.path), "text");
  }
  async checkChanges() {
    const text = this.textarea.value || "";
    if (!this.path) {
      if (text) return true;
    } else {
      const cont = await this.getFileContent() || "";
      if (cont !== text) {
        return true;
      }
    }
    return false;
  }
  async saveFile(isSaveAs = false) {
    try {
      const newPath = (isSaveAs || !this.path) ?
        prompt('Enter file path:', (this.path || '/home/untitled.txt')) :
        this.path;
      if (!newPath) return;
      const dirPath = newPath.split('/').slice(0, -1).join('/');
      fileSystem.mkdirp(dirPath);
      const success = await fileSystem.writeFile(newPath, this.textarea.value);
      if (success) {
        this.path = newPath;
        this.name = newPath.split('/').pop();
        this.app.updateTitle(`${this.name} - Text Editor`);
        this.showStatus('File saved successfully!', 'success');
      } else {
        throw new Error('Failed to save file');
      }
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }
  async newFile() {
    if (await this.checkChanges()) {
      const isSave = await this.confirmSave();
      if (isSave === null) return;
    }
    this.path = '';
    this.name = 'New File';
    this.textarea.value = '';
    this.app.updateTitle(`${this.name} - Text Editor`);
    this.updateInfoBar();
  }
  showStatus(message, type = 'info') {
    const infoStatus = this.app.appMain.querySelector('[data-info="status"]');
    if (infoStatus) {
      const isExists = infoStatus.classList.contains('show');
      if (isExists) {
        infoStatus.classList.remove('show');
        setTimeout(() => {
          this.showStatus(message, type);
        }, 100);
        return;
      }
      infoStatus.textContent = message;
      infoStatus.className = `info-item status ${type}`;
      setTimeout(() => infoStatus.classList.add('show'), 0);
      if (this.statusTimer) {
        clearTimeout(this.statusTimer);
        this.statusTimer = null;
      }
      this.statusTimer = setTimeout(() => {
        infoStatus.classList.remove('show');
        this.statusTimer = null;
      }, 5000);
      return;
    }
  }
}

class ImageViewer {
  constructor(path) {
    const name = path.split('/').pop();
    this.app = new Modal(name + " - Image Viewer");
    this.appMain = this.app.appMain;
    this.img = document.createElement("img");
    this.img.className = "image-view";
    this.img.onload = () => {
      this.loader.style.display = 'none';
    };
    this.img.addEventListener("error", () => {
      this.loader.style.display = 'none';
      console.error("Image Viewer: an error occurred");
    });
    this.app.setupExitBtn();
    this.app.setApp();
    this.app.setupInfoBtn('Image Viewer',
      'Image Viewer displays image files in a clean, focused window and supports common formats loaded from the filesystem.'
    );
    const imgElement = document.createElement("div");
    imgElement.className = "image-imgElement";
    this.loader = document.createElement('div');
    this.loader.className = "loading-spinner";
    this.loader.style.opacity = 1;
    imgElement.appendChild(this.img);
    imgElement.appendChild(this.loader);
    this.appMain.appendChild(imgElement);
    this.appMain.style.alignItems = "center";
    fileSystem.asyncReadFile(path).then((content) => {
      return fileSystem.decodeContent(content, 'url');
    }).then((url) => {
      this.img.src = url;
    }).catch((error) => {
      this.loader.style.display = 'none';
      alert("Error loading file: " + error.message);
    });
  }
}

class FileExplorer {
  constructor() {
    this.app = new Modal("File Explorer");
    this.appMain = this.app.appMain;
    this.appMain.classList.add("padd");
    this.modWindow = this.app.modWindow;
    this.app.setApp();
    this.app.setupInfoBtn('File Explorer',
      'File Explorer lets you browse folders, open items, and manage files with sorting controls and a context menu for Open, Rename, Delete, and new items.'
    );
    this.selectedItem = null;
    this.renamingItem = null;
    this.sortType = "name";
    this.sortOrder = "asc";
    this.contextMenu = null;
    this.initUI();
  }
  initUI() {
    this.app.setupExitBtn();
    this.context = new FileSystemClone();
    this.appMain.innerHTML = `
      <div class="explorer-toolbar">
        <button class="back-btn">${icons.arrowLeft}</button>
        <button class="refresh-btn">${icons.refresh}</button>
        <input class="current-path" type="text" value=${this.context.path} readonly>
      </div>
      <div class="sort-controls">
        <button class="sort-btn" data-sort="name">Name ↑</button>
        <button class="sort-btn" data-sort="type">Type</button>
        <button class="sort-btn" data-sort="size">Size</button>
      </div>
      <div class="file-list"></div>`;
    [this.backBtn, this.refreshBtn, this.currentPath, this.fileList] = ["back-btn", "refresh-btn", "current-path", "file-list"].map((c) =>
      this.appMain.querySelector(`.${c}`)
    );
    this.sortButtons = this.appMain.querySelectorAll(".sort-btn");
    this.setupEvents();
    this.updateFileList();
  }
  setupEvents() {
    this.backBtn.onclick = () => this.navigateUp();
    this.refreshBtn.onclick = () => this.updateUI();
    this.currentPath.addEventListener("click", () => {
      if (this.currentPath.readOnly) {
        this.currentPath.readOnly = false;
        this.currentPath.focus();
      }
    });
    this.currentPath.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        try {
          if (e.cancelable) e.preventDefault();
          this.updatePath();
        } catch (error) {
          console.error(error.message);
        }
      }
    });
    this.fileList.addEventListener("click", (e) => {
      this.clearSelection();
      const t = e.target.closest(".file-item");
      if (t) {
        t.classList.add("selected");
        this.selectedItem = t.dataset.name;
      }
    });
    this.fileList.addEventListener("dblclick", () => this.openSelected());
    this.fileList.addEventListener("contextmenu", (e) => {
      if (!e.isLongPress && (e.pointerType === 'touch' || e.type.startsWith('touch'))) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      this.showContextMenu(e);
    });
    this.setupLongPressMenu();

    this.sortButtons.forEach(
      (btn) => (btn.onclick = () => this.handleSort(btn.dataset.sort))
    );
  }

  setupLongPressMenu() {
    let longPressTimer = null;
    let longPressTarget = null;
    let touchStartEvent = null;
    const startLongPress = (e) => {
      const renameInput = this.fileList.querySelector('.rename-input');
      if (renameInput && renameInput.contains(e.target)) {
        e.stopPropagation();
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        return;
      }
      longPressTarget = e.target.closest(".file-item");
      touchStartEvent = e;
      if (e.target.closest(".emptyFolder")) return;
      longPressTimer = setTimeout(() => {
        if (longPressTarget) {
          if (this.selectedItem !== longPressTarget.dataset.name) {
            this.clearSelection();
            longPressTarget.classList.add("selected");
            this.selectedItem = longPressTarget.dataset.name;
          }
        } else {
          this.clearSelection();
        }
        const touch = touchStartEvent.touches[0];
        const synthEvent = new MouseEvent('contextmenu', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          pageX: touch.pageX,
          pageY: touch.pageY,
          bubbles: true,
          cancelable: true
        });
        synthEvent.isLongPress = true;
        this.fileList.dispatchEvent(synthEvent);
      }, 500);
    };
    const endLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressTarget = null;
      touchStartEvent = null;
    };
    this.fileList.addEventListener("touchstart", startLongPress, { passive: true });
    this.fileList.addEventListener("touchend", endLongPress);
    this.fileList.addEventListener("touchmove", endLongPress);
    this.fileList.addEventListener("touchcancel", endLongPress);
  }
  updatePath() {
    this.currentPath.readOnly = true;
    const enteredPath = this.currentPath.value;
    try {
      const item = fileSystem._resolvePath(enteredPath);
      if (item && item.type) {
        if (item.type === 'file') fileSystem.openFile(enteredPath);
        else this.context.path = fileSystem.cd(this.context.path, enteredPath);
      }
    } catch (e) { }
    this.updateUI();
  }
  handleSort(type) {
    this.sortOrder =
      this.sortType === type ?
        this.sortOrder === "asc" ?
          "desc" :
          "asc" :
        "asc";
    this.sortType = type;
    this.updateFileList();
    this.sortButtons.forEach((btn) => {
      btn.textContent = (btn.dataset.sort === "name" ? "Name" : btn.dataset.sort === "type" ? "Type" : "Size") +
        (btn.dataset.sort === this.sortType ? this.sortOrder === "asc" ? " ↑" : " ↓" : "");
    });
  }

  getSortedFiles() {
    let files = fileSystem.ls(this.context.path) || [];
    return files.sort((a, b) => {
      let res = 0;
      if (this.sortType === "name") {
        res = a.name.localeCompare(b.name);
      } else if (this.sortType === "type") {
        res = a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1;
      } else if (this.sortType === "size") {
        const sizeA = fileSystem.getItemSize(a);
        const sizeB = fileSystem.getItemSize(b);
        res = sizeA - sizeB;
      }
      return this.sortOrder === "asc" ? res : -res;
    });
  }
  formatItemInfo(item) {
    return fileSystem.formatSize(fileSystem.getItemSize(item), item.type);
  }

  escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  updateFileList() {
    const currentDir = fileSystem._resolvePath(this.context.path);
    if (!currentDir) {
      this.navigateUp();
      return;
    }

    const files = this.getSortedFiles();
    if (this.selectedItem && !files.find((f) => f.name === this.selectedItem)) {
      this.clearSelection();
    }
    this.fileList.innerHTML =
      files.map((f) => {
        const isRenaming = this.renamingItem === f.name;
        const fileNameHtml = isRenaming
          ? `<input class="rename-input" type="text" value="${this.escapeHtml(f.name)}" />`
          : this.escapeHtml(f.name);
        return `
      <div class="file-item ${f.type} ${this.selectedItem === f.name ? 'selected' : ''} ${isRenaming ? 'renaming' : ''}" data-name="${this.escapeHtml(f.name)}">
          <span class="file-icon">${this.getFileIcon(f)}</span>
          <span class="file-name">${fileNameHtml}</span>
          <span class="file-type">${f.type === 'directory' ? 'Folder' : fileSystem.getFileType(f.name).display}</span>
          <span class="file-size">${this.formatItemInfo(f)}</span>
      </div>`;
      })
        .join("") || '<p class="emptyFolder">This folder is empty.</p>';
    if (this.selectedItem) {
      const selectedElement = this.fileList.querySelector(`.file-item[data-name="${this.escapeHtml(this.selectedItem)}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView();
      }
    }
    const renameInput = this.fileList.querySelector('.rename-input');
    if (renameInput) {
      const oldName = this.renamingItem;
      const commitRename = (value) => {
        if (!this.renamingItem) {
          this.updateFileList();
          return;
        }
        const trimmed = String(value || '').trim();
        if (!trimmed || trimmed === oldName) {
          this.renamingItem = null;
          this.updateFileList();
          return;
        }

        const matches = fileSystem.checkForbiddenChars(trimmed);
        if (matches) {
          alert(`The filename contains forbidden characters: ${matches.join(', ')}`);
          return;
        }

        try {
          fileSystem.mv(
            fileSystem.getResolvedPath(this.context.path, oldName),
            fileSystem.getResolvedPath(this.context.path, trimmed)
          );
          this.selectedItem = trimmed;
        } catch (e) {
          new Dialog('File Explorer - Error', 'An error occurred', e.message, 'error', ['Ok'], 'Ok', this.app);
        }
        this.renamingItem = null;
        this.updateFileList();
      };
      let renameCommittedByEnter = false;
      renameInput.addEventListener('keydown', (e) => {
        if (!this.renamingItem || this.selectedItem !== this.renamingItem) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          renameCommittedByEnter = true;
          this.app?.setActiveWindow();
          commitRename(renameInput.value);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          renameCommittedByEnter = false;
          this.renamingItem = null;
          this.updateFileList();
          this.app?.setActiveWindow();
        }
      });
      renameInput.addEventListener('blur', () => {
        if (renameCommittedByEnter) {
          renameCommittedByEnter = false;
          return;
        }
        commitRename(renameInput.value);
      });
      renameInput.addEventListener('click', (e) => {
      });
      renameInput.addEventListener('dblclick', (e) => {
        e.stopPropagation();
      });
      renameInput.addEventListener('contextmenu', (e) => {
        e.stopPropagation();
      });
      renameInput.focus();
      renameInput.select();
    }
  }
  getFileIcon(f) {
    if (f.type === "directory" && icons.folder) return icons.folder;
    if (f.type === "file") {
      let fileType = fileSystem.getFileType(f.name).type;
      fileType = 'file' + fileType.charAt(0).toUpperCase() + fileType.slice(1).toLowerCase();
      if (icons[fileType]) return icons[fileType];
    }
    return icons.file;
  }
  navigateUp() {
    try {
      const newPath = fileSystem.cd(this.context.path, "..");
      if (newPath) this.context.path = newPath;
      this.updateUI();
    } catch (e) {
      new Dialog('File Explorer - Error', 'An error occurred', e.message, 'error', ['Ok'], 'Ok', this.app);
    }
  }
  createNewFolder() {
    let newName = "New Folder";
    let counter = 0;
    while (fileSystem.ls(this.context.path).some(item => item.name === newName)) {
      counter++;
      newName = `New Folder (${counter})`;
    }
    fileSystem.mkdir(this.context.path, newName);
    this.clearSelection();
    this.renamingItem = newName;
    this.selectedItem = newName;
    this.updateFileList();
  }
  showContextMenu(e) {
    if (this.contextMenu) this.contextMenu.remove();
    const file = this.selectedItem && fileSystem.ls(this.context.path).find((f) => f.name === this.selectedItem);
    if (this.selectedItem && !file) {
      throw new Error("File or Directory not found");
    }
    this.contextMenu = document.createElement("div");
    this.contextMenu.className = "context-menu";
    let html = "";
    if (this.selectedItem) {
      if (file) {
        if (file.type === "file") {
          html += `<div class="menu-item open">${icons.openFile}Open file</div>
            <div class="menu-item open-as">${icons.openAs}Open as</div>`;
        } else {
          html += `<div class="menu-item open">${icons.openFolder}Open Folder</div>`;
        }
        html += `<div class="menu-item copyPath">${icons.copy}Copy File Path</div>
          <div class="menu-item rename">${icons.rename}Rename</div>
          <div class="menu-item delete">${icons.delete}Delete</div>`;
      }
    } else {
      html += `<div class="menu-item refresh">${icons.refresh}Refresh</div>
                 <div class="menu-item new-folder">${icons.newFolder}New Folder</div>
                 <div class="menu-item new-file">${icons.newFile}New File</div>
                 <div class="menu-item copyPath">${icons.copy}Copy Current Path</div>`;
    }
    this.contextMenu.innerHTML = html;
    if (this.selectedItem) {
      this.contextMenu.querySelector(".open").onclick = () => {
        this.openSelected();
        this.clearSelection();
      };
      if (file && file.type === "file")
        this.contextMenu.querySelector(".open-as").onclick = () => {
          this.openAsSelected();
          this.clearSelection();
        };
      this.contextMenu.querySelector(".rename").onclick = () =>
        this.renameSelected();
      this.contextMenu.querySelector(".delete").onclick = async () => {
        await this.deleteSelected();
      }
    } else {
      this.contextMenu.querySelector(".refresh").onclick = () =>
        this.updateUI();
      this.contextMenu.querySelector(".new-folder").onclick = () =>
        this.createNewFolder();
      this.contextMenu.querySelector(".new-file").onclick = () =>
        this.createNewFile();
    }
    this.contextMenu.querySelector(".copyPath").onclick = () =>
      this.copyPath();
    this.appMain.appendChild(this.contextMenu);
    const r = this.modWindow.getBoundingClientRect();
    const x = Math.max(
      10,
      Math.min(
        e.pageX - r.left - window.scrollX,
        r.width - this.contextMenu.offsetWidth
      )
    );
    const y = Math.max(
      10,
      Math.min(
        e.pageY - r.top - window.scrollY,
        r.height - this.contextMenu.offsetHeight
      )
    );
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    document.addEventListener("click", (e) => {
      this.contextMenu?.remove();
    }, { once: true });
  }
  clearSelection() {
    this.selectedItem = null;
    this.renamingItem = null;
    this.fileList
      .querySelectorAll(".file-item")
      .forEach((i) => i.classList.remove("selected"));
  }
  createNewFile() {
    let newName = "New File";
    let counter = 0;
    while (fileSystem.ls(this.context.path).some(item => item.name === newName)) {
      counter++;
      newName = `New File (${counter})`;
    }
    fileSystem.touch(this.context.path, newName);
    this.clearSelection();
    this.renamingItem = newName;
    this.selectedItem = newName;
    this.updateFileList();

  }
  updateUI() {
    this.fileList.innerHTML = "";
    if (this.currentPath.value !== this.context.path) {
      this.clearSelection();
      this.currentPath.value = this.context.path;
    }
    setTimeout(() => this.updateFileList(), 20);
  }
  openSelected() {
    const file = fileSystem.ls(this.context.path).find(
      (f) => f.name === this.selectedItem
    );
    if (file) {
      if (file.type === "directory") {
        try {
          const newPath = fileSystem.cd(this.context.path, file.name);
          this.context.path = newPath;
          this.updateUI();
        } catch (e) {
          new Dialog('File Explorer - Error', 'An error occurred', e.message, 'error', ['Ok'], 'Ok', this.app);
        }
      } else {
        fileSystem.openFile(this.context.path + '/' + file.name);
      }
    }
  }
  openAsSelected() {
    const file = fileSystem.ls(this.context.path).find(
      (f) => f.name === this.selectedItem
    );
    if (file) {
      fileSystem.showAppPicker(this.context.path + '/' + file.name);
    }
  }
  renameSelected() {
    if (!this.selectedItem) return;
    this.renamingItem = this.selectedItem;
    this.updateFileList();
  }
  async deleteSelected() {
    try {
      const path = this.context.path;
      const itemName = this.selectedItem;
      if (!itemName) return;
      const itemPath = path.endsWith('/') ?
        path + itemName :
        path + '/' + itemName;
      const item = fileSystem._resolvePath(itemPath);
      if (!item) {
        new Dialog('File Explorer - Error',
          'Item not found.',
          `The item "${itemName}" does not exist at the current path.`,
          'error', ['Ok'], 'Ok', this.app);
        this.updateUI();
        return;
      }
      if (item.parameters.isSystem === true) {
        new Dialog('File Explorer - Access Denied',
          'Cannot delete system item.',
          `The item "${itemName}" is a protected system ${item.type === 'directory' ? 'directory' : 'file'} and cannot be modified.`,
          'error', ['Ok'], 'Ok', this.app);
        return;
      }
      const answer = await new Dialog(
        'File Explorer - Confirm Deletion',
        `Are you sure you want to permanently delete "${itemName}"?`,
        `This ${item.type === 'directory' ? 'directory' : 'file'} will be permanently removed from the system and cannot be restored.`,
        'warning', ['Cancel', 'Delete'], 'Cancel', this.app
      );
      if (answer === 'Delete') {
        fileSystem.rm(path, itemName, true);
        this.updateUI();
      }
    } catch (e) {
      new Dialog('File Explorer - Error', 'An unexpected error occurred.', e.message, 'error', ['Ok'], 'Ok', this.app);
    }
  }
  async copyPath() {
    try {
      let path = this.context.path;
      if (this.selectedItem) path = fileSystem.getResolvedPath(path, this.selectedItem);
      await copyText(path);
    } catch (e) {
      new Dialog('File Explorer - Error', 'An error occurred', e.message, 'error', ['Ok'], 'Ok', this.app);
    }
  }
}

class VideoPlayer {
  constructor(path) {
    const name = path.split('/').pop();
    this.app = new Modal(name + " - Video Player");
    this.appMain = this.app.appMain;
    this.app.setApp();
    this.app.setupInfoBtn('Video Player',
      'Video Player plays videos with playback, volume, scale, and speed controls. It also supports keyboard shortcuts like Space to toggle playback and F for fullscreen.'
    );
    this.video = document.createElement("video");
    this.controlsVisible = true;
    this.videoScales = [
      { name: "Fit", value: "contain" },
      { name: "Fill", value: "cover" },
      { name: "Stretch", value: "fill" }
    ];
    this.playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    this.zoomLevel = 100;
    this.zoomStep = 10;
    this.app.appMain.innerHTML = `
              <div class="video-container">
                  <div class="loading-spinner"></div>
                  <div class="play-pause-icon">${icons.pause}</div>
                  <div class="video-controls">
                    <div class="controls-top">
                      <span class="time-current">00:00</span>
                      <input type="range" class="progress" value="0">
                      <span class="time-end">00:00</span>
                    </div>
                    <div class="controls-bottom">
                      <button class="play-pause-btn">${icons.pause}</button>
                      <div class="volume-element">
                        <button class="volume-btn">${icons.volumeUp}</button>
                        <input type="range" class="volume" min="0" max="1" step="0.1" value="1">
                      </div>
                      <div class="settings-menu">
                        <button class="settings-btn">${icons.settings}</button>
                        <div class="settings-dropdown">
                            <div class="settings-header">Video Settings</div>
                            <div class="settings-item">
                                <label>Scale:</label>
                                <select class="video-scale">
                                    ${this.videoScales
        .map(
          (opt) =>
            `<option value="${opt.value}">${opt.name}</option>`
        )
        .join("")}
                                </select>
                            </div>
                            <div class="settings-item">
                                <label>Speed:</label>
                                <select class="playback-speed">
                                    ${this.playbackSpeeds
        .map(
          (speed) =>
            `<option value="${speed}" ${speed === 1 ? "selected" : ""
            }>${speed}x</option>`
        )
        .join("")}
                                </select>
                            </div>
                            <div class="settings-item">
                                <label>Zoom:</label>
                                <div class="zoom-controls">
                                    <button class="zoom-out">-</button>
                                    <span class="zoom-level">${this.zoomLevel
      }%</span>
                                    <button class="zoom-in">+</button>
                                </div>
                            </div>
                        </div>
                      </div>
                      <button class="fullscreen">${icons.fullscreen}</button>
                    </div>
                  </div>
              </div>
          `;
    this.videoContainer = this.appMain.querySelector(".video-container");
    this.videoContainer.insertBefore(this.video, this.videoContainer.firstChild);
    this.settingsBtn = this.appMain.querySelector(".settings-btn");
    this.settingsDropdown = this.appMain.querySelector(".settings-dropdown");
    this.videoScaleSelect = this.appMain.querySelector(".video-scale");
    this.playbackSpeedSelect = this.appMain.querySelector(".playback-speed");
    this.zoomOutBtn = this.appMain.querySelector(".zoom-out");
    this.zoomInBtn = this.appMain.querySelector(".zoom-in");
    this.zoomLevelDisplay = this.appMain.querySelector(".zoom-level");
    this.zoomOutBtn.addEventListener("click", () =>
      this.adjustZoom(-this.zoomStep)
    );
    this.zoomInBtn.addEventListener("click", () =>
      this.adjustZoom(this.zoomStep)
    );
    this.settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.settingsDropdown.classList.toggle("visible");
    });
    this.videoScaleSelect.addEventListener("change", () => {
      this.video.style.objectFit = this.videoScaleSelect.value;
    });
    this.playbackSpeedSelect.addEventListener("change", () => {
      this.video.playbackRate = parseFloat(this.playbackSpeedSelect.value);
    });
    document.addEventListener("click", (e) => {
      if (
        !this.settingsDropdown.contains(e.target) &&
        !this.settingsBtn.contains(e.target)
      ) {
        this.settingsDropdown.classList.remove("visible");
      }
    });
    this.video.controls = false;
    this.video.poster =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    this.video.addEventListener("loadeddata", async () => {
      try {
        const savePlay = this.video.paused;
        await this.video.play();
        if (savePlay) this.video.pause();
      } catch { }
    });
    this.video.addEventListener("error", (e) => {
      console.error("Video player: an error occurred");
    });
    this.videoContainer.addEventListener('fullscreenchange', () => {
      const orientation = screen?.orientation;
      if (!orientation) return;
      if (document.fullscreenElement) {
        if (typeof orientation.lock === 'function') {
          orientation.lock('landscape').catch(() => { });
        }
      } else {
        if (typeof orientation.unlock === 'function') {
          orientation.unlock();
        }
      }
    });
    this.playPauseBtn = this.appMain.querySelector(".play-pause-btn");
    this.progress = this.appMain.querySelector(".progress");
    this.volume = this.appMain.querySelector(".volume");
    this.volumeBtn = this.appMain.querySelector(".volume-btn");
    this.fullscreenBtn = this.appMain.querySelector(".fullscreen");
    this.timeCurrent = this.appMain.querySelector(".time-current");
    this.timeEnd = this.appMain.querySelector(".time-end");
    this.setupEvents();
    this.setLoading(true);
    this.app.setupExitBtn(() => this.video.pause());
    fileSystem.asyncReadFile(path).then((content) => {
      return fileSystem.decodeContent(content, 'url');
    }).then((url) => {
      this.video.src = url;
      this.setupMediaSession(name);
    }).catch((error) => {
      alert("Error loading file: " + error.message);
      this.setLoading(false);
    });
  }
  setupMediaSession(name) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: name });
      navigator.mediaSession.setActionHandler('pause', () => {
        this.music.pause();
      });
      navigator.mediaSession.setActionHandler('play', () => {
        this.music.play();
      });
    }
  }
  adjustZoom(amount) {
    this.zoomLevel = Math.min(Math.max(this.zoomLevel + amount, 10), 200);
    this.zoomLevelDisplay.textContent = `${this.zoomLevel}%`;
    this.video.style.transform = `scale(${this.zoomLevel / 100})`;
    this.video.style.transformOrigin = "center center";
  }
  setupEvents() {
    this.playPauseBtn.addEventListener("click", () => this.togglePlayVideo());
    this.video.addEventListener("timeupdate", () => {
      const percent = (this.video.currentTime / this.video.duration) * 100;
      this.progress.style.setProperty("--progress", percent + "%");
      this.progress.value = percent;
      this.updateTimeDisplay();
    });
    this.video.addEventListener("waiting", () => this.setLoading(true));
    this.video.addEventListener("playing", () => this.setLoading(false));
    this.video.addEventListener("seeking", () => this.setLoading(true));
    this.video.addEventListener("seeked", () => this.setLoading(false));
    this.video.addEventListener("canplay", () => this.setLoading(false));
    this.video.addEventListener("stalled", () => this.setLoading(true));
    this.video.addEventListener("error", () => this.setLoading(false));

    this.progress.addEventListener("input", (e) => {
      try {
        const time = (e.target.value / 100) * this.video.duration;
        this.video.currentTime = time;
      } catch { }
    });
    this.volumeBtn.addEventListener("click", () => this.updateVolume(this.video.muted ? this.video.volume : 0));
    this.volume.addEventListener("input", (e) => this.updateVolume(e.target.value));
    this.fullscreenBtn.addEventListener("click", () => {
      this.toggleFullscreen();
    });
    this.app.modWindow.addEventListener("keydown", (e) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          this.togglePlayVideo();
          break;
        case "ArrowRight":
          this.video.currentTime += 5;
          break;
        case "ArrowLeft":
          this.video.currentTime -= 5;
          break;
        case "f":
          this.toggleFullscreen();
          break;
      }
    });
    this.mouseTimeout = null;
    this.videoContainer.addEventListener("click", (e) => this.resetTimeControls());
    this.video.addEventListener("click", (e) => this.togglePlayVideo());
    this.videoContainer.addEventListener("mousemove", () => this.resetTimeControls());
    this.video.addEventListener("dblclick", () => this.toggleFullscreen());
    this.video.addEventListener("play", () => {
      this.videoContainer.classList.add("playing");
      this.playPauseBtn.innerHTML = icons.play;
    });
    this.video.addEventListener("pause", () => {
      this.videoContainer.classList.remove("playing");
      this.playPauseBtn.innerHTML = icons.pause;
      this.resetTimeControls();
    });
  }
  updateVolume(v) {
    this.volume.value = v;
    this.volume.style.setProperty("--progress", v * 100 + "%");
    if (v <= 0) this.video.muted = true;
    else {
      this.video.volume = v;
      if (this.video.muted) this.video.muted = false;
    }
    if (v <= 0) {
      this.volumeBtn.innerHTML = icons.volumeMute;
    } else if (v <= 0.5) {
      this.volumeBtn.innerHTML = icons.volumeDown;
    } else {
      this.volumeBtn.innerHTML = icons.volumeUp;
    }
  }
  resetTimeControls() {
    if (this.mouseTimeout) clearTimeout(this.mouseTimeout);
    this.mouseTimeout = setTimeout(() => this.hideControls(), 3000);
    setTimeout(() => this.showControls(), 10);
  }
  async togglePlayVideo() {
    try {
      this.video.paused ? await this.video.play() : await this.video.pause();
    } catch {
      this.videoContainer.classList[this.video.paused ? "remove" : "add"]("playing");
    }
  }
  setLoading(isLoading) {
    this.videoContainer.classList[isLoading ? "add" : "remove"]("loading");
  }
  updateTimeDisplay() {
    const formatTime = (seconds) => {
      if (isNaN(seconds) || seconds < 0) return '00:00';
      let secs = Math.floor(seconds);
      const hours = Math.floor(secs / 3600);
      secs %= 3600;
      const mins = Math.floor(secs / 60);
      secs %= 60;
      const parts = [];
      if (hours > 0) {
        parts.push(hours.toString().padStart(2, "0"));
      }
      parts.push(mins.toString().padStart(2, "0"));
      parts.push(secs.toString().padStart(2, "0"));
      return parts.join(":");
    };
    this.timeCurrent.textContent = formatTime(this.video.currentTime);
    this.timeEnd.textContent = formatTime(this.video.duration);
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => { this.fullscreenBtn.innerHTML = icons.fullscreen; }).catch((e) => { });
    } else {
      this.videoContainer.requestFullscreen?.().then(() => { this.fullscreenBtn.innerHTML = icons.minFullscreen; }).catch((e) => { });
    }
  }
  showControls() {
    if (!this.controlsVisible) {
      const controls = this.appMain.querySelector(".video-controls");
      controls.style.opacity = "1";
      this.controlsVisible = true;
      if (this.eventsTimer) clearTimeout(this.eventsTimer);
      this.eventsTimer = setTimeout(() => (controls.style.pointerEvents = "all"), 200);
    }
  }
  hideControls() {
    if (this.controlsVisible && !this.video.paused) {
      const controls = this.appMain.querySelector(".video-controls");
      controls.style.opacity = "0";
      this.controlsVisible = false;
      if (this.eventsTimer) clearTimeout(this.eventsTimer);
      this.eventsTimer = setTimeout(() => (controls.style.pointerEvents = "none"), 200);
      if (this.mouseTimeout) clearTimeout(this.mouseTimeout);
      this.mouseTimeout = null;
    }
  }
}

class AudioPlayer {
  constructor(path) {
    const name = path.split('/').pop();
    this.app = new Modal(name + " - Audio Player");
    this.appMain = this.app.appMain;
    this.app.setupExitBtn();
    this.app.setApp();
    this.app.setupInfoBtn('Audio Player',
      'Audio Player plays music files with simple playback, volume, and progress controls, making it easy to listen to audio from the file system.'
    );
    this.isPlaying = false;
    this.createPlayerUI(name);
    this.setupEventListeners();
    fileSystem.asyncReadFile(path).then((content) => {
      return fileSystem.decodeContent(content, 'url');
    }).then((url) => {
      this.music.src = url;
      this.setupMediaSession(name);
    }).catch((error) => {
      console.error("Error loading file:", error.message);
    });
  }
  createPlayerUI(name) {
    this.appMain.innerHTML = `
      <div class="audio-player">
        <div class="audio-element">
          <div class="audio-info">
            <h2 class="audio-title">${name}</h2>
          </div>
          <div class="progress-container">
            <div class="time-display">
              <span class="current-time">00:00</span>
              <span class="total-time">00:00</span>
            </div>
            <input type="range" class="progress" value="0">
          </div>
          <div class="audio-controls">
            <button class="control-btn play-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" id="play-icon">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div class="volume-element">
              <button class="volume-btn">${icons.volumeUp}</button>
              <input type="range" class="volume" min="0" max="1" step="0.1" value="1">
            </div>
          </div>
        </div>
        <audio class="audio-element-native"></audio>
      </div>
    `;
    this.music = this.appMain.querySelector('.audio-element-native');
    this.playBtn = this.appMain.querySelector('.play-btn');
    this.playIcon = this.appMain.querySelector('#play-icon');
    this.volumeBtn = this.appMain.querySelector('.volume-btn');
    this.volume = this.appMain.querySelector('.volume');
    this.progress = this.appMain.querySelector(".progress");
    this.currentTimeDisplay = this.appMain.querySelector('.current-time');
    this.totalTimeDisplay = this.appMain.querySelector('.total-time');
    this.updateVolumeButton();
  }
  setupEventListeners() {
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.volumeBtn.addEventListener("click", () => this.updateVolume(this.music.muted ? this.music.volume : 0));
    this.volume.addEventListener("input", (e) => this.updateVolume(e.target.value));
    this.music.addEventListener('loadedmetadata', () => {
      this.updateTimeDisplay();
    });
    this.music.addEventListener('timeupdate', () => {
      if (this.music.duration) {
        const percent = (this.music.currentTime / this.music.duration) * 100;
        this.progress.style.setProperty("--progress", percent + "%");
        this.progress.value = percent;
      }
      this.updateTimeDisplay();
    });
    this.progress.addEventListener("input", (e) => {
      try {
        this.music.currentTime = (e.target.value / 100) * this.music.duration;
      } catch { }
    });
    this.music.addEventListener('play', () => {
      this.updatePlay(true);
    });
    this.music.addEventListener('pause', () => {
      this.updatePlay(false);
    });
    this.music.addEventListener('ended', () => {
      this.updatePlay(false);
    });
    this.music.addEventListener('volumechange', () => {
      this.updateVolumeButton();
    });

    this.app.modWindow.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      }
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.music.pause();
    } else {
      this.music.play().catch(e => console.log('Play failed:', e.message));
    }
  }
  updatePlay(isPlay) {
    this.isPlaying = isPlay;
    this.playIcon.innerHTML = this.isPlaying ? icons.play : icons.pause;
  }
  updateVolume(v) {
    this.volume.value = v;
    this.volume.style.setProperty("--progress", v * 100 + "%");
    if (v <= 0) this.music.muted = true;
    else {
      this.music.volume = v;
      if (this.music.muted) this.music.muted = false;
    }
  }
  updateVolumeButton() {
    const v = this.music.muted ? 0 : this.music.volume;
    if (v <= 0) {
      this.volumeBtn.innerHTML = icons.volumeMute;
    } else if (v <= 0.5) {
      this.volumeBtn.innerHTML = icons.volumeDown;
    } else {
      this.volumeBtn.innerHTML = icons.volumeUp;
    }
  }
  updateTimeDisplay() {
    const formatTime = (seconds) => {
      if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    this.currentTimeDisplay.textContent = formatTime(this.music.currentTime);
    this.totalTimeDisplay.textContent = formatTime(this.music.duration);
  }
  setupMediaSession(name) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: name
      });
      navigator.mediaSession.setActionHandler('play', () => this.music.play());
      navigator.mediaSession.setActionHandler('pause', () => this.music.pause());
    }
  }
}

class Browser {
  constructor(path) {
    const name = path.split('/').pop();
    this.app = new Modal(name + " - Browser");
    this.appMain = this.app.appMain;
    this.iframe = document.createElement('iframe');
    this.iframe.className = 'browser-iframe';
    this.appMain.appendChild(this.iframe);
    this.app.setupExitBtn();
    this.app.setApp();
    this.app.setupInfoBtn('Browser',
      'Browser opens HTML files in a safe embedded view so you can preview page content directly from the virtual filesystem.'
    );
    fileSystem.asyncReadFile(path).then((content) => {
      return fileSystem.decodeContent(content, 'text');
    }).then((html) => {
      this.updateViewer(html);
    }).catch((error) => {
      console.error("Error loading file:", error.message);
    });
  }
  updateViewer(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    this.iframe.srcdoc = doc.documentElement.outerHTML;
  }
}

class TaskManager {
  constructor() {
    this.app = new Modal("Task Manager");
    this.app.setApp();
    this.app.setupInfoBtn('Task Manager',
      'Task Manager shows running apps, process status, and browser power info so you can inspect or stop tasks.'
    );
    this.appMain = this.app.appMain;
    this.appMain.classList.add("task-manager");
    this.selectedApp = null;
    this.sortBy = "name";
    this.expandedApps = new Set();
    this.contextMenu = null;
    this.webglSupported = this.checkWebGLSupport();
    this.initUI();
    this.refreshInterval = setInterval(() => this.updateProcessList(), 1000);
    this.infoInterval = setInterval(() => this.updateBrowserInfo(), 1000);
    this.app.setupExitBtn(() => {
      clearInterval(this.refreshInterval);
      clearInterval(this.infoInterval);
    });
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      const supported = !!gl;
      if (gl) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      canvas.remove();
      return supported;
    } catch {
      return false;
    }
  }

  initUI() {
    this.appMain.innerHTML = `
      <div class="tm-tabs">
        <div class="tm-tab active" data-tab="applications">Applications</div>
        <div class="tm-tab" data-tab="services">Services</div>
        <div class="tm-tab" data-tab="browser-info">Power Info</div>
      </div>
      <div class="tm-content">
        <div class="tm-tab-content active" id="applications-tab">
          <div class="tm-list-main">
            <div class="tm-list-header">
              <div class="tm-col-name">Application Name</div>
              <div class="tm-col-status">Status</div>
              <div class="tm-col-type">Type</div>
            </div>
            <div class="tm-process-list" id="applications-list"></div>
          </div>
          <div class="tm-buttons">
            <button class="tm-btn" id="endTask">End Task</button>
          </div>
        </div>
        <div class="tm-tab-content" id="services-tab">
          <div class="tm-services-info">No services available</div>
        </div>
        <div class="tm-tab-content" id="browser-info-tab">
          <div class="tm-info-grid" id="browser-info-grid"></div>
        </div>
      </div>
    `;

    this.setupTabListeners();
    this.setupButtonListeners();
    this.setupLongPressMenu();
    this.updateProcessList();
    this.updateBrowserInfo();
  }

  setupTabListeners() {
    const tabs = this.appMain.querySelectorAll(".tm-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        tabs.forEach(t => t.classList.remove("active"));
        const contents = this.appMain.querySelectorAll(".tm-tab-content");
        contents.forEach(c => c.classList.remove("active"));

        e.target.classList.add("active");
        const tabName = e.target.dataset.tab;
        this.appMain.querySelector(`#${tabName}-tab`).classList.add("active");
      });
    });
  }

  setupButtonListeners() {
    const endTaskBtn = this.appMain.querySelector("#endTask");
    endTaskBtn.addEventListener("click", () => this.endSelectedTask());
  }

  setupLongPressMenu() {
    let longPressTimer = null;
    let longPressTarget = null;
    let touchStartEvent = null;
    const container = this.appMain.querySelector('.tm-process-list');
    if (!container) return;

    const startLongPress = (e) => {
      longPressTarget = e.target.closest('.tm-process-item');
      touchStartEvent = e;
      longPressTimer = setTimeout(() => {
        if (longPressTarget) {
          this.clearSelection();
          longPressTarget.classList.add('selected');
          const rootIndex = parseInt(longPressTarget.dataset.index ?? longPressTarget.dataset.parentIndex);
          const childIndex = longPressTarget.dataset.childIndex !== undefined ? parseInt(longPressTarget.dataset.childIndex) : null;
          this.selectedApp = childIndex !== null && !Number.isNaN(childIndex) ? { rootIndex, childIndex } : { rootIndex };
        } else {
          this.clearSelection();
        }

        const touch = touchStartEvent.touches[0];
        const synthEvent = new MouseEvent('contextmenu', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          pageX: touch.pageX,
          pageY: touch.pageY,
          bubbles: true,
          cancelable: true
        });
        synthEvent.isLongPress = true;
        const dispatchTarget = longPressTarget || container;
        dispatchTarget.dispatchEvent(synthEvent);
      }, 500);
    };

    const endLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressTarget = null;
      touchStartEvent = null;
    };

    container.addEventListener('touchstart', startLongPress, { passive: true });
    container.addEventListener('touchend', endLongPress);
    container.addEventListener('touchmove', endLongPress);
    container.addEventListener('touchcancel', endLongPress);
  }

  getApplications() {
    return window.openApplications.filter(app =>
      app && app.modWindow && app.modWindow.parentElement && !app.parentApp
    );
  }

  updateProcessList() {
    const appsList = this.appMain.querySelector("#applications-list");
    if (appsList) {
      const rootApps = this.getApplications();
      const newHtml = this.renderProcessTree(rootApps) ||
        '<div class="tm-empty">No running applications</div>';
      if (appsList.innerHTML !== newHtml) {
        appsList.innerHTML = newHtml;
        this.attachProcessListeners(appsList);
      }
    }
  }

  async getBrowserBatteryInfo() {
    if (!navigator.getBattery) {
      return {
        supported: false
      };
    }
    try {
      const battery = await navigator.getBattery();
      return {
        supported: true,
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch {
      return {
        supported: false
      };
    }
  }

  async getBrowserInfo() {
    const battery = await this.getBrowserBatteryInfo();
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    const currentTime = new Date();
    const orientation = screen.orientation?.type || (screen.width > screen.height ? 'landscape' : 'portrait');
    return {
      currentTime: currentTime.toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      online: navigator.onLine ? 'Yes' : 'No',
      connectionType: connection?.effectiveType || connection?.type || 'Unknown',
      downlink: connection?.downlink ? `${connection.downlink} Mbps` : 'Unknown',
      cores: navigator.hardwareConcurrency || 'Unknown',
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown',
      webgl: this.webglSupported ? 'Supported' : 'Unavailable',
      resolution: `${window.screen.width}×${window.screen.height}`,
      orientation,
      battery
    };
  }

  renderBrowserInfo(info) {
    const batteryStatus = info.battery.supported
      ? `${info.battery.level}% · ${info.battery.charging ? 'Charging' : 'Discharging'}`
      : 'Not supported';
    const batteryDetails = info.battery.supported
      ? `
          <div class="tm-info-item">
            <span class="tm-info-key">Time ${info.battery.charging ? 'to full' : 'remaining'}</span>
            <span class="tm-info-value">${info.battery.charging ? (info.battery.chargingTime === Infinity ? 'Unknown' : `${Math.ceil(info.battery.chargingTime / 60)} min`) : (info.battery.dischargingTime === Infinity ? 'Unknown' : `${Math.ceil(info.battery.dischargingTime / 60)} min`)}</span>
          </div>
        `
      : '';

    return `
      <div class="tm-info-grid">
        <div class="tm-info-section">
          <div class="tm-info-title">Date & Time</div>
          <div class="tm-info-item">
            <span class="tm-info-key">Current time</span>
            <span class="tm-info-value">${info.currentTime}</span>
          </div>
          <div class="tm-info-item">
            <span class="tm-info-key">Timezone</span>
            <span class="tm-info-value">${info.timezone}</span>
          </div>
        </div>

        <div class="tm-info-section">
          <div class="tm-info-title">Battery</div>
          <div class="tm-info-item">
            <span class="tm-info-key">Level</span>
            <span class="tm-info-value">${batteryStatus}</span>
          </div>
          ${batteryDetails}
        </div>

        <div class="tm-info-section">
          <div class="tm-info-title">Network</div>
          <div class="tm-info-item">
            <span class="tm-info-key">Online</span>
            <span class="tm-info-value">${info.online}</span>
          </div>
          <div class="tm-info-item">
            <span class="tm-info-key">Connection</span>
            <span class="tm-info-value">${info.connectionType}</span>
          </div>
          <div class="tm-info-item">
            <span class="tm-info-key">Speed</span>
            <span class="tm-info-value">${info.downlink}</span>
          </div>
        </div>

        <div class="tm-info-section">
          <div class="tm-info-title">Browser Capabilities</div>
          <div class="tm-info-item">
            <span class="tm-info-key">CPU cores</span>
            <span class="tm-info-value">${info.cores}</span>
          </div>
          <div class="tm-info-item">
            <span class="tm-info-key">Memory</span>
            <span class="tm-info-value">${info.memory}</span>
          </div>
          <div class="tm-info-item">
            <span class="tm-info-key">WebGL</span>
            <span class="tm-info-value">${info.webgl}</span>
          </div>
        </div>

        <div class="tm-info-section">
          <div class="tm-info-title">Screen</div>
          <div class="tm-info-item">
            <span class="tm-info-key">Resolution</span>
            <span class="tm-info-value">${info.resolution}</span>
          </div>
          <div class="tm-info-item">
            <span class="tm-info-key">Orientation</span>
            <span class="tm-info-value">${info.orientation}</span>
          </div>
        </div>
      </div>
    `;
  }

  async updateBrowserInfo() {
    const browserTab = this.appMain.querySelector('#browser-info-grid');
    if (!browserTab) return;
    const info = await this.getBrowserInfo();
    const newHtml = this.renderBrowserInfo(info);
    if (browserTab.innerHTML !== newHtml) {
      browserTab.innerHTML = newHtml;
    }
  }

  renderProcessTree(apps) {
    return apps.map((app, index) => {
      const isActive = app.modWindow && app.modWindow.classList.contains("active");
      const hasChildren = app.childApps && app.childApps.length > 0;
      const isExpanded = this.expandedApps.has(app);

      let status, type;
      status = app.isMinimized ? "Minimized" : (isActive ? "Active" : app.isBlocked ? "Blocked" : "Inactive");
      type = app.constructor.name || "Application";

      const rootSelected = this.selectedApp && this.selectedApp.rootIndex === index && this.selectedApp.childIndex == null;
      return `
        <div class="tm-process-item ${rootSelected ? "selected" : ""}" data-index="${index}" data-parent="root" data-child="false">
          <div class="tm-col-name">
            ${hasChildren ? `<span class="tm-expand-btn" data-expand="${!isExpanded}">›</span>` : '<span class="tm-spacer"></span>'}
            ${app.appName}
            ${hasChildren ? `<span class="tm-child-count">[${app.childApps.length}]</span>` : ''}
          </div>
          <div class="tm-col-status">${status}</div>
          <div class="tm-col-type">${type}</div>
        </div>
        ${isExpanded && app.childApps ? app.childApps.map((child, childIndex) => {
        const childStatus = child.isMinimized ? "Minimized" : (child.modWindow && child.modWindow.classList.contains("active") ? "Active" : child.isBlocked ? "Blocked" : "Inactive");
        const childType = "Dialog";
        const childSelected = this.selectedApp && this.selectedApp.rootIndex === index && this.selectedApp.childIndex === childIndex;
        return `
            <div class="tm-process-item tm-child-process ${childSelected ? "selected" : ""}" data-parent-index="${index}" data-child-index="${childIndex}" data-child="true">
              <div class="tm-col-name">
                <span class="tm-child-indent">└─</span>
                ${child.appName}
              </div>
              <div class="tm-col-status">${childStatus}</div>
              <div class="tm-col-type">${childType}</div>
            </div>
          `;
      }).join('') : ''}
      `;
    }).join("");
  }

  attachProcessListeners(container) {
    const expandBtns = container.querySelectorAll(".tm-expand-btn");
    expandBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const item = btn.closest(".tm-process-item");
        const index = parseInt(item.dataset.index);
        const apps = this.getApplications();
        const app = apps[index];

        if (this.expandedApps.has(app)) {
          this.expandedApps.delete(app);
        } else {
          this.expandedApps.add(app);
        }
        this.updateProcessList();
      });
    });

    const items = container.querySelectorAll(".tm-process-item");
    items.forEach(item => {
      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("tm-expand-btn")) return;

        this.clearSelection();
        item.classList.add("selected");

        const rootIndex = parseInt(item.dataset.index ?? item.dataset.parentIndex);
        const childIndex = item.dataset.childIndex !== undefined ? parseInt(item.dataset.childIndex) : null;
        this.selectedApp = childIndex !== null && !Number.isNaN(childIndex) ? { rootIndex, childIndex } : { rootIndex };
      });

      item.addEventListener("dblclick", (e) => {
        if (e.target.classList.contains("tm-expand-btn")) return;
        const rootIndex = parseInt(item.dataset.index ?? item.dataset.parentIndex);
        const childIndex = item.dataset.childIndex !== undefined ? parseInt(item.dataset.childIndex) : null;
        const app = this.getApplications()[rootIndex];
        const targetApp = childIndex !== null && app?.childApps ? app.childApps[childIndex] : app;
        if (targetApp && targetApp.modWindow) {
          targetApp.setActiveWindow();
        }
      });

      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.isLongPress && (e.pointerType === 'touch' || e.type.startsWith('touch'))) return;
        this.showContextMenu(e, item);
      });
    });

    container.addEventListener("click", (e) => {
      if (!e.target.closest('.tm-process-item')) {
        this.clearSelection();
      }
    });
    container.addEventListener("contextmenu", (e) => {
      if (e.target.closest('.tm-process-item')) return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.isLongPress && (e.pointerType === 'touch' || e.type.startsWith('touch'))) return;
      this.clearSelection();
      this.showBackgroundContextMenu(e);
    });
  }

  clearSelection() {
    this.appMain.querySelectorAll(".tm-process-item").forEach(i => i.classList.remove("selected"));
    this.selectedApp = null;
  }

  showContextMenu(e, item) {
    if (this.contextMenu) this.contextMenu.remove();
    const rootIndex = parseInt(item.dataset.index ?? item.dataset.parentIndex);
    const childIndex = item.dataset.childIndex !== undefined ? parseInt(item.dataset.childIndex) : null;
    const apps = this.getApplications();
    const app = apps[rootIndex];
    const targetApp = childIndex !== null && app?.childApps ? app.childApps[childIndex] : app;
    if (!targetApp) return;

    this.clearSelection();
    item.classList.add("selected");
    this.selectedApp = childIndex !== null && !Number.isNaN(childIndex) ? { rootIndex, childIndex } : { rootIndex };

    const isRootItem = item.dataset.child === "false";
    const rootHasChildren = isRootItem && app?.childApps && app.childApps.length > 0;
    const isExpanded = rootHasChildren && this.expandedApps.has(app);

    this.contextMenu = document.createElement("div");
    this.contextMenu.className = "context-menu";

    let html = `
      <div class="menu-item open">Activate</div>
      <div class="menu-item end">End Task</div>
    `;
    if (rootHasChildren) {
      html += `
        <div class="menu-item ${isExpanded ? 'collapse' : 'expand'}">${isExpanded ? 'Collapse' : 'Expand'}</div>
      `;
    }
    html += `
      <div class="menu-item refresh">Refresh List</div>
    `;

    this.contextMenu.innerHTML = html;
    this.appMain.appendChild(this.contextMenu);

    const closeMenu = () => {
      this.contextMenu?.remove();
      this.contextMenu = null;
    };

    const activateItem = () => {
      if (targetApp && targetApp.modWindow) targetApp.setActiveWindow();
      closeMenu();
    };
    const endItem = () => {
      this.closeAppAndChildren(targetApp);
      this.clearSelection();
      this.updateProcessList();
      closeMenu();
    };
    const toggleExpand = () => {
      if (!rootHasChildren) return;
      if (isExpanded) this.expandedApps.delete(app);
      else this.expandedApps.add(app);
      this.updateProcessList();
      closeMenu();
    };
    const refreshList = () => {
      this.updateProcessList();
      closeMenu();
    };

    this.contextMenu.querySelector('.open').onclick = activateItem;
    this.contextMenu.querySelector('.end').onclick = endItem;
    if (rootHasChildren) this.contextMenu.querySelector(isExpanded ? '.collapse' : '.expand').onclick = toggleExpand;
    this.contextMenu.querySelector('.refresh').onclick = refreshList;

    const rect = this.app.modWindow.getBoundingClientRect();
    const x = Math.max(10, Math.min(e.pageX - rect.left - window.scrollX, rect.width - this.contextMenu.offsetWidth));
    const y = Math.max(10, Math.min(e.pageY - rect.top - window.scrollY, rect.height - this.contextMenu.offsetHeight));
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".context-menu")) closeMenu();
    }, { once: true });
  }

  showBackgroundContextMenu(e) {
    if (this.contextMenu) this.contextMenu.remove();
    this.contextMenu = document.createElement("div");
    this.contextMenu.className = "context-menu";
    this.contextMenu.innerHTML = `<div class="menu-item refresh">Refresh List</div>`;
    this.appMain.appendChild(this.contextMenu);

    const closeMenu = () => {
      this.contextMenu?.remove();
      this.contextMenu = null;
    };

    this.contextMenu.querySelector('.refresh').onclick = () => {
      this.updateProcessList();
      closeMenu();
    };

    const rect = this.app.modWindow.getBoundingClientRect();
    const x = Math.max(10, Math.min(e.pageX - rect.left - window.scrollX, rect.width - this.contextMenu.offsetWidth));
    const y = Math.max(10, Math.min(e.pageY - rect.top - window.scrollY, rect.height - this.contextMenu.offsetHeight));
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".context-menu")) closeMenu();
    }, { once: true });
  }

  closeAppAndChildren(app) {
    if (!app) return;
    if (Array.isArray(app.childApps) && app.childApps.length > 0) {
      [...app.childApps].forEach(child => this.closeAppAndChildren(child));
    }
    if (app.parentApp) {
      const idx = app.parentApp.childApps.indexOf(app);
      if (idx > -1) app.parentApp.childApps.splice(idx, 1);
      if (app.parentApp.childApps && app.parentApp.childApps.length === 0) app.parentApp.unblockWindow();
      app.parentApp = null;
    }
    app.childApps = [];
    if (app.modWindow) {
      app.handleClose();
    }
  }

  endSelectedTask() {
    if (this.selectedApp !== null) {
      const apps = this.getApplications();
      const rootIndex = this.selectedApp.rootIndex;
      const childIndex = this.selectedApp.childIndex !== undefined ? this.selectedApp.childIndex : null;
      const app = apps[rootIndex];
      const targetApp = childIndex !== null && app?.childApps ? app.childApps[childIndex] : app;
      if (targetApp && targetApp.modWindow) {
        this.closeAppAndChildren(targetApp);
        this.clearSelection();
        this.updateProcessList();
      }
    }
  }
}

async function executeFile(path) {
  const answer = await new Dialog(
    'Confirm Execution',
    'Security Risk',
    'Executing code is dangerous. It can steal data or damage the system.\nOnly run if you trust the source.',
    'warning',
    ['Cancel', 'Run'],
    'Cancel'
  );
  if (answer === 'Run') {
    console.log("User confirmed execution. Running script...");
    try {
      (async function () {
        fileSystem.asyncReadFile(path).then((content) => { return fileSystem.decodeContent(content, 'text'); }).then((content) => {
          const app = new Function(content)();
          if (app && typeof app.execute === 'function') {
            app.execute();
          }
        })
      })();
    } catch (e) {
      throw new Error(`Execution error: ${e.message}`);
    }
  };
}
