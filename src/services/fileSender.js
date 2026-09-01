/**
 * High-speed file sender service with chunk/stream upload & progress tracking
 */

export async function requestTransferToPeer(peer, files, myDevice) {
  const fileMetaList = Array.from(files).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    relativePath: file.webkitRelativePath || file.name,
  }));

  const localBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:53316';
  
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
 * Uploads files to target peer with real-time XHR progress
 */
export function uploadFilesToPeer(targetBaseUrl, transferId, files, onProgress, onComplete, onError) {
  const formData = new FormData();
  formData.append('transferId', transferId);

  Array.from(files).forEach((file) => {
    formData.append('files', file, file.webkitRelativePath || file.name);
  });

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${targetBaseUrl}/api/transfer/upload`, true);

  let lastLoaded = 0;
  let lastTime = Date.now();

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const now = Date.now();
      const elapsed = (now - lastTime) / 1000;

      let speedBps = 0;
      if (elapsed >= 0.3) {
        speedBps = Math.max(0, (event.loaded - lastLoaded) / elapsed);
        lastLoaded = event.loaded;
        lastTime = now;
      }

      onProgress({
        loaded: event.loaded,
        total: event.total,
        percentage: Math.min(100, Math.round((event.loaded / event.total) * 100)),
        speedBps,
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
