import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const HISTORY_FILE = path.join(os.homedir(), '.filefly', 'history.json');

export class TransferEngine {
  constructor(config, onEvent = () => {}) {
    this.config = config;
    this.onEvent = onEvent; // Sends targeted events (type, payload, targetIds)
    this.activeTransfers = new Map(); // transferId -> transferState
    this.history = this.loadHistory();
  }

  loadHistory() {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
    return [];
  }

  saveHistory() {
    try {
      const trimmed = this.history.slice(0, 100);
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving history:', e);
    }
  }

  getSafeFilePath(targetDir, originalName) {
    const parsed = path.parse(originalName);
    let candidate = path.join(targetDir, originalName);
    let counter = 1;

    while (fs.existsSync(candidate)) {
      const newName = `${parsed.name} (${counter})${parsed.ext}`;
      candidate = path.join(targetDir, newName);
      counter++;
    }

    const parentDir = path.dirname(candidate);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    return candidate;
  }

  /**
   * Registers a transfer request strictly targeted from sender to recipient
   */
  createTransferRequest(sender, recipient, files, batch = null) {
    const transferId = crypto.randomUUID();
    const totalBytes = files.reduce((acc, f) => acc + (Number(f.size) || 0), 0);

    const transfer = {
      id: transferId,
      batch: batch || null,
      sender: {
        id: sender.id,
        name: sender.name,
        ip: sender.ip,
        os: sender.os || 'windows',
      },
      recipient: {
        id: recipient.id,
        name: recipient.name || 'Device',
        ip: recipient.ip,
      },
      files: files.map((f, idx) => ({
        index: idx,
        name: f.name,
        size: Number(f.size) || 0,
        type: f.type || 'application/octet-stream',
        relativePath: f.relativePath || f.name,
        bytesReceived: 0,
        completed: false,
        savedPath: null,
      })),
      totalBytes,
      bytesTransferred: 0,
      status: 'pending', // pending -> accepted -> transferring -> completed | declined | cancelled
      createdAt: Date.now(),
      startTime: null,
      endTime: null,
      speedBps: 0,
      lastBytesCheck: 0,
      lastSpeedTime: Date.now(),
    };

    this.activeTransfers.set(transferId, transfer);

    // Dispatch notification strictly to recipient client or host
    const isTargetingHost = recipient.id === this.config.id || !recipient.id || recipient.id === 'host';
    const targetIds = isTargetingHost ? [this.config.id, 'host'] : [recipient.id];

    this.notifyUI('TRANSFER_REQUEST', transfer, targetIds);

    return transfer;
  }

  /**
   * Handles recipient response (Accept / Decline) and notifies sender
   */
  respondToTransfer(transferId, decision, responderId, acceptedFileNames = null) {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return { error: 'Transfer not found' };

    if (decision === 'accept') {
      transfer.status = 'accepted';
      transfer.startTime = Date.now();
      transfer.lastSpeedTime = Date.now();

      if (Array.isArray(acceptedFileNames) && acceptedFileNames.length > 0) {
        transfer.files = transfer.files.filter((f) => acceptedFileNames.includes(f.name));
        transfer.totalBytes = transfer.files.reduce((acc, f) => acc + (f.size || 0), 0);
        transfer.acceptedFileNames = acceptedFileNames;
      }

      // Notify sender and recipient that transfer was accepted
      this.notifyUI('TRANSFER_ACCEPTED', transfer, [transfer.sender.id, transfer.recipient.id]);
      return { success: true, status: 'accepted', transferId, acceptedFileNames: transfer.acceptedFileNames || null };
    } else {
      transfer.status = 'declined';

      // Notify sender and recipient that transfer was declined
      this.notifyUI('TRANSFER_DECLINED', transfer, [transfer.sender.id, transfer.recipient.id]);
      setTimeout(() => {
        this.activeTransfers.delete(transferId);
      }, 15000);
      return { success: true, status: 'declined', transferId };
    }
  }

