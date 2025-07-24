#  Shuttlr

**Shuttlr** is a peer-to-peer (P2P) file sharing application built using **WebRTC** and **WebSocket**, enabling fast and secure file transfers over the internet. The app runs as a cross-platform desktop application using **Tauri**.

## 🌟 Features

- 🔁 **P2P File Sharing** - Direct file transfers between devices
- 📡 **Real-time Communication** - Uses WebRTC and WebSocket for instant connectivity
- 💻 **Desktop & Web App** - Built with Tauri for native performance
- ⚡ **Lightweight & Fast** - Minimal resource usage with maximum speed
- 🔒 **Secure Transfers** - End-to-end encrypted file sharing
- 🌐 **No Server Required** - Direct peer-to-peer connections

## 📋 Prerequisites

Before building Shuttlr, ensure you have the following installed:

- **Node.js** (v16 or higher) - *For development and building only*
- **npm** - *For dependency management*
- **Rust** (latest stable version)

## 🛠️ Installation & Build Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/kshitijchauhann/shuttlr-tauri.git
cd shuttlr-tauri
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Development Mode (Optional)

To run the app in development mode:

```bash
npm run tauri dev
```

### Step 4: Build for Production

```bash
npm run build
npx tauri build
```

After building, the executable will be available at:
```
src-tauri/target/release/
```

## 📦 Creating Windows Installer (Optional)

To create a Windows installer for easier distribution:

### Prerequisites
1. Download and install [NSIS (Nullsoft Scriptable Install System)](https://nsis.sourceforge.io/)

### Steps
1. Navigate to the NSIS script location:
   ```
   src-tauri/target/release/nsis/x64/installer.nsi
   ```

2. Right-click on `installer.nsi` and select "Compile NSIS Script"

3. The installer will be generated at:
   ```
   src-tauri/target/release/nsis/x64/nsis-output/
   ```

## 🚀 Usage

1. Launch Shuttlr on both devices
2. One device creates a sharing session
3. Share the generated code/link with the recipient
4. The recipient enters the code to establish connection
5. Select files and start transferring!

## 🔧 Technology Stack

- **Frontend**: HTML, CSS, TypeScript
- **Backend**: Tauri (Rust)
- **P2P Communication**: WebRTC
- **Real-time Messaging**: WebSocket
- **Build Tool**: Tauri CLI
- **Development**: Node.js (build-time only)

## 📱 Supported Platforms

- ✅ Windows
- ✅ Web

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/kshitijchauhann/shuttlr-tauri/issues) page
2. Create a new issue with detailed information
3. Include your OS, Node.js version, and error logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/) framework
- Uses [WebRTC](https://webrtc.org/) for peer-to-peer communication
- Inspired by the need for simple, secure file sharing

---

**Made with ❤️ by [Kshitij Chauhan](https://github.com/kshitijchauhann)**

⭐ If you find this project useful, please consider giving it a star!
