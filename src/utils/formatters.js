/**
 * Formats byte size into human readable string (KB, MB, GB, TB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);

  return parseFloat((bytes / Math.pow(k, idx)).toFixed(dm)) + ' ' + sizes[idx];
}

/**
 * Formats transfer speed in bytes per second to human readable MB/s or KB/s
 */
export function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec < 1024 * 1024) {
    return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
  }
  return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
}

/**
 * Formats seconds into MM:SS format
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates estimated time remaining (ETA)
 */
export function calculateETA(remainingBytes, speedBps) {
  if (!speedBps || speedBps <= 0 || !remainingBytes || remainingBytes <= 0) {
    return '--';
  }
  const seconds = remainingBytes / speedBps;
  if (seconds < 60) {
    return `${Math.ceil(seconds)} ثانية`;
  }
  return formatDuration(seconds);
}

/**
 * Returns badge color and file classification
 */
export function getFileTypeCategory(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext)) {
    return { type: 'image', label: 'صورة', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
  }
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'].includes(ext)) {
    return { type: 'video', label: 'فيديو', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' };
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
    return { type: 'audio', label: 'صوت', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { type: 'archive', label: 'أرشيف', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
  }
  if (['pdf', 'doc', 'docx', 'txt', 'epub', 'xlsx', 'pptx'].includes(ext)) {
    return { type: 'document', label: 'مستند', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' };
  }
  if (['exe', 'msi', 'apk', 'dmg', 'deb'].includes(ext)) {
    return { type: 'app', label: 'برنامج', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
  }

  return { type: 'other', label: 'ملف', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
}

/**
 * Universal safe UUID generator that works across all browsers & HTTP contexts
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

