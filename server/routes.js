import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { spawn, exec } from 'child_process';
import os from 'os';
import {
  getPrimaryLocalIP,
  getLocalIPAddresses,
  getDeviceOS,
  saveDeviceConfig,
} from './networkUtils.js';

export function createRouter(config, discovery, transferEngine, serverPort) {
  const router = express.Router();

  // Temporary storage for incoming chunk streams
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const targetDir = config.downloadsDir;
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
      },
      filename: (req, file, cb) => {
        let cleanName = file.originalname;
        try {
          cleanName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) {}
        const safeName = transferEngine.getSafeFilePath(
          config.downloadsDir,
          cleanName
        );
        cb(null, path.basename(safeName));
      },
    }),
    limits: { fileSize: 1024 * 1024 * 1024 * 100 }, // 100GB limit
  });

  /**
   * Device Information & Status
   */
  router.get('/info', (req, res) => {
    res.json({
      id: config.id,
      name: config.name,
      visible: config.visible,
      os: getDeviceOS(),
      primaryIP: getPrimaryLocalIP(),
      allIPs: getLocalIPAddresses(),
      port: serverPort,
      downloadsDir: config.downloadsDir,
    });
  });

  /**
   * Toggle or Set Visibility
   */
  router.post('/visibility', (req, res) => {
    const { visible } = req.body;
    const newVisibility = visible !== undefined ? Boolean(visible) : !config.visible;
    discovery.setVisibility(newVisibility);
    saveDeviceConfig(config);

    res.json({
      success: true,
      visible: config.visible,
      message: config.visible ? 'الجهاز الآن مكشوف على الشبكة' : 'الجهاز الآن في وضع التخفي (مخفي)',
    });
  });

  /**
   * Rename Device
   */
  router.post('/device-name', (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    discovery.setName(name.trim());
    saveDeviceConfig(config);

    res.json({
      success: true,
      name: config.name,
    });
  });

  /**
   * Get Active Discovered Peers
   */
  router.get('/peers', (req, res) => {
    res.json({
      peers: discovery.getPeersList(),
      myId: config.id,
    });
  });

  /**
   * Trigger Active Subnet Scan
   */
  router.post('/peers/scan', async (req, res) => {
    if (discovery.scanner) {
      discovery.scanner.scanSubnet();
    }
    discovery.announce('ANNOUNCE');
    res.json({
      success: true,
      message: 'جاري فحص عناوين الشبكة المحلية...',
      peers: discovery.getPeersList(),
    });
  });

  /**
   * Register a Mobile Web Client (Direct Peer Handshake)
   */
  router.post('/peers/register', (req, res) => {
    const { id, name, os: clientOS } = req.body;
    const clientIP = req.ip?.replace(/^::ffff:/, '') || req.socket.remoteAddress;

    if (id && name) {
      discovery.addOrUpdatePeer({
        id,
        name,
        ip: clientIP,
        port: serverPort,
        os: clientOS || 'mobile',
        visible: true,
      });
    }

    res.json({
      success: true,
      registeredPeer: { id, name, ip: clientIP },
      host: {
        id: config.id,
        name: config.name,
        os: getDeviceOS(),
      },
    });
  });

  /**
   * Request File Transfer
   */
  router.post('/transfer/request', (req, res) => {
    const { sender, recipient, files } = req.body;

    if (!sender || !recipient || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Sender, recipient, and files array are required' });
    }

    const transfer = transferEngine.createTransferRequest(sender, recipient, files);
    res.json({
      success: true,
      transferId: transfer.id,
      status: transfer.status,
    });
  });

  /**
   * Query status of a transfer request (for sender polling)
   */
  router.get('/transfer/status/:transferId', (req, res) => {
    const transfer = transferEngine.getTransfer(req.params.transferId);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer session not found or expired' });
    }
    res.json({
      id: transfer.id,
      status: transfer.status,
      bytesTransferred: transfer.bytesTransferred,
      totalBytes: transfer.totalBytes,
      speedBps: transfer.speedBps,
    });
  });

  /**
   * Receiver responds to transfer request (Accept / Decline)
   */
  router.post('/transfer/respond', (req, res) => {
    const { transferId, decision, responderId } = req.body;
    if (!transferId || !decision) {
      return res.status(400).json({ error: 'transferId and decision (accept/decline) are required' });
    }

    const result = transferEngine.respondToTransfer(transferId, decision, responderId);
    res.json(result);
  });

  /**
   * High-Speed Upload Endpoint with real-time stream chunk progress tracking
   */
  router.post(
    '/transfer/upload',
    (req, res, next) => {
      const transferId = req.query.transferId || req.headers['x-transfer-id'];
      if (transferId) {
        req.on('data', (chunk) => {
          transferEngine.updateProgress(transferId, 0, chunk.length);
        });
      }
      next();
    },
    upload.array('files'),
    (req, res) => {
      const transferId = req.body?.transferId || req.query?.transferId || req.headers['x-transfer-id'];
      const uploadedFiles = req.files || [];

      const transfer = transferEngine.getTransfer(transferId);
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer session not found' });
      }

      // Process completed files
      uploadedFiles.forEach((f, idx) => {
        transferEngine.completeFile(transferId, idx, f.path);
      });

      res.json({
        success: true,
        uploadedCount: uploadedFiles.length,
        files: uploadedFiles.map((f) => ({ name: f.originalname, size: f.size })),
      });
    }
  );

  /**
   * Stream File Upload (Chunked Stream for ultimate throughput)
   */
  router.post('/transfer/stream/:transferId/:fileIndex', (req, res) => {
    const { transferId, fileIndex } = req.params;
    let originalFileName = `file_${fileIndex}`;
    try {
      originalFileName = req.headers['x-file-name']
        ? decodeURIComponent(req.headers['x-file-name'])
        : `file_${fileIndex}`;
    } catch (e) {
      originalFileName = req.headers['x-file-name'] || `file_${fileIndex}`;
    }
    const transfer = transferEngine.getTransfer(transferId);

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer session not found' });
    }

    const targetPath = transferEngine.getSafeFilePath(config.downloadsDir, originalFileName);
    const writeStream = fs.createWriteStream(targetPath);

    req.on('data', (chunk) => {
      transferEngine.updateProgress(transferId, Number(fileIndex), chunk.length);
    });

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      transferEngine.completeFile(transferId, Number(fileIndex), targetPath);
      res.json({ success: true, savedPath: targetPath });
    });

    writeStream.on('error', (err) => {
      console.error('File stream error:', err);
      res.status(500).json({ error: err.message });
    });
  });

  /**
   * View / Stream a file directly in browser (for videos, audio, images, PDFs)
   */
  router.get('/transfer/view/:transferId/:fileIndex', (req, res) => {
    const { transferId, fileIndex } = req.params;
    const transfer = transferEngine.getTransfer(transferId);

    let targetPath = transfer?.files?.[Number(fileIndex)]?.savedPath;
    if (!targetPath) {
      const historyItem = transferEngine.getHistory().find((h) => h.id === transferId);
      targetPath = historyItem?.savedPath;
    }

    if (targetPath && fs.existsSync(targetPath)) {
      res.setHeader('Content-Disposition', 'inline');
      return res.sendFile(path.resolve(targetPath));
    }

    res.status(404).json({ error: 'File on disk not found' });
  });

  /**
   * Download a completed transfer file (for web/mobile clients)
   */
  router.get('/transfer/download/:transferId/:fileIndex', (req, res) => {
    const { transferId, fileIndex } = req.params;
    const transfer = transferEngine.getTransfer(transferId);
    
    // Check in active transfers or history
    let targetFile = transfer?.files?.[Number(fileIndex)];
    if (!targetFile || !targetFile.savedPath) {
      const historyItem = transferEngine.getHistory().find((h) => h.id === transferId);
      if (historyItem && historyItem.savedPath && fs.existsSync(historyItem.savedPath)) {
        return res.download(historyItem.savedPath, historyItem.firstFileName);
      }
      return res.status(404).json({ error: 'File not found' });
    }

    if (fs.existsSync(targetFile.savedPath)) {
      return res.download(targetFile.savedPath, targetFile.name);
    }

    res.status(404).json({ error: 'File on disk not found' });
  });

  /**
   * Transfer History
   */
  router.get('/history', (req, res) => {
    res.json({
      history: transferEngine.getHistory(),
      downloadsDir: config.downloadsDir,
    });
  });

  /**
   * Direct download for FileFly Desktop Application (if available) or redirect to PWA
   */
  router.get('/download-app/windows', (req, res) => {
    const searchDirs = [
      path.join(process.cwd(), 'release'),
      path.resolve('release'),
      path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'release'),
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const zipFile = files.find((f) => f.toLowerCase().endsWith('.zip'));
        const portableFile = files.find((f) => (f.toLowerCase().includes('portable') || !f.toLowerCase().includes('setup')) && f.toLowerCase().endsWith('.exe') && !f.includes('.blockmap'));
        const fallbackExe = files.find((f) => f.toLowerCase().endsWith('.exe') && !f.includes('.blockmap'));
        const targetFile = portableFile || fallbackExe || zipFile;

        if (targetFile) {
          return res.download(path.join(dir, targetFile), targetFile);
        }
      }
    }

    // Redirect to home with PWA install indicator
    res.redirect('/?install=pwa');
  });

  /**
   * Open Downloads Folder in OS File Explorer (or highlight file)
   */
  router.post('/open-downloads', (req, res) => {
    const { filePath } = req.body || {};
    const defaultDownloads = path.join(os.homedir(), 'Downloads');
    const dir = config.downloadsDir || defaultDownloads;

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const osType = getDeviceOS();
      if (osType === 'windows') {
        if (filePath && fs.existsSync(filePath)) {
          // Open Explorer and highlight the exact file
          const normFile = path.normalize(filePath);
          exec(`explorer.exe /select,"${normFile}"`, (err) => {
            if (err) {
              exec(`explorer.exe "${path.normalize(dir)}"`);
            }
          });
        } else {
          exec(`explorer.exe "${path.normalize(dir)}"`);
        }
      } else if (osType === 'mac') {
        if (filePath && fs.existsSync(filePath)) {
          exec(`open -R "${filePath}"`);
        } else {
          exec(`open "${dir}"`);
        }
      } else if (osType === 'linux') {
        exec(`xdg-open "${dir}"`);
      }

      res.json({ success: true, path: dir });
    } catch (err) {
      console.error('[OpenDownloads Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Open / Launch / Play Received File in Default OS Application
   */
  router.post('/open-file', (req, res) => {
    const { transferId, filePath, fileName } = req.body || {};
    let targetPath = filePath;

    if (!targetPath && transferId) {
      const transfer = transferEngine.getTransfer(transferId);
      targetPath = transfer?.files?.[0]?.savedPath;
      if (!targetPath) {
        const historyItem = transferEngine.getHistory().find((h) => h.id === transferId);
        targetPath = historyItem?.savedPath;
      }
    }

    const defaultDir = config.downloadsDir || path.join(os.homedir(), 'Downloads');

    if (!targetPath && fileName) {
      targetPath = path.join(defaultDir, fileName);
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      // Fallback: check in default downloads directory
      if (fileName && fs.existsSync(path.join(defaultDir, fileName))) {
        targetPath = path.join(defaultDir, fileName);
      } else {
        return res.status(404).json({ error: 'File not found on disk' });
      }
    }

    try {
      const osType = getDeviceOS();
      if (osType === 'windows') {
        const norm = path.normalize(targetPath);
        const escaped = norm.replace(/'/g, "''");
        exec(`powershell -NoProfile -Command "Start-Process -LiteralPath '${escaped}'"`, (err) => {
          if (err) {
            exec(`cmd.exe /c start "" "${norm}"`);
          }
        });
      } else if (osType === 'mac') {
        exec(`open "${targetPath}"`);
      } else if (osType === 'linux') {
        exec(`xdg-open "${targetPath}"`);
      }

      res.json({ success: true, opened: targetPath });
    } catch (err) {
      console.error('[OpenFile Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Generate QR Code for Mobile Quick Connect
   */
  router.get('/qr', async (req, res) => {
    const localIP = getPrimaryLocalIP();
    const connectUrl = `http://${localIP}:${serverPort}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(connectUrl, {
        margin: 2,
        width: 280,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      res.json({
        url: connectUrl,
        qrDataUrl,
        port: serverPort,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  return router;
}
