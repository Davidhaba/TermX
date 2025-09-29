## TermX: A Web-Based macOS Terminal and File System Simulator

TermX is an interactive, web-based simulator that emulates the look and feel of a macOS terminal and file explorer. It's a fun and practical project designed to showcase a modern, dynamic web application that operates a virtual file system directly in your browser.

**🚀 Live Demo: [TermX (MacOS)](https://davidhaba.github.io/TermX/)**

---

### ✨ Key Features

#### 🖥️ Interactive Terminal
- **Unix-like Commands**: `ls`, `cd`, `mkdir`, `touch`, `cat`, `echo`, `rm`, `mv`, `cp`, `clear`
- **File Operations**: Create, delete, move, copy files and directories
- **Network Tools**: Download files from URLs with progress tracking
- **Special Modes**: Math calculation mode and command chaining with `&&`
- **Auto-completion**: Tab completion for commands and file names

#### 📁 File Explorer
- **Visual Navigation**: Double-click folders, breadcrumb navigation
- **Context Menu**: Right-click for open, rename, delete, copy path operations
- **Smart Sorting**: Sort by name, type, or size with visual indicators
- **Move/Rename**: Rename dialog supports moving files between directories

#### 🛠️ Built-in Applications
- **Text Editor**: Full-featured editor with save/load capabilities (`Ctrl+S`, `Ctrl+N`)
- **Media Players**: Image viewer, video player, and audio player
- **File Type Support**: Automatic detection and appropriate application launching

#### 🎨 User Experience
- **macOS-inspired UI**: Familiar window management with minimize/maximize/close
- **Drag & Drop**: Move windows by dragging title bars
- **Mobile Support**: Touch-optimized interface with virtual keyboard
- **Persistent Storage**: File system saved in browser localStorage

---

### 🚀 Quick Start

1. **Visit the live demo** above
2. **Click desktop icons** to launch applications
3. **Use the terminal** for command-line operations:
   ```bash
   mkdir documents
   cd documents
   touch hello.txt
   echo "Welcome to TermX" > hello.txt
   cat hello.txt


1. Right-click in File Explorer for context menu options
2. Double-click files to open with appropriate applications

---

🛠️ Technical Highlights

· Pure JavaScript implementation
· Virtual File System with persistent storage
· SVG Icon System with 40+ custom icons
· Responsive Design for desktop and mobile
· No backend required - runs entirely in browser

---

👨‍💻 Credits

Developed by David as a demonstration of modern front-end development capabilities.

For detailed technical documentation, see DOCUMENTATION.txt
