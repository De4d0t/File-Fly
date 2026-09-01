import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
        const safeName = transferEngine.getSafeFilePath(
          config.downloadsDir,
          file.originalname
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
   * High-Speed Upload Endpoint
   */
  router.post('/transfer/upload', upload.array('files'), (req, res) => {
    const { transferId } = req.body;
    const uploadedFiles = req.files || [];

    const transfer = transferEngine.getTransfer(transferId);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer session not found' });
    }

    // Process completed files
    uploadedFiles.forEach((f, idx) => {
      transferEngine.updateProgress(transferId, idx, f.size);
      transferEngine.completeFile(transferId, idx, f.path);
    });

    res.json({
      success: true,
      uploadedCount: uploadedFiles.length,
      files: uploadedFiles.map((f) => ({ name: f.originalname, size: f.size })),
    });
  });

  /**
   * Stream File Upload (Chunked Stream for ultimate throughput)
   */
  router.post('/transfer/stream/:transferId/:fileIndex', (req, res) => {
    const { transferId, fileIndex } = req.params;
    const originalFileName = decodeURIComponent(req.headers['x-file-name'] || `file_${fileIndex}`);
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
   * Transfer History
   */
  router.get('/history', (req, res) => {
    res.json({
      history: transferEngine.getHistory(),
      downloadsDir: config.downloadsDir,
    });
  });

  /**
   * Open Downloads Folder in OS File Explorer
   */
  router.post('/open-downloads', (req, res) => {
    const dir = config.downloadsDir || path.join(os.homedir(), 'Downloads', 'FileFly');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const osType = getDeviceOS();
      if (osType === 'windows') {
        const winPath = path.resolve(dir);
        spawn('explorer.exe', [winPath], { detached: true, stdio: 'ignore' }).unref();
      } else if (osType === 'mac') {
        spawn('open', [dir], { detached: true, stdio: 'ignore' }).unref();
      } else if (osType === 'linux') {
        spawn('xdg-open', [dir], { detached: true, stdio: 'ignore' }).unref();
      }

      res.json({ success: true, path: dir });
    } catch (err) {
      console.error('[OpenDownloads Error]:', err);
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
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  return router;
}
