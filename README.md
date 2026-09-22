<p align="center">
  <img src="public/icon-192.png" alt="FileFly Logo" width="110" height="110" style="border-radius: 24px;">
</p>

<h1 align="center">FileFly</h1>

<p align="center">
  <strong>Fast, Private & Cross-Platform Local File Transfer</strong><br>
  <em>An effortless, offline AirDrop alternative between Windows PC and Mobile devices (iPhone, Android, Mac & Linux).</em>
</p>

<p align="center">
  <a href="https://github.com/De4d0t/File-Fly/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-0284c7?style=for-the-badge&logo=github" alt="Release"></a>
  <a href="https://filefly9.vercel.app/"><img src="https://img.shields.io/badge/Website-filefly9.vercel.app-6366f1?style=for-the-badge&logo=vercel" alt="Website"></a>
  <a href="https://github.com/De4d0t/File-Fly/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-38bdf8?style=for-the-badge" alt="License"></a>
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20iOS%20%7C%20Android-0f172a?style=for-the-badge&logo=windows" alt="Platform">
  <img src="https://img.shields.io/badge/Network-100%25%20Offline%20LAN-10b981?style=for-the-badge" alt="Offline">
</p>

---

## ⚡ What is FileFly?

**FileFly** is a modern, ultra-fast, and secure file sharing application designed to bridge the gap between **Windows PCs and mobile phones (iPhone & Android)** over your local Wi-Fi network. 

No internet connection, no Bluetooth pairing headaches, no cloud accounts, and **zero app installation required on mobile devices** — simply scan a QR code with your camera and start transferring at full router speed!

---

## ✨ Key Features

- 🚀 **Full Wi-Fi Speeds (Up to 100MB/s):** Transfers gigabytes of 4K videos, photos, and zip files in seconds, orders of magnitude faster than Bluetooth or slow cloud uploads.
- 🔒 **100% Offline & Private:** Zero internet data touched. Your files never leave your local Wi-Fi router. Works seamlessly even during internet outages or over a phone mobile hotspot.
- 📱 **Zero-Install Mobile Web Client:** Phone users don't need to install anything from the App Store or Google Play. Just scan the desktop QR code to open the responsive Web Client.
- 📁 **Full Folder Transfer & Auto-ZIP:** Drag and drop entire multi-gigabyte folder structures; FileFly packages and extracts them on the fly.
- 📋 **Instant Clipboard & Text Sharing:** Send links, notes, and text snippets between your phone and computer in real-time.
- 🖥️ **Sleek Desktop Experience:** Frameless, modern dark glassmorphic UI built with Electron, featuring system tray controls, taskbar integration, and native drag-and-drop.
- 📜 **Private Transfer History:** Beautiful two-tier history log kept 100% private to each individual device.

---

## 🚀 Quick Start (For Users)

1. Download the latest portable executable from [**GitHub Releases**](https://github.com/De4d0t/File-Fly/releases/latest/download/FileFly.exe) or visit our [**Official Website**](https://filefly9.vercel.app/).
2. Launch `FileFly.exe` on Windows (requires no installation).
3. Connect your phone to the same Wi-Fi network.
4. Scan the on-screen QR code with your phone camera.
5. Drag and drop any files or folders to send them instantly!

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Desktop Shell** | **Electron 34** | Frameless window, system notifications, tray & native drag-and-drop |
| **Frontend UI** | **React 18 + Vite 6 + Tailwind CSS** | Fast, responsive glassmorphic UI for desktop & mobile browsers |
| **Backend Server** | **Node.js + Express 4** | Serves the web interface and handles streaming multipart file uploads |
| **Realtime Sync** | **WebSockets (`ws`)** | Instant bidirectional peer presence, transfer approvals, and progress |
| **Peer Discovery** | **UDP Broadcast (`53317`)** | Automatic local network device discovery |
| **Network Engine** | **Dynamic IP + mDNS (`fly.local`)** | Automatic router IP detection and zero-config local hostname |
| **Landing Website** | **Next.js 14 + Tailwind CSS** | [filefly9.vercel.app](https://filefly9.vercel.app/) — Official live landing page & web portal |

---

## 💻 Developer Guide (Running from Source)

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- `npm` (bundled with Node.js)

### 1. Clone the repository
```bash
git clone https://github.com/De4d0t/File-Fly.git
cd File-Fly
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
* Backend server runs on: `http://localhost:53316`
* Vite hot-reload frontend runs on: `http://localhost:5173`

### 4. Build the Standalone Windows Executable
```bash
npm run build:exe
```
The compiled, portable `.exe` will be ready inside the `dist-app/` directory!

---

## 🌐 Official Website (Landing Page)

Visit the live official website:  
👉 **[https://filefly9.vercel.app/](https://filefly9.vercel.app/)**

The landing website source code is located in the `website/` directory. To run it locally:

```bash
cd website
npm install
npm run dev
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by <strong>FileFly Team</strong> • Built for speed, privacy, and simplicity.
</p>
