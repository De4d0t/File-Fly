import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
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
        const transferId = req.query?.transferId || req.headers['x-transfer-id'] || req.body?.transferId;
        const targetDir = transferEngine.getTransferDir(transferId);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
      },
      filename: (req, file, cb) => {
        const transferId = req.query?.transferId || req.headers['x-transfer-id'] || req.body?.transferId;
        const targetDir = transferEngine.getTransferDir(transferId);
        let cleanName = file.originalname;
        try {
          cleanName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) {}
        const safeName = transferEngine.getSafeFilePath(
          targetDir,
          cleanName
        );
        cb(null, path.basename(safeName));
      },
    }),
    limits: { fileSize: 1024 * 1024 * 1024 * 100 }, // 100GB limit
  });

  /**
   * Health Probe endpoint for auto-reconnect & discovery
   */
  router.get('/health', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').replace(/^.*:/, '');
    const localIPs = ['127.0.0.1', 'localhost', ...getLocalIPAddresses().map((a) => a.address)];
    const isHost = localIPs.includes(clientIp) || req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    res.json({
      status: 'ok',
      id: config.id,
      name: config.name,
      primaryIP: getPrimaryLocalIP(),
      port: serverPort,
      isHost,
      timestamp: Date.now(),
    });
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
   * QR Code Generation Endpoint
   */
  router.get('/qr', async (req, res) => {
    try {
      const primaryIP = getPrimaryLocalIP();
      const targetUrl = `http://${primaryIP}:${serverPort}`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        margin: 2,
        width: 280,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      res.json({
        url: targetUrl,
        qrDataUrl,
        port: serverPort,
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
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
   * Trigger Peer Announcement & Refresh
   */
  router.post('/peers/scan', async (req, res) => {
    discovery.announce('ANNOUNCE');
    res.json({
      success: true,
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
    const { sender, recipient, files, batch } = req.body;

    if (!sender || !recipient || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Sender, recipient, and files array are required' });
    }

    const transfer = transferEngine.createTransferRequest(sender, recipient, files, batch);
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
      savedPath: transfer.savedPath || transfer.files?.[0]?.savedPath || null,
      acceptedFileNames: transfer.acceptedFileNames || null,
    });
  });

  /**
   * Receiver responds to transfer request (Accept / Decline)
   */
  router.post('/transfer/respond', (req, res) => {
    const { transferId, decision, responderId, acceptedFileNames } = req.body;
    if (!transferId || !decision) {
      return res.status(400).json({ error: 'transferId and decision (accept/decline) are required' });
    }

    const result = transferEngine.respondToTransfer(transferId, decision, responderId, acceptedFileNames);
    res.json(result);
  });

  /**
   * Cancel transfer (sender or receiver cancels before or during transfer)
   */
  router.post('/transfer/cancel', (req, res) => {
    const { transferId, reason } = req.body;
    if (!transferId) {
      return res.status(400).json({ error: 'transferId is required' });
    }
    transferEngine.cancelTransfer(transferId, reason || 'User cancelled');
    res.json({ success: true, message: 'Transfer cancelled' });
  });

  /**
   * Remove single file from transfer before or during request
   */
  router.post('/transfer/remove-file', (req, res) => {
    const { transferId, fileName } = req.body;
    if (!transferId || !fileName) {
      return res.status(400).json({ error: 'transferId and fileName are required' });
    }
    const result = transferEngine.removeFileFromTransfer(transferId, fileName);
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

    const targetDir = transferEngine.getTransferDir(transferId);
    const targetPath = transferEngine.getSafeFilePath(targetDir, originalFileName);
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
    
    // Only allow download from active transfer sessions
    let targetFile = transfer?.files?.[Number(fileIndex)];
    let filePath = targetFile?.savedPath;
    let fileName = targetFile?.name;

    if (filePath && fs.existsSync(filePath)) {
      const safeName = fileName || path.basename(filePath);
      const encodedName = encodeURIComponent(safeName);
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      res.sendFile(path.resolve(filePath), (err) => {
        if (!err && transferEngine.isTransitTransfer(transferId)) {
          // Temporary transit file: wipe from server immediately after recipient finishes download
          setTimeout(() => {
            transferEngine.cleanupTransitFiles(transferId);
          }, 2000);
        }
      });
      return;
    }

    res.status(404).json({ error: 'File not found or transfer session expired' });
  });

  /**
   * Download all files in a transfer bundled as a single ZIP archive (for mobile/multi-file)
   */
  router.get('/transfer/download-zip/:transferId', (req, res) => {
    const { transferId } = req.params;
    const transfer = transferEngine.getTransfer(transferId);
    let files = transfer?.files || [];

    const validFiles = files.filter((f) => f.savedPath && fs.existsSync(f.savedPath));
    if (!validFiles.length) {
      return res.status(404).json({ error: 'No files found or transfer session expired' });
    }

    const zipFileName = `FileFly_${validFiles.length}_files.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"; filename*=UTF-8''${encodeURIComponent(zipFileName)}`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) res.status(500).send({ error: err.message });
    });

    res.on('finish', () => {
      if (transferEngine.isTransitTransfer(transferId)) {
        setTimeout(() => {
          transferEngine.cleanupTransitFiles(transferId);
        }, 2000);
      }
    });

    archive.pipe(res);

    for (const f of validFiles) {
      archive.file(f.savedPath, { name: f.name || path.basename(f.savedPath) });
    }

    archive.finalize();
  });

  /**
   * Transfer History
   */
  router.get('/history', (req, res) => {
    const clientId = req.query?.clientId;
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').replace(/^.*:/, '');
    const localIPs = ['127.0.0.1', 'localhost', ...getLocalIPAddresses().map((a) => a.address)];
    const isHost = localIPs.includes(clientIp) || req.hostname === 'localhost' || req.hostname === '127.0.0.1';

    let historyList = transferEngine.getHistory();
    if (clientId) {
      historyList = historyList.filter((h) => h.senderId === clientId || h.recipientId === clientId);
    } else if (isHost) {
      // Strict privacy: host ONLY sees transfers where host was an involved party (sender or recipient)
      const hostId = config.id;
      historyList = historyList.filter((h) => h.senderId === hostId || h.recipientId === hostId || h.recipientId === 'host');
    } else {
      historyList = [];
    }

    res.json({
      history: historyList,
      downloadsDir: isHost ? config.downloadsDir : null,
    });
  });

  router.post('/history/clear', (req, res) => {
    transferEngine.clearHistory();
    transferEngine.notifyUI('HISTORY_CLEARED', {}, null);
    res.json({ success: true });
  });

  router.post('/history/delete/:id', (req, res) => {
    const { id } = req.params;
    if (id) {
      transferEngine.deleteHistoryItem(id);
      transferEngine.notifyUI('HISTORY_ITEM_DELETED', { id }, null);
    }
    res.json({ success: true, id });
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
   * Open / Launch / Play Received File in Default OS Application
   */
  router.post('/open-file', (req, res) => {
    const { transferId, filePath, fileName } = req.body || {};
    let targetPath = filePath;

    if (transferId) {
      const transfer = transferEngine.getTransfer(transferId);
      if (transfer?.isTransit) {
        return res.status(403).json({ error: 'Access denied: Private peer-to-peer transfer' });
      }
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
        exec(`cmd.exe /c start "" "${norm}"`, (err) => {
          if (err) {
            const escaped = norm.replace(/'/g, "''");
            exec(`powershell -NoProfile -Command "Start-Process -LiteralPath '${escaped}'"`);
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
