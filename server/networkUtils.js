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
 * Loads persistent device configuration or creates defaults
 */
export function getDeviceConfig() {
  const defaultDeviceName = `${os.hostname()} (Windows)`;
  const defaultId = crypto.randomUUID();

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return {
        id: data.id || defaultId,
        name: data.name || defaultDeviceName,
        visible: data.visible !== undefined ? data.visible : true,
        downloadsDir: data.downloadsDir || getDefaultDownloadsDir(),
      };
    } catch (e) {
      console.error('Error reading config file, recreating:', e);
    }
  }

  const initialConfig = {
    id: defaultId,
    name: defaultDeviceName,
    visible: true,
    downloadsDir: getDefaultDownloadsDir(),
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

/**
 * Returns default downloads directory for FileFly
 */
export function getDefaultDownloadsDir() {
  const dir = path.join(os.homedir(), 'Downloads', 'FileFly');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.error('Failed to create default downloads directory:', e);
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
