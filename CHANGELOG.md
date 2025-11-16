# Changelog

All notable changes to this project are documented below. Click on any version to see detailed changes.

---

<details>
<summary><strong>📦 Version 1.0.0 (Initial Release)</strong></summary>

Initial release of the application. Basic functionality established.

</details>

---

<details>
<summary><strong>🚀 Version 4.3.0</strong></summary>

### Major User Changes
- Interface is now more modern and "macOS-like": new windows, smooth animations, and control buttons for closing/minimizing.
- The application now remembers your file system between sessions (data is stored locally), so created files/folders will persist after page reload.
- Audio Player added: you can open and play mp3 files with playback controls, volume adjustment, and a progress bar.
- Video Player improved: progress controller, playback speed control, zoom/scaling, fullscreen mode, and better keyboard controls (keyboard shortcuts and double-click for fullscreen).
- Text Editor now has a statistics panel (lines, characters, size, encoding) and "Save"/"Save As" functions with hotkey support (Ctrl+S, Ctrl+N).
- File Explorer now displays file type and size in the list, has sorting (by name, type, size), and a context menu with useful actions (open, rename, delete, copy path).
- Added ability to unzip archive files directly in the file system ("Unarchive" command) with progress indication.
- Improved command input convenience: hints, auto-completion, support for quoted arguments, and a built-in virtual keyboard for mobile screens.

### Visual Appearance (UI)
- New application icons (Explorer, Terminal, Editor, Gallery, Video, Audio). Scaled SVG icons instead of emojis.
- Progress bars for downloads and simulations display the file name, percentage, and size in a convenient format (KB/MB).

### Functionality — What You Can Do Now
- Save files in your browser: create a file in the file explorer or via command — it will persist after reload.
- Open photos/videos/audio directly from the explorer — built-in viewers for all media types.
- Unzip archives: use the `unarchive` command to extract files from an archive.
- Quick actions in explorer: copy file path, rename or delete, create new files/folders.
- Terminal work: command hints, command history, ability to chain commands with `&&`, download tools (`download`, `progress`).

### Security and Risky Action Handling
- Before executing JavaScript code from a file, the application asks for confirmation and displays a warning (to prevent execution of potentially harmful code).
- Network downloads use a proxy (corsproxy.io) to bypass CORS errors.

### Small but Useful Changes
- Hints when typing in terminal (auto-completion)
- Interactive confirmation dialogs when exiting editor (save changes prompt)
- Ability to copy file path to clipboard via context menu
- Persistence of panel states and open window positions during a session

</details>

---

<details>
<summary><strong>🔧 Version 4.3.1</strong></summary>

Add your changes here...

</details>
