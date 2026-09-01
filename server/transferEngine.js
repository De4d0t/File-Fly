import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const HISTORY_FILE = path.join(os.homedir(), '.filefly', 'history.json');

export class TransferEngine {
  constructor(config, onEvent = () => {}) {
    this.config = config;
    this.onEvent = onEvent; // Sends WebSocket events to UI
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
      const trimmed = this.history.slice(0, 100); // Keep last 100 entries
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving history:', e);
    }
  }

  /**
   * Generates a safe non-colliding file destination path
   */
  getSafeFilePath(targetDir, originalName) {
    const parsed = path.parse(originalName);
    let candidate = path.join(targetDir, originalName);
    let counter = 1;

    while (fs.existsSync(candidate)) {
      const newName = `${parsed.name} (${counter})${parsed.ext}`;
      candidate = path.join(targetDir, newName);
      counter++;
    }

    // Ensure parent directory exists (for folder transfers)
    const parentDir = path.dirname(candidate);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    return candidate;
  }

  /**
   * Registers a new incoming transfer request waiting for receiver's approval
   */
  createIncomingTransferRequest(sender, files) {
    const transferId = crypto.randomUUID();
    const totalBytes = files.reduce((acc, f) => acc + (Number(f.size) || 0), 0);

    const transfer = {
      id: transferId,
      direction: 'incoming',
      sender,
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
    this.notifyUI('TRANSFER_REQUEST', transfer);
    return transfer;
  }

  /**
   * Handles user decision (Accept or Decline)
   */
  respondToTransfer(transferId, decision) {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return { error: 'Transfer not found' };

    if (decision === 'accept') {
      transfer.status = 'accepted';
      transfer.startTime = Date.now();
      transfer.lastSpeedTime = Date.now();
      this.notifyUI('TRANSFER_ACCEPTED', transfer);
      return { success: true, status: 'accepted', transferId };
    } else {
      transfer.status = 'declined';
      this.notifyUI('TRANSFER_DECLINED', transfer);
      this.activeTransfers.delete(transferId);
      return { success: true, status: 'declined', transferId };
    }
  }

  /**
   * Registers an outgoing transfer for progress tracking
   */
  createOutgoingTransfer(recipient, files) {
    const transferId = crypto.randomUUID();
    const totalBytes = files.reduce((acc, f) => acc + (Number(f.size) || 0), 0);

    const transfer = {
      id: transferId,
      direction: 'outgoing',
      recipient,
      files: files.map((f, idx) => ({
        index: idx,
        name: f.name,
        size: Number(f.size) || 0,
        type: f.type || 'application/octet-stream',
        relativePath: f.relativePath || f.name,
        bytesSent: 0,
        completed: false,
      })),
      totalBytes,
      bytesTransferred: 0,
      status: 'pending',
      createdAt: Date.now(),
      startTime: null,
      endTime: null,
      speedBps: 0,
      lastBytesCheck: 0,
      lastSpeedTime: Date.now(),
    };

    this.activeTransfers.set(transferId, transfer);
    this.notifyUI('TRANSFER_OUTGOING_CREATED', transfer);
    return transfer;
  }

  /**
   * Updates transfer progress and calculates real-time speed
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
      if (transfer.direction === 'incoming') {
        file.bytesReceived += chunkBytes;
      } else {
        file.bytesSent += chunkBytes;
      }
    }

    // Speed calculation every 400ms
    const now = Date.now();
    const elapsed = (now - transfer.lastSpeedTime) / 1000;
    if (elapsed >= 0.4) {
      const deltaBytes = transfer.bytesTransferred - transfer.lastBytesCheck;
      transfer.speedBps = Math.max(0, deltaBytes / elapsed);
      transfer.lastBytesCheck = transfer.bytesTransferred;
      transfer.lastSpeedTime = now;

      this.notifyUI('TRANSFER_PROGRESS', {
        id: transfer.id,
        bytesTransferred: transfer.bytesTransferred,
        totalBytes: transfer.totalBytes,
        speedBps: transfer.speedBps,
        fileIndex,
        percentage: transfer.totalBytes > 0 
          ? Math.min(100, Math.round((transfer.bytesTransferred / transfer.totalBytes) * 100))
          : 0,
      });
    }
  }

  /**
   * Marks a single file in the batch as completed
   */
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

  /**
   * Marks full transfer as completed and records into history
   */
  completeTransfer(transferId) {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return;

    transfer.status = 'completed';
    transfer.endTime = Date.now();
    transfer.bytesTransferred = transfer.totalBytes;

    // Add to history
    const historyItem = {
      id: transfer.id,
      direction: transfer.direction,
      partnerName: transfer.direction === 'incoming' ? transfer.sender.name : transfer.recipient.name,
      filesCount: transfer.files.length,
      firstFileName: transfer.files[0]?.name || 'Files',
      savedPath: transfer.files[0]?.savedPath || null,
      totalBytes: transfer.totalBytes,
      completedAt: Date.now(),
      durationSec: Math.max(1, Math.round((transfer.endTime - (transfer.startTime || transfer.createdAt)) / 1000)),
    };

    this.history.unshift(historyItem);
    this.saveHistory();

    this.notifyUI('TRANSFER_COMPLETED', {
      ...transfer,
      historyItem,
    });

    setTimeout(() => {
      this.activeTransfers.delete(transferId);
    }, 60000); // Keep in memory for 1 minute then clean up
  }

  /**
   * Cancels an ongoing transfer
   */
  cancelTransfer(transferId, reason = 'User cancelled') {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return;

    transfer.status = 'cancelled';
    transfer.cancelReason = reason;

    this.notifyUI('TRANSFER_CANCELLED', {
      id: transferId,
      reason,
    });

    this.activeTransfers.delete(transferId);
  }

  getTransfer(transferId) {
    return this.activeTransfers.get(transferId);
  }

  getHistory() {
    return this.history;
  }

  notifyUI(eventType, data) {
    if (typeof this.onEvent === 'function') {
      this.onEvent({ type: eventType, payload: data });
    }
  }
}
