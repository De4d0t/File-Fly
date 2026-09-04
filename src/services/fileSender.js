import { getServerBaseUrl } from './serverDiscovery.js';

/**
 * High-speed file sender service with chunk/stream upload & progress tracking
 */

export async function requestTransferToPeer(peer, files, myDevice, batch = null) {
  const fileMetaList = Array.from(files).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    relativePath: file.webkitRelativePath || file.name,
  }));

  const localBaseUrl = getServerBaseUrl();
  
  // If recipient is a web client (e.g. phone/browser) or shares the host, route through local server
  let targetBaseUrl = localBaseUrl;
  if (peer.isWebClient || !peer.ip || peer.ip === myDevice.ip || peer.ip === '127.0.0.1' || peer.ip === window.location.hostname) {
    targetBaseUrl = localBaseUrl;
  } else {
    // Try peer's server endpoint, fallback to local host
    targetBaseUrl = `http://${peer.ip}:${peer.port || 53316}`;
  }

  const payload = {
    sender: {
      id: myDevice.id,
      name: myDevice.name,
      ip: myDevice.ip,
      os: myDevice.os,
    },
    recipient: {
      id: peer.id,
      name: peer.name,
      ip: peer.ip,
    },
    files: fileMetaList,
    batch: batch || null,
  };

  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    response = await fetch(`${targetBaseUrl}/api/transfer/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    // If remote connection timed out or failed, fallback to local server immediately
    if (targetBaseUrl !== localBaseUrl) {
      targetBaseUrl = localBaseUrl;
      response = await fetch(`${targetBaseUrl}/api/transfer/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      throw err;
    }
  }

  if (!response || !response.ok) {
    throw new Error(`فشل إرسال طلب النقل (${response?.status || 'Network Error'})`);
  }

  const result = await response.json();
  return {
    transferId: result.transferId,
    targetBaseUrl,
  };
}

/**
 * Polls receiver's approval status
 */
export async function checkTransferApproval(targetBaseUrl, transferId) {
  const response = await fetch(`${targetBaseUrl}/api/transfer/status/${transferId}`);
  if (!response.ok) return { status: 'declined' };
  return await response.json();
}

/**
 * Uploads files to target peer with real-time XHR progress & smooth speed calculation
 */
export function uploadFilesToPeer(targetBaseUrl, transferId, files, onProgress, onComplete, onError) {
  const formData = new FormData();
  formData.append('transferId', transferId);

  Array.from(files).forEach((file) => {
    formData.append('files', file, file.webkitRelativePath || file.name);
  });

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${targetBaseUrl}/api/transfer/upload?transferId=${encodeURIComponent(transferId)}`, true);
  xhr.setRequestHeader('x-transfer-id', transferId);

  let lastLoaded = 0;
  let lastTime = Date.now();
  let currentSpeed = 0;

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const now = Date.now();
      const elapsed = (now - lastTime) / 1000;

      if (elapsed >= 0.2) {
        const instantSpeed = Math.max(0, (event.loaded - lastLoaded) / elapsed);
        currentSpeed = currentSpeed === 0 ? instantSpeed : (currentSpeed * 0.6 + instantSpeed * 0.4);
        lastLoaded = event.loaded;
        lastTime = now;
      }

      const percentage = event.total > 0
        ? Math.min(100, Math.round((event.loaded / event.total) * 100))
        : 0;

      onProgress({
        loaded: event.loaded,
        total: event.total,
        percentage,
        speedBps: currentSpeed,
      });
    }
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      onComplete();
    } else {
      onError(new Error(`فشل الرفع برمز: ${xhr.status}`));
    }
  };

  xhr.onerror = () => {
    onError(new Error('حدث خطأ في الاتصال أثناء نقل الملف'));
  };

  xhr.onabort = () => {
    onError(new Error('تم إلغاء النقل'));
  };

  xhr.send(formData);

  return {
    abort: () => xhr.abort(),
  };
}

/**
 * Notifies recipient/server that the transfer has been cancelled by the user
 */
export async function cancelTransferOnPeer(targetBaseUrl, transferId, reason = 'User cancelled') {
  if (!transferId) return;
  try {
    const localBaseUrl = getServerBaseUrl();
    const url = targetBaseUrl || localBaseUrl;
    await fetch(`${url}/api/transfer/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transferId, reason }),
    });
  } catch (err) {
    console.warn('[fileSender] cancelTransferOnPeer failed:', err);
  }
}

