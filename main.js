
class Desktop {
  constructor() {
    const path = '/bin/';
    this.apps = {
      explorer: {
        name: "File Explorer",
        class: "explorer",
        icon: icons.explorer,
        handler: () => new FileExplorer()
      },
      terminal: {
        name: "Terminal",
        class: "terminal",
        icon: icons.terminal,
        handler: () => new Terminal()
      },
      editor: {
        name: "Text Editor",
        class: "text",
        icon: icons.text,
        handler: () => new TextEditor()
      },
      imageViewer: {
        name: "Image Viewer",
        class: "image",
        icon: icons.image,
        handler: () => fileSystem.openFile(path + 'lion_photo.png', 'image')
      },
      videoPlayer: {
        name: "Video Player",
        class: "video",
        icon: icons.video,
        handler: () => fileSystem.openFile(path + 'lion_video.mp4', 'video')
      },
      gitHubLink: {
        name: "Open Source",
        icon: icons.github,
        handler: () => {
          if (confirm("You will be redirected to the open-source code page on GitHub. \nPlease confirm the action."))
            window.open('https://github.com/Davidhaba/TermX', '_blank');
        }
      }
    };
    Object.entries(this.apps).forEach(([id, app]) => {
      this.createDesktopIcon(app);
    });
  }
  
  createDesktopIcon(app) {
    const icon = document.createElement("div");
    icon.className = "desktop-icon";
    if (app.class) icon.classList.add(app.class);
    const image = document.createElement("div");
    image.className = "image";
    if (app.icon) image.innerHTML = app.icon;
    icon.appendChild(image);
    const label = document.createElement("div");
    label.className = "label";
    if (app.name) label.innerHTML = app.name;
    icon.appendChild(label);
    if (app.handler && typeof app.handler === "function") icon.addEventListener("click", () => app.handler.call(this));
    document.getElementById("desktop")?.appendChild(icon);
  }
}

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
    this.modWindow.addEventListener("mousedown", () => this.setActiveWindow());
    this.modWindow.addEventListener("touchstart", () => this.setActiveWindow());
    this.modWindow.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.handleClose();
    });
    this.modWindow.style.left = `${Math.random() * 50 + 10}px`;
    this.modWindow.style.top = `${Math.random() * 50 + 10}px`;
    this.transitionTimer = null;
    this.activeTouchId = null;
    this.setActiveWindow();
    this.updateTitle(title);
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
  }
  setupExitBtn(callback = null) {
    if (this.closeButton)
      this.closeButton.addEventListener("click", () => this.handleClose(callback));
  }
  async handleClose(callback = null) {
    if (callback && typeof callback === 'function' && await callback() === false) return;
    
    this.modWindow.style.animation = "anHide 0.2s forwards";
    setTimeout(() => {
      if (this.modWindow) {
        this.modWindow.style.display = "none";
        this.modWindow.remove();
        this.modWindow = null;
      }
    }, 300);
  }
  setupInfoBtn(name, text) {
    if (!text) return;
    const button = document.createElement("div");
    button.className = "control info";
    button.innerHTML = "i";
    button.onclick = () => { new Dialog(name, `What is ${name}?`, text, 'info', ['Ok'], 'Ok'); };
    this.titleBar.appendChild(button);
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
      this.modWindow.style.transition = "box-shadow 0.3s";
    } else {
      this.modWindow.style.transition = "all 0.3s";
    }
    this.transitionTimer = setTimeout(() => {
      this.modWindow.style.transition = "";
      this.transitionTimer = null;
    }, 300);
  }
  startDragging(e) {
    if (this.isMinimized || e.target.closest(".controls") || e.target.closest(".control")) return;
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
    if (!this.modWindow.classList.contains("active")) {
      document.querySelectorAll(".modal-window").forEach((window) => {
        window.classList.remove("active");
      });
      this.setTransition("shadow");
      this.modWindow.classList.add("active");
      this.bringToFront();
      this.modWindow.focus();
    }
  }
  bringToFront() {
    const maxZ = Math.max(
      ...[...document.querySelectorAll(".modal-window")].map((w) =>
        parseInt(w.style.zIndex || 100, 10)
      )
    );
    this.modWindow.style.zIndex = maxZ + 1;
  }
}

