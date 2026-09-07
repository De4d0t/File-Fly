import os from 'os';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(os.homedir(), '.filefly');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure configuration directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create config dir:', err);
  }
}

/**
 * Formats a clean, short, human-friendly device name for Windows machines
 */
export function formatShortDeviceName(rawName) {
  if (!rawName) return 'Windows PC';
  let name = rawName.trim();
  // Strip redundant (Windows) suffix
  name = name.replace(/\s*\(Windows\)\s*$/i, '');
  if (name === 'main computer') return 'PC';
  // If typical Windows generic hostname like DESKTOP-8K2Q1M9 or LAPTOP-ABC1234
  if (/^(DESKTOP|LAPTOP)-([A-Z0-9]{3,4})[A-Z0-9]*$/i.test(name)) {
    const match = name.match(/^(DESKTOP|LAPTOP)-([A-Z0-9]{3,4})/i);
    return `PC-${match[2]}`;
  }
  return name;
}

/**
 * Loads persistent device configuration or creates defaults
 */
export function getDeviceConfig() {
  const defaultDeviceName = formatShortDeviceName(os.hostname());
  const defaultId = crypto.randomUUID();
  const defaultDownloads = getDefaultDownloadsDir();

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      let downloadsDir = defaultDownloads;
      if (data.downloadsDir && fs.existsSync(data.downloadsDir)) {
        downloadsDir = data.downloadsDir;
      }
      if (!fs.existsSync(downloadsDir)) {
        try { fs.mkdirSync(downloadsDir, { recursive: true }); } catch (_) {}
      }

      // Automatically sanitize legacy long names
      let name = data.name;
      if (!name || name.includes('(Windows)') || /^(DESKTOP|LAPTOP)-/i.test(name) || name === 'main computer') {
        name = formatShortDeviceName(name || defaultDeviceName);
      }

      return {
        id: data.id || defaultId,
        name,
        visible: data.visible !== undefined ? data.visible : true,
        downloadsDir,
      };
    } catch (e) {
      console.error('Error reading config file, recreating:', e);
    }
  }

  const initialConfig = {
    id: defaultId,
    name: defaultDeviceName,
    visible: true,
    downloadsDir: defaultDownloads,
  };

  saveDeviceConfig(initialConfig);
  return initialConfig;
}

/**
 * Saves device configuration to disk
 */
export function saveDeviceConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

export function getDefaultDownloadsDir() {
  const dir = path.join(os.homedir(), 'Downloads');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.error('Failed to ensure downloads directory:', e);
    }
  }
  return dir;
}

/**
 * Detects the active non-internal IPv4 addresses of this machine
 */
export function getLocalIPAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Filter out internal (127.0.0.1) and non-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address,
          netmask: iface.netmask,
        });
      }
    }
  }

  return addresses;
}

/**
 * Gets the primary local IPv4 address
 */
export function getPrimaryLocalIP() {
  const ips = getLocalIPAddresses();
  // Prefer Wi-Fi or Ethernet interfaces over virtual VPN adapters
  const preferred = ips.find(
    (item) =>
      item.interface.toLowerCase().includes('wi-fi') ||
      item.interface.toLowerCase().includes('wlan') ||
      item.interface.toLowerCase().includes('ethernet')
  );

  return preferred ? preferred.address : ips[0]?.address || '127.0.0.1';
}

/**
 * Calculates exact Subnet Broadcast addresses for all active adapters
 */
export function getBroadcastAddresses() {
  const ips = getLocalIPAddresses();
  const broadcasts = ['255.255.255.255'];

  for (const item of ips) {
    if (item.address && item.netmask) {
      const addrParts = item.address.split('.').map(Number);
      const maskParts = item.netmask.split('.').map(Number);
      if (addrParts.length === 4 && maskParts.length === 4) {
        const bcastParts = addrParts.map((part, i) => (part | (~maskParts[i] & 255)));
        broadcasts.push(bcastParts.join('.'));
      }
    }
  }

  return [...new Set(broadcasts)];
}

/**
 * Detects current OS platform
 */
export function getDeviceOS() {
  const platform = os.platform();
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'mac';
  if (platform === 'linux') return 'linux';
  if (platform === 'android') return 'android';
  return 'unknown';
}