  /**
   * Updates transfer progress and calculates speed
   */
  updateProgress(transferId, fileIndex, chunkBytes) {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return;

    if (transfer.status === 'accepted') {
      transfer.status = 'transferring';
    }

    transfer.bytesTransferred += chunkBytes;
    const file = transfer.files[fileIndex];
    if (file) {
      file.bytesReceived += chunkBytes;
    }

    const now = Date.now();
    const elapsed = (now - transfer.lastSpeedTime) / 1000;
    if (elapsed >= 0.35) {
      const deltaBytes = transfer.bytesTransferred - transfer.lastBytesCheck;
      transfer.speedBps = Math.max(0, deltaBytes / elapsed);
      transfer.lastBytesCheck = transfer.bytesTransferred;
      transfer.lastSpeedTime = now;

      const progressData = {
        id: transfer.id,
        bytesTransferred: transfer.bytesTransferred,
        totalBytes: transfer.totalBytes,
        speedBps: transfer.speedBps,
        fileIndex,
        percentage: transfer.totalBytes > 0
          ? Math.min(100, Math.round((transfer.bytesTransferred / transfer.totalBytes) * 100))
          : 0,
      };

      // Notify both parties involved in this transfer
      this.notifyUI('TRANSFER_PROGRESS', progressData, [transfer.sender.id, transfer.recipient.id]);
    }
  }

  completeFile(transferId, fileIndex, savedPath = null) {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return;

    const file = transfer.files[fileIndex];
    if (file) {
      file.completed = true;
      file.savedPath = savedPath;
    }

    const allCompleted = transfer.files.every((f) => f.completed);
    if (allCompleted) {
      this.completeTransfer(transferId);
    }
  }

  completeTransfer(transferId) {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return;

    transfer.status = 'completed';
    transfer.endTime = Date.now();
    transfer.bytesTransferred = transfer.totalBytes;
    transfer.savedPath = transfer.files[0]?.savedPath || null;

    const historyItem = {
      id: transfer.id,
      senderName: transfer.sender.name,
      recipientName: transfer.recipient.name,
      filesCount: transfer.files.length,
      firstFileName: transfer.files[0]?.name || 'ملف',
      savedPath: transfer.files[0]?.savedPath || null,
      totalBytes: transfer.totalBytes,
      completedAt: Date.now(),
      durationSec: Math.max(1, Math.round((transfer.endTime - (transfer.startTime || transfer.createdAt)) / 1000)),
    };

    this.history.unshift(historyItem);
    this.saveHistory();

    // Notify both parties (strictly sender and recipient)
    const targetIds = [transfer.sender.id, transfer.recipient.id];
    if (transfer.recipient.id === this.config.id || transfer.recipient.id === 'host') {
      targetIds.push(this.config.id, 'host');
    }
    this.notifyUI('TRANSFER_COMPLETED', { ...transfer, historyItem, savedPath: transfer.savedPath }, targetIds);

    setTimeout(() => {
      this.activeTransfers.delete(transferId);
    }, 60000);
  }

  cancelTransfer(transferId, reason = 'User cancelled') {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return;

    // Never cancel or delete an already completed transfer
    if (transfer.status === 'completed') return;

    transfer.status = 'cancelled';
    transfer.cancelReason = reason;

    this.notifyUI('TRANSFER_CANCELLED', { id: transferId, reason }, null);
    this.activeTransfers.delete(transferId);
  }

  removeFileFromTransfer(transferId, fileName) {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return { error: 'Transfer not found' };

    // Filter out the requested file
    transfer.files = (transfer.files || []).filter((f) => f.name !== fileName);
    transfer.totalBytes = transfer.files.reduce((acc, f) => acc + (f.size || 0), 0);

    if (transfer.files.length === 0) {
      this.cancelTransfer(transferId, 'تم إلغاء جميع الملفات من قبل المرسل');
      return { success: true, cancelled: true };
    }

    // Notify sender and recipient about updated files across all their possible connection IDs
    const targetIds = [
      transfer.sender?.id, 
      transfer.recipient?.id, 
      this.config.id, 
      'host'
    ].filter(Boolean);

    this.notifyUI('TRANSFER_UPDATED', transfer, targetIds);
    return { success: true, files: transfer.files, totalBytes: transfer.totalBytes };
  }

  getTransfer(transferId) {
    return this.activeTransfers.get(transferId);
  }

  getHistory() {
    return this.history;
  }

  /**
   * Helper to dispatch event to targeted recipients
   */
  notifyUI(eventType, payload, targetIds = null) {
    if (typeof this.onEvent === 'function') {
      this.onEvent({ type: eventType, payload, targetIds });
    }
  }
}