class Dialog {
  constructor(title, mainMessage, details, iconType, buttons, primaryButton) {
    return new Promise(resolve => {
      const app = new Modal(title);
      const appMain = app.appMain;
      app.modWindow.classList.add('dialog');
      appMain.classList.add("padd");
      const standart = 'Cancel';
      app.setupExitBtn(async () => {
        resolve(standart);
      });
      
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
      const closeDialog = (result) => {
        app.handleClose();
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
      'The Image Viewer is designed to display image files. It automatically adjusts to show the image content, with a clean interface that puts the focus on the media. It supports various image formats that can be loaded from the file system. Simply double-click on any image file to open it in this viewer.'
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

class AudioPlayer {
  constructor(path) {
    const name = path.split('/').pop();
    this.app = new Modal(name + " - Audio Player");
    this.appMain = this.app.appMain;
    this.app.setupExitBtn();
    this.app.setApp();
    this.app.setupInfoBtn('Audio Player',
      'The Audio Player is used for playing audio files. It has a standard set of controls, including play/pause and a timeline for navigation. The player supports popular audio formats like MP3. It’s a straightforward tool for listening to music or other sound files directly from your file system.'
    );
    this.music = document.createElement("audio");
    this.music.controls = true;
    this.music.className = "audio-player";
    const musicElement = document.createElement("div");
    musicElement.className = "audio-element";
    musicElement.appendChild(this.music);
    this.appMain.appendChild(musicElement);
    this.appMain.style.alignItems = "center";
    fileSystem
      .asyncReadFile(path)
      .then((content) => {
        return fileSystem.decodeContent(content, 'url');
      })
      .then((url) => {
        this.music.src = url;
        this.music.addEventListener("error", (e) => {
          console.error("Audio player: an error occurred");
        });
        this.setupMediaSession(name);
      })
      .catch((error) => {
        alert("Error loading file: " + error.message);
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
}

class FileExplorer {
  constructor() {
    this.app = new Modal("File Explorer");
    this.appMain = this.app.appMain;
    this.appMain.classList.add("padd");
    this.modWindow = this.app.modWindow;
    this.app.setApp();
    this.app.setupInfoBtn('File Explorer',
      'The File Explorer is a simple file management tool. You can navigate through folders by double-clicking on them and go back using the "←" button. You can sort items by name, type, and size using the buttons at the top. To manage files and folders, right-click on an item to open a context menu with options like "Open", "Rename", and "Delete". You can also create new files or folders by right-clicking in an empty space within the window.'
    );
    this.selectedItem = null;
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
    this.currentPath.addEventListener("blur", () => this.updatePath());
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
      e.preventDefault();
      this.showContextMenu(e);
    });
    this.sortButtons.forEach(
      (btn) => (btn.onclick = () => this.handleSort(btn.dataset.sort))
    );
  }
  updatePath() {
    this.currentPath.readOnly = true;
    try {
      this.context.path = fileSystem.cd(this.context.path, this.currentPath.value);
    } catch (e) {}
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
  
  updateFileList() {
    const files = this.getSortedFiles();
    this.fileList.innerHTML =
      files.map((f) => `
      <div class="file-item ${f.type} ${
            this.selectedItem === f.name ? "selected" : ""
          }" data-name="${f.name}">
          <span class="file-icon">${this.getFileIcon(f)}</span>
          <span class="file-name">${f.name}</span>
        <span class="file-type">${f.type === 'directory' ? 'Folder' : fileSystem.getFileType(f.name).display}</span>
        <span class="file-size">${this.formatItemInfo(f)}</span>
      </div>`)
      .join("") || '<p class="emptyFolder">This folder is empty.</p>';
  }
  getFileIcon(f) {
    if (f.type === "directory" && icons.folder) return icons.folder;
    if (f.type === "file") {
      let fileType = fileSystem.getFileType(f.name).type;
      fileType = 'file' + fileType.charAt(0).toUpperCase() + fileType.slice(1).toLowerCase();
      if (icons[fileType]) return icons[fileType];
    }
    return icons.fileUnvalid;
  }
  navigateUp() {
    const newPath = fileSystem.cd(this.context.path, "..");
    if (newPath) this.context.path = newPath;
    this.updateUI();
  }
  createNewFolder() {
    const n = prompt("Enter folder name:");
    n && fileSystem.mkdir(this.context.path, n) && this.updateFileList();
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
      this.contextMenu.querySelector(".open").onclick = () =>
        this.openSelected();
      if (file && file.type === "file")
        this.contextMenu.querySelector(".open-as").onclick = () =>
        this.openAsSelected();
      this.contextMenu.querySelector(".rename").onclick = () =>
        this.renameSelected();
      this.contextMenu.querySelector(".delete").onclick = () =>
        this.deleteSelected();
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
      if (e.target.closest(".context-menu")) this.clearSelection();
      this.contextMenu?.remove();
    }, { once: true });
  }
  clearSelection() {
    this.selectedItem = null;
    this.fileList
      .querySelectorAll(".file-item")
      .forEach((i) => i.classList.remove("selected"));
  }
  createNewFile() {
    const n = prompt("Enter file name:");
    n && fileSystem.touch(this.context.path, n) && this.updateFileList();
  }
  updateUI() {
    this.clearSelection();
    this.fileList.innerHTML = "";
    this.currentPath.value = this.context.path;
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
        } catch (error) {
          console.error(error.message);
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
    const n = prompt("New name:", this.selectedItem);
    if (!n) return;
    try {
      fileSystem.mv(fileSystem.getResolvedPath(this.context.path, this.selectedItem), fileSystem.getResolvedPath(this.context.path, n));
      this.updateUI();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
  deleteSelected() {
    if (confirm(`Delete ${this.selectedItem}?`)) {
      fileSystem.rm(this.context.path, this.selectedItem, true);
      this.updateUI();
    }
  }
  async copyPath() {
    let path = this.context.path;
    if (this.selectedItem) path = fileSystem.getResolvedPath(path, this.selectedItem);
    await copyText(path);
  }
}

class VideoPlayer {
  constructor(path) {
    const name = path.split('/').pop();
    this.app = new Modal(name + " - Video Player");
    this.appMain = this.app.appMain;
    this.app.setApp();
    this.app.setupInfoBtn('Video Player',
      'The Video Player is a versatile tool for watching videos. It includes comprehensive controls for playback, volume, and progress, as well as an advanced settings menu. Here you can adjust the video scale to "Fit", "Fill", or "Stretch", change the playback speed, and control the zoom level. It also supports keyboard shortcuts for easy control (e.g., Space to play/pause, F for fullscreen, and arrow keys for seeking).'
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
                                          `<option value="${speed}" ${
                                            speed === 1 ? "selected" : ""
                                          }>${speed}x</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="settings-item">
                                <label>Zoom:</label>
                                <div class="zoom-controls">
                                    <button class="zoom-out">-</button>
                                    <span class="zoom-level">${
                                      this.zoomLevel
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
      } catch {}
    });
    this.video.addEventListener("error", (e) => {
      console.error("Video player: an error occurred");
    });
    this.videoContainer.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        screen.orientation.lock('landscape');
      } else {
        screen.orientation.unlock();
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
      } catch {}
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
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    this.timeCurrent.textContent = formatTime(this.video.currentTime);
    this.timeEnd.textContent = formatTime(this.video.duration);
  }
  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => { this.fullscreenBtn.innerHTML = icons.fullscreen; }).catch(() => {});
    } else {
      this.videoContainer.requestFullscreen().then(() => { this.fullscreenBtn.innerHTML = icons.minFullscreen; }).catch(() => {});
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
