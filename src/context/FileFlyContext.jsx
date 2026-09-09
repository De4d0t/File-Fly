import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketClient.js';
import { requestTransferToPeer, uploadFilesToPeer, checkTransferApproval, cancelTransferOnPeer } from '../services/fileSender.js';
import { 
  playTransferRequestSound, 
  playTransferAcceptedSound,
  playSuccessSound, 
  playDeclinedSound,
  playButtonClickSound,
  requestNotificationPermission,
  showSystemNotification 
} from '../utils/soundEffects.js';
import { formatBytes, generateUUID } from '../utils/formatters.js';
import { getServerBaseUrl, setServerBaseUrl } from '../services/serverDiscovery.js';

const FileFlyContext = createContext(null);

export function FileFlyProvider({ children }) {
  const [activeServerUrl, setActiveServerUrl] = useState(() => getServerBaseUrl());

  const apiFetch = useCallback((url, options = {}) => {
    const base = getServerBaseUrl();
    const fullUrl = url.startsWith('http') ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    return fetch(fullUrl, options);
  }, []);

  const updateActiveServer = useCallback((newServerUrl) => {
    const normalized = setServerBaseUrl(newServerUrl);
    if (normalized) {
      setActiveServerUrl(normalized);
      socketService.reconnectTo(normalized);
    }
    return normalized;
  }, []);

  const isHostMachine = typeof window !== 'undefined' && (
    Boolean(window.fileflyDesktop) ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    localStorage.getItem('filefly_is_host') === 'true'
  );

  const getClientOS = () => {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    if (/Mac/i.test(ua)) return 'mac';
    if (/Win/i.test(ua)) return 'windows';
    if (/Linux/i.test(ua)) return 'linux';
    return 'browser';
  };

  const getClientBrandInfo = () => {
    const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';

    if (/ipad/i.test(ua)) return { os: 'ios', label: 'iPad' };
    if (/iphone|ipod/i.test(ua)) return { os: 'ios', label: 'iPhone' };

    if (/android/i.test(ua)) {
      if (/samsung|sm-[a-z0-9]+/i.test(ua)) return { os: 'android', label: 'Samsung' };
      if (/redmi/i.test(ua)) return { os: 'android', label: 'Redmi' };
      if (/xiaomi|poco/i.test(ua)) return { os: 'android', label: 'Xiaomi' };
      if (/pixel/i.test(ua)) return { os: 'android', label: 'Pixel' };
      if (/huawei/i.test(ua)) return { os: 'android', label: 'Huawei' };
      if (/honor/i.test(ua)) return { os: 'android', label: 'Honor' };
      if (/oppo/i.test(ua)) return { os: 'android', label: 'OPPO' };
      if (/vivo/i.test(ua)) return { os: 'android', label: 'vivo' };
      if (/oneplus/i.test(ua)) return { os: 'android', label: 'OnePlus' };
      if (/realme/i.test(ua)) return { os: 'android', label: 'Realme' };
      return { os: 'android', label: 'Android' };
    }

    if (/mac/i.test(ua)) return { os: 'mac', label: 'Mac' };
    if (/win/i.test(ua)) return { os: 'windows', label: 'PC' };
    if (/linux/i.test(ua)) return { os: 'linux', label: 'Linux' };

    return { os: 'browser', label: 'Device' };
  };

  const getClientDefaultName = (clientId) => {
    const brand = getClientBrandInfo();
    const shortCode = (clientId ? clientId.replace(/[^a-zA-Z0-9]/g, '').slice(-4) : Math.random().toString(36).slice(-4)).toUpperCase();
    return `${brand.label}-${shortCode}`;
  };

  /**
   * Cleans long generic Windows hostnames (e.g. DESKTOP-8K2Q1M9 (Windows) -> PC-8K2Q)
   */
  const shortenDeviceName = (rawName) => {
    if (!rawName) return 'PC';
    let name = rawName.trim().replace(/\s*\(Windows\)\s*$/i, '');
    if (name === 'main computer' || name === 'جهازي') return 'PC';
    if (/^(DESKTOP|LAPTOP)-([A-Z0-9]{3,4})[A-Z0-9]*$/i.test(name)) {
      const match = name.match(/^(DESKTOP|LAPTOP)-([A-Z0-9]{3,4})/i);
      return `PC-${match[2]}`;
    }
    return name;
  };

  // Helper to load client settings safely from localStorage
  const getInitialClientIdentity = () => {
    if (typeof window === 'undefined') {
      return { id: 'temp-id', name: isHostMachine ? 'PC' : 'My Device', visible: true };
    }
    const id = localStorage.getItem('filefly_device_id') || generateUUID();
    localStorage.setItem('filefly_device_id', id);

    let savedName = localStorage.getItem('filefly_device_name');
    
    // Automatically upgrade generic legacy names or previous Arabic names to clean English names
    const hasArabic = /[\u0600-\u06FF]/.test(savedName || '');
    const isGenericLegacy = !savedName || hasArabic ||
      (!isHostMachine && (savedName === 'PC' || savedName === 'main computer' || savedName === 'Device'));

    if (savedName && !isGenericLegacy) {
      const cleanName = shortenDeviceName(savedName);
      if (cleanName !== savedName) {
        savedName = cleanName;
        localStorage.setItem('filefly_device_name', cleanName);
      }
    }

    const name = (!isHostMachine && isGenericLegacy)
      ? getClientDefaultName(id)
      : (savedName || (isHostMachine ? 'PC' : getClientDefaultName(id)));

    if (name && (!savedName || isGenericLegacy)) {
      localStorage.setItem('filefly_device_name', name);
    }

    const visible = localStorage.getItem('filefly_device_visible') !== 'false';

    return { id, name, visible };
  };

  const initialIdentity = getInitialClientIdentity();

  const savedHostId = typeof window !== 'undefined' ? localStorage.getItem('filefly_host_id') : null;
  const savedHostIp = typeof window !== 'undefined' ? localStorage.getItem('filefly_host_ip') : null;

  // Device identity
  const [myDevice, setMyDevice] = useState({
    id: isHostMachine && savedHostId ? savedHostId : initialIdentity.id,
    name: initialIdentity.name,
    visible: initialIdentity.visible,
    os: getClientOS(),
    ip: isHostMachine ? (savedHostIp || (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1')) : null,
    port: 53316,
    isHost: isHostMachine,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [peers, setPeers] = useState([]);

  const [history, setHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('filefly_client_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed.filter((i) => i && (i.id || i.firstFileName)) : [];
        }
      } catch (_) {}
    }
    return [];
  });

  const addHistoryRecord = (record) => {
    setHistory((prev) => {
      const updated = [record, ...(prev || []).filter((h) => h.id !== record.id)].slice(0, 60);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('filefly_client_history', JSON.stringify(updated));
        } catch (_) {}
      }
      return updated;
    });
  };

  const clearHistory = async () => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('filefly_client_history');
      } catch (_) {}
    }
    try {
      await apiFetch('/api/history/clear', { method: 'POST' });
    } catch (_) {}
  };

  const deleteHistoryItem = async (itemId) => {
    if (!itemId) return;
    setHistory((prev) => {
      const updated = (prev || []).filter((h) => h.id !== itemId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('filefly_client_history', JSON.stringify(updated));
        } catch (_) {}
      }
      return updated;
    });
    try {
      await apiFetch(`/api/history/delete/${encodeURIComponent(itemId)}`, { method: 'POST' });
    } catch (_) {}
  };
  const [isScanning, setIsScanning] = useState(false);
  const [isRadarActive, setIsRadarActive] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('filefly_radar_active', 'true');
    }
  }, []);
  const [pendingIncomingRequest, setPendingIncomingRequest] = useState(null);
  
  // Active transfer state for progress bars
  const [activeTransfer, setActiveTransfer] = useState(null);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // PWA Installation state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(
    typeof window !== 'undefined' &&
    (Boolean(window.fileflyDesktop) || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPwaApp = async () => {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsAppInstalled(true);
          setDeferredInstallPrompt(null);
          return true;
        }
      } catch (err) {
        console.warn('[FileFly PWA] Prompt failed:', err);
      }
    }
    return false;
  };

  // Active XHR upload controller reference
  const uploadControllerRef = useRef(null);
  const cancelledTransfersRef = useRef(new Set());
  const activeBatchRef = useRef(null);

  const hostDeviceRef = useRef(null);
  const myDeviceRef = useRef(myDevice);
  const activeTransferRef = useRef(activeTransfer);

  useEffect(() => {
    myDeviceRef.current = myDevice;
  }, [myDevice]);

  useEffect(() => {
    activeTransferRef.current = activeTransfer;
  }, [activeTransfer]);

  // Initialize Socket and listeners
  useEffect(() => {
    socketService.connect();

    let disconnectPeersTimer = null;
    const unsubConnection = socketService.on('connection_change', (connected) => {
      setIsOnline(connected);
      if (connected) {
        if (disconnectPeersTimer) {
          clearTimeout(disconnectPeersTimer);
          disconnectPeersTimer = null;
        }
        if (!isHostMachine) {
          const clientIdentity = getInitialClientIdentity();
          socketService.send('REGISTER_PEER', {
            id: clientIdentity.id,
            name: clientIdentity.name,
            visible: clientIdentity.visible,
            os: getClientOS(),
          });
        }
      } else {
        if (disconnectPeersTimer) {
          clearTimeout(disconnectPeersTimer);
          disconnectPeersTimer = null;
        }
        // If Wi-Fi is turned off or offline, clear peers immediately!
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setPeers([]);
        } else {
          // If socket connection dropped, clear peers after 1.5s grace period
          disconnectPeersTimer = setTimeout(() => {
            setPeers([]);
          }, 1500);
        }
      }
    });

    const handleWindowOffline = () => {
      setIsOnline(false);
      setPeers([]);
    };
    window.addEventListener('offline', handleWindowOffline);

    const handlePageExit = () => {
      try {
        const id = myDeviceRef.current?.id;
        if (id) {
          socketService.send('UNREGISTER_PEER', { id });
        }
        socketService.disconnect();
      } catch (_) {}
    };

    const handlePageHide = (e) => {
      // When the page/window is destroyed or closed (not retained in bfcache)
      if (!e.persisted) {
        handlePageExit();
      }
    };

    const handleVisibilityChange = () => {
      try {
        const id = myDeviceRef.current?.id;
        const isTransferring = activeTransferRef.current?.status === 'transferring';
        if (isTransferring) return;

        if (document.visibilityState === 'hidden') {
          socketService.send('CLIENT_VISIBILITY', { id, inBackground: true });
        } else if (document.visibilityState === 'visible') {
          socketService.send('CLIENT_VISIBILITY', { id, inBackground: false });
        }
      } catch (_) {}
    };

    window.addEventListener('beforeunload', handlePageExit);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const unsubInit = (data) => {
      const host = data.hostDevice || data.device;
      if (host) {
        hostDeviceRef.current = host;
      }

      const isHost = Boolean(
        data.isLocalHost ||
        window.fileflyDesktop ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        (typeof window !== 'undefined' && localStorage.getItem('filefly_is_host') === 'true')
      );

      if (isHost && host) {
        const cleanHost = { ...host, name: shortenDeviceName(host.name) };
        setMyDevice(cleanHost);
        myDeviceRef.current = cleanHost;
        if (typeof window !== 'undefined') {
          if (cleanHost.name) localStorage.setItem('filefly_device_name', cleanHost.name);
          if (cleanHost.id) localStorage.setItem('filefly_host_id', cleanHost.id);
          if (cleanHost.ip) localStorage.setItem('filefly_host_ip', cleanHost.ip);
          localStorage.setItem('filefly_is_host', 'true');
        }
        if (data.peers) {
          setPeers(processPeersList(data.peers, cleanHost));
        }
      } else {
        // Remote client (Laptop 2 or Phone)
        const clientIdentity = getInitialClientIdentity();
        const clientOS = getClientOS();

        const clientDevice = {
          id: clientIdentity.id,
          name: clientIdentity.name,
          os: clientOS,
          visible: clientIdentity.visible,
          isClient: true,
          ip: data.clientIP || window.location.hostname,
        };

        setMyDevice(clientDevice);
        myDeviceRef.current = clientDevice;

        // Announce our presence to the host
        socketService.send('REGISTER_PEER', {
          id: clientIdentity.id,
          name: clientIdentity.name,
          visible: clientIdentity.visible,
          os: clientOS,
        });

        // Set peers: filter out self and deduplicate
        if (data.peers) {
          setPeers(processPeersList(data.peers, clientDevice));
        }

        // Remote client (Phone / Tablet): Strictly load only this client's transfers!
        try {
          const saved = localStorage.getItem('filefly_client_history');
          if (saved) {
            const parsed = JSON.parse(saved);
            const valid = Array.isArray(parsed) ? parsed.filter((i) => i && (i.id || i.firstFileName)) : [];
            if (valid.length > 0) setHistory(valid);
          }
        } catch (_) {}
      }

      // Server history strictly applied only for host machine
      if (isHost) {
        if (data.history && Array.isArray(data.history) && data.history.length > 0) {
          setHistory(data.history);
        } else {
          apiFetch('/api/history')
            .then((r) => r.json())
            .then((d) => {
              if (d.history && Array.isArray(d.history) && d.history.length > 0) {
                setHistory(d.history);
              }
            })
            .catch(() => {});
        }
      }
    };

    const processPeersList = (rawPeers, overrideDevice = null) => {
      const currentMyDevice = overrideDevice || myDeviceRef.current;
      const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('filefly_device_id') : null;
      const savedHostId = typeof window !== 'undefined' ? localStorage.getItem('filefly_host_id') : null;
      const host = hostDeviceRef.current;
      const hostId = host?.id || savedHostId;
      const isCurrentHost = Boolean(isHostMachine || currentMyDevice?.isHost);

      const filtered = (rawPeers || []).filter((p) => {
        if (!p || !p.id) return false;
        if (currentMyDevice?.id && p.id === currentMyDevice.id) return false;
        if (savedClientId && p.id === savedClientId) return false;

        // On the host machine, NEVER include the host peer or localhost in peers list
        if (isCurrentHost) {
          if (p.isHost || (hostId && p.id === hostId) || p.ip === '127.0.0.1' || p.ip === 'localhost') return false;
        }

        // On remote client, filter out self by IP
        if (!currentMyDevice?.isHost && p.isHost) return true;
        if (!currentMyDevice?.isHost && currentMyDevice?.ip && p.ip === currentMyDevice.ip) return false;
        return true;
      });


      // Strict IP deduplication: One IP address belongs to one physical device
      const ipMap = new Map();
      for (const peer of filtered) {
        const existing = ipMap.get(peer.ip);
        if (!existing || (peer.lastSeen || 0) >= (existing.lastSeen || 0)) {
          ipMap.set(peer.ip, peer);
        }
      }

      return Array.from(ipMap.values()).map((p) => ({
        ...p,
        name: shortenDeviceName(p.name),
      }));
    };

    const unsubInitEvent = socketService.on('INIT_STATE', unsubInit);

    const unsubClientHistory = socketService.on('CLIENT_HISTORY', (clientHistory) => {
      if (Array.isArray(clientHistory) && clientHistory.length > 0) {
        setHistory((prev) => {
          const map = new Map();
          [...(prev || []), ...clientHistory].forEach((item) => {
            if (item?.id && !map.has(item.id)) map.set(item.id, item);
          });
          const merged = Array.from(map.values()).slice(0, 60);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('filefly_client_history', JSON.stringify(merged));
            } catch (_) {}
          }
          return merged;
        });
      }
    });

    const unsubPeers = socketService.on('PEERS_UPDATE', (peersList) => {
      setPeers(processPeersList(peersList));
    });

    const unsubScanStatus = socketService.on('SCAN_STATUS', (status) => {
      const scanning = typeof status === 'boolean' ? status : Boolean(status?.scanning);
      setIsScanning(scanning);
    });

    const unsubDevice = socketService.on('DEVICE_UPDATE', (updated) => {
      if (isHostMachine) {
        setMyDevice((prev) => ({ ...prev, ...updated }));
      }
    });

    const unsubHostUpdate = socketService.on('HOST_UPDATE', (updatedHost) => {
      if (updatedHost) {
        hostDeviceRef.current = updatedHost;
        if (isHostMachine) {
          setMyDevice((prev) => ({
            ...prev,
            ...updatedHost,
            name: shortenDeviceName(updatedHost.name || prev.name),
          }));
        }
      }
    });

    // When someone wants to send files to this device
    const unsubRequest = socketService.on('TRANSFER_REQUEST', (transfer) => {
      const currentId = myDeviceRef.current?.id;

      // 1. STRICT SAFETY CHECK: If I am the sender, DO NOT show incoming prompt to myself
      if (transfer.sender?.id && currentId && transfer.sender.id === currentId) {
        return;
      }

      // 2. STRICT RECIPIENT CHECK: Verify that I am indeed the intended recipient!
      const recipientId = transfer.recipient?.id;
      const isTargetedToMe = (
        (recipientId && currentId && recipientId === currentId) ||
        (isHostMachine && (recipientId === 'host' || recipientId === hostDeviceRef.current?.id || !recipientId))
      );

      if (!isTargetedToMe) {
        return;
      }

      // 3. AUTO-ACCEPT SUBSEQUENT BATCH FILES:
      // If this file belongs to an already accepted batch from the same sender, accept automatically!
      if (
        transfer.batch?.batchId &&
        transfer.batch.current > 1 &&
        activeBatchRef.current?.batchId === transfer.batch.batchId &&
        Date.now() < activeBatchRef.current?.expiresAt
      ) {
        apiFetch('/api/transfer/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferId: transfer.id, decision: 'accept', responderId: currentId }),
        }).catch(() => {});

        setActiveTransfer({
          id: transfer.id,
          direction: 'incoming',
          partnerName: transfer.sender.name,
          filesCount: 1,
          files: transfer.files,
          firstFileName: transfer.files[0]?.name || 'ملف',
          totalBytes: transfer.totalBytes,
          bytesTransferred: 0,
          percentage: 0,
          speedBps: 0,
          status: 'transferring',
          batch: transfer.batch,
        });
        return;
      }

      // Automatically dismiss any open modal so transfer request is immediately unobstructed
      setIsQrModalOpen(false);
      setIsHistoryModalOpen(false);
      setIsRenameModalOpen(false);
      setIsInstallModalOpen(false);

      // Set pending request to display TransferModal immediately
      setPendingIncomingRequest(transfer);
      playTransferRequestSound();

      // Show browser system notification (Windows, Mac, Android)
      const senderName = transfer.sender?.name || 'جهاز متصل';
      const fileCount = transfer.files?.length || 1;
      const sizeStr = formatBytes(transfer.totalBytes || 0);

      showSystemNotification(`طلب استلام ملف جديد من ${senderName}`, {
        body: `يرغب في إرسال ${fileCount} ملف (${sizeStr}). انقر هنا للقبول أو الرفض.`,
        tag: 'filefly-transfer',
        renotify: true,
      });

      // Show native desktop notification if running in Electron
      if (window.fileflyDesktop?.showNotification) {
        window.fileflyDesktop.showNotification(
          'طلب استلام ملف جديد - FileFly',
          `الجهاز ${senderName} يرغب في إرسال ${fileCount} ملف (${sizeStr}).`
        );
      }
    });

    // Transfer updated (e.g. sender removed a file before recipient accepts)
    const unsubUpdated = socketService.on('TRANSFER_UPDATED', (transfer) => {
      setPendingIncomingRequest((prev) => {
        if (prev?.id === transfer.id) {
          return {
            ...prev,
            files: transfer.files,
            totalBytes: transfer.totalBytes,
          };
        }
        return prev;
      });

      setActiveTransfer((prev) => {
        if (prev?.id === transfer.id) {
          return {
            ...prev,
            files: transfer.files,
            filesCount: transfer.files?.length || 0,
            firstFileName: transfer.files?.[0]?.name || 'ملفات',
            totalBytes: transfer.totalBytes,
          };
        }
        return prev;
      });
    });

    // Live progress for incoming & outgoing files
    const unsubProgress = socketService.on('TRANSFER_PROGRESS', (progress) => {
      setActiveTransfer((prev) => {
        // STRICT ISOLATION: Ignore if this device is not involved in this transfer
        const isMyTransfer = 
          prev?.id === progress.id ||
          progress.senderId === myDevice?.id ||
          progress.recipientId === myDevice?.id ||
          (isHostMachine && (progress.recipientId === 'host' || progress.recipientId === hostDeviceRef.current?.id || progress.recipientId === myDevice?.id));

        if (!isMyTransfer) {
          return prev;
        }

        if (prev?.status === 'completed' || prev?.status === 'declined') {
          return prev;
        }
        if (progress.percentage >= 100) {
          return {
            ...prev,
            bytesTransferred: progress.totalBytes || prev?.totalBytes || 0,
            totalBytes: progress.totalBytes || prev?.totalBytes || 0,
            percentage: 100,
            speedBps: progress.speedBps || 0,
            status: 'completed',
          };
        }
        if (!prev || (prev.id && prev.id !== progress.id)) {
          // If we currently have an outgoing transfer in progress, do not overwrite it with incoming progress
          if (prev?.direction === 'outgoing') {
            return prev;
          }
          return {
            id: progress.id,
            direction: 'incoming',
            partnerName: 'مرسل',
            filesCount: 1,
            firstFileName: 'ملف جاري استلامه',
            bytesTransferred: progress.bytesTransferred || 0,
            totalBytes: progress.totalBytes || 0,
            percentage: progress.percentage || 0,
            speedBps: progress.speedBps || 0,
            status: 'transferring',
          };
        }
        return {
          ...prev,
          bytesTransferred: progress.bytesTransferred !== undefined ? progress.bytesTransferred : prev.bytesTransferred,
          totalBytes: progress.totalBytes !== undefined ? progress.totalBytes : prev.totalBytes,
          percentage: progress.percentage !== undefined ? progress.percentage : prev.percentage,
          speedBps: progress.speedBps !== undefined ? progress.speedBps : prev.speedBps,
          status: 'transferring',
        };
      });
    });

    // Transfer completed
    const unsubCompleted = socketService.on('TRANSFER_COMPLETED', (transfer) => {
      const currentMyId = myDeviceRef.current?.id;
      const currentHostId = hostDeviceRef.current?.id;
      const activeId = activeTransferRef.current?.id;
      const resolvedCount = transfer.files?.length || transfer.historyItem?.filesCount || 1;
      const resolvedFirstFileName = transfer.historyItem?.firstFileName || transfer.firstFileName || transfer.files?.[0]?.name || 'ملف';

      // STRICT ISOLATION: Ignore if this device is not the sender and not the intended recipient
      const isSender = transfer.sender?.id === currentMyId;
      const isRecipient = transfer.recipient?.id === currentMyId || 
                          (isHostMachine && (transfer.recipient?.id === 'host' || transfer.recipient?.id === currentHostId || transfer.recipient?.id === currentMyId));
      const isMyActiveSession = activeId === transfer.id;

      if (!isSender && !isRecipient && !isMyActiveSession) {
        // Third-party device on network: Strict privacy, completely ignore
        return;
      }

      playSuccessSound();
      const isIncomingTransfer = Boolean(
        transfer.direction === 'incoming' || 
        isRecipient || 
        activeTransfer?.direction === 'incoming'
      );

      setActiveTransfer((prev) => {
        const id = transfer.id || prev?.id;
        const firstFileName = resolvedFirstFileName || prev?.firstFileName || 'ملف';
        const isIncoming = isIncomingTransfer || prev?.direction === 'incoming';

        const resolvedSavedPath = transfer.savedPath || transfer.historyItem?.savedPath || transfer.files?.[0]?.savedPath || prev?.savedPath || null;
        const resolvedFiles = (transfer.files || transfer.historyItem?.files || prev?.files || []).map((f, idx) => ({
          ...f,
          savedPath: f.savedPath || (idx === 0 ? resolvedSavedPath : null),
        }));

        if (!prev || (prev.id && prev.id !== transfer.id)) {
          return {
            id,
            direction: isIncoming ? 'incoming' : 'outgoing',
            partnerName: transfer.sender?.name || prev?.partnerName || 'جهاز',
            filesCount: resolvedCount,
            files: resolvedFiles,
            savedPath: resolvedSavedPath,
            firstFileName,
            totalBytes: transfer.totalBytes || 0,
            bytesTransferred: transfer.totalBytes || 0,
            percentage: 100,
            status: 'completed',
          };
        }
        return { 
          ...prev, 
          status: 'completed', 
          percentage: 100, 
          bytesTransferred: prev.totalBytes,
          filesCount: resolvedCount,
          files: resolvedFiles.length ? resolvedFiles : (prev?.files || []),
          savedPath: resolvedSavedPath,
        };
      });

      // Show system notification for completion
      showSystemNotification('اكتمل نقل الملف بنجاح! 🎉', {
        body: `تم استلام ${resolvedFirstFileName} بنجاح عبر FileFly.`,
        tag: 'filefly-transfer',
      });

      const clientHistoryItem = {
        ...(transfer.historyItem || {}),
        id: transfer.id,
        direction: isIncomingTransfer ? 'incoming' : 'outgoing',
        partnerName: isIncomingTransfer
          ? (transfer.sender?.name || 'مرسل')
          : (transfer.recipient?.name || 'مستلم'),
        firstFileName: resolvedFirstFileName,
        filesCount: resolvedCount,
        totalBytes: transfer.totalBytes || 0,
        completedAt: Date.now(),
      };
      addHistoryRecord(clientHistoryItem);

      // Keep outgoing completion visible for 25s; incoming remains until receiver clicks dismiss or 3 mins
      setTimeout(() => {
        setActiveTransfer((curr) => (curr?.status === 'completed' && curr?.direction !== 'incoming' ? null : curr));
      }, 25000);
    });

    // Transfer declined by recipient
    const unsubDeclined = socketService.on('TRANSFER_DECLINED', (transfer) => {
      const isSender = transfer?.sender?.id === myDeviceRef.current?.id;
      if (isSender) {
        playDeclinedSound();
      }
      setActiveTransfer((prev) => {
        if (!prev || (transfer?.id && prev.id && prev.id !== transfer.id)) return prev;
        return {
          ...prev,
          status: 'declined',
          partnerName: transfer.recipient?.name || prev.partnerName,
        };
      });

      const partner = transfer.recipient?.name || 'المستلم';
      showSystemNotification('تم رفض طلب النقل ❌', {
        body: `قام ${partner} برفض طلب نقل الملف.`,
        tag: 'filefly-transfer',
      });

      if (window.fileflyDesktop?.showNotification) {
        window.fileflyDesktop.showNotification(
          'تم رفض طلب النقل - FileFly',
          `قام ${partner} برفض طلب نقل الملف.`
        );
      }

      // Keep declined notification visible for 9 seconds
      setTimeout(() => {
        setActiveTransfer((curr) => (curr?.status === 'declined' ? null : curr));
      }, 9000);
    });

    // Transfer cancelled
    const unsubCancelled = socketService.on('TRANSFER_CANCELLED', () => {
      playDeclinedSound();
      setActiveTransfer(null);
      setPendingIncomingRequest(null);
    });

    const unsubHistoryCleared = socketService.on('HISTORY_CLEARED', () => {
      setHistory([]);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('filefly_client_history');
        } catch (_) {}
      }
    });

    const unsubHistoryDeleted = socketService.on('HISTORY_ITEM_DELETED', (payload) => {
      if (payload?.id) {
        setHistory((prev) => {
          const updated = (prev || []).filter((h) => h.id !== payload.id);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('filefly_client_history', JSON.stringify(updated));
            } catch (_) {}
          }
          return updated;
        });
      }
    });

    return () => {
      window.removeEventListener('offline', handleWindowOffline);
      window.removeEventListener('beforeunload', handlePageExit);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubConnection();
      unsubInitEvent();
      unsubClientHistory();
      unsubPeers();
      unsubScanStatus();
      unsubDevice();
      unsubHostUpdate();
      unsubRequest();
      unsubUpdated();
      unsubProgress();
      unsubCompleted();
      unsubDeclined();
      unsubCancelled();
      unsubHistoryCleared();
      unsubHistoryDeleted();
    };
  }, [isHostMachine]);

  // Toggle Visibility (مكشوف / مخفي)
  const toggleVisibility = async () => {
    const nextState = !myDevice.visible;
    setMyDevice((prev) => ({ ...prev, visible: nextState }));
    localStorage.setItem('filefly_device_visible', String(nextState));

    socketService.send('SET_VISIBILITY', { id: myDevice.id, visible: nextState });

    if (isHostMachine) {
      try {
        await apiFetch('/api/visibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visible: nextState }),
        });
      } catch (e) {}
    }
  };

  // Update device name
  const updateDeviceName = async (newName) => {
    if (!newName || !newName.trim()) return;
    const name = newName.trim();
    setMyDevice((prev) => ({ ...prev, name }));
    localStorage.setItem('filefly_device_name', name);

    socketService.send('SET_NAME', { id: myDevice.id, name });

    if (isHostMachine) {
      try {
        await apiFetch('/api/device-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      } catch (e) {}
    }
  };

  // Toggle Radar Scanner (تشغيل / إيقاف الرادار المستمر)
  const toggleRadar = () => {
    setIsRadarActive((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('filefly_radar_active', String(next));
      }
      socketService.send('SET_RADAR', { active: next });
      return next;
    });
  };

  // Refresh discovered peers list
  const refreshPeers = () => {
    toggleRadar();
  };

  // Accept or decline incoming transfer (supports partial accepted files)
  const respondToIncomingRequest = async (decision, acceptedFiles = null) => {
    if (!pendingIncomingRequest) return;
    const request = pendingIncomingRequest;
    const transferId = request.id;

    if (decision === 'accept') {
      const finalFiles = Array.isArray(acceptedFiles) && acceptedFiles.length > 0
        ? acceptedFiles
        : request.files;
      const finalTotalBytes = finalFiles.reduce((acc, f) => acc + (f.size || 0), 0);
      const acceptedFileNames = finalFiles.map((f) => f.name);

      if (request.batch?.batchId) {
        activeBatchRef.current = {
          batchId: request.batch.batchId,
          expiresAt: Date.now() + 300000, // 5 minutes validity
        };
      }

      setActiveTransfer({
        id: transferId,
        direction: 'incoming',
        partnerName: request.sender.name,
        filesCount: request.batch?.total || finalFiles.length,
        files: finalFiles,
        firstFileName: finalFiles[0]?.name || 'ملفات',
        totalBytes: finalTotalBytes,
        bytesTransferred: 0,
        percentage: 0,
        speedBps: 0,
        status: 'transferring',
        batch: request.batch || null,
      });

      try {
        await apiFetch('/api/transfer/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferId, decision: 'accept', responderId: myDevice.id, acceptedFileNames }),
        });
      } catch (e) {}
    } else {
      activeBatchRef.current = null;
      playDeclinedSound();

      // Show temporary declined status toast on recipient screen
      setActiveTransfer({
        id: transferId,
        direction: 'incoming',
        partnerName: request.sender.name,
        filesCount: request.files.length,
        firstFileName: request.files[0]?.name || 'ملفات',
        status: 'declined',
        isReceiverDeclined: true,
      });

      setTimeout(() => {
        setActiveTransfer((curr) => (curr?.isReceiverDeclined ? null : curr));
      }, 3500);

      try {
        await apiFetch('/api/transfer/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferId, decision: 'decline', responderId: myDevice.id }),
        });
      } catch (e) {}
    }

    setPendingIncomingRequest(null);
  };

  // Initiate sending files to a peer
  const sendFilesToDevice = async (peer, fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const isRecipientPhone = Boolean(
      peer.os === 'ios' ||
      peer.os === 'android' ||
      /iphone|ipad|ipod|android|mobile/i.test(peer.name || '')
    );

    // ─────────────────────────────────────────────────────────────
    // 1. MOBILE PHONE RECIPIENT ONLY: Send sequentially file by file
    // ─────────────────────────────────────────────────────────────
    if (isRecipientPhone && files.length > 1) {
      const totalFilesCount = files.length;
      const batchId = generateUUID();

      try {
        for (let i = 0; i < totalFilesCount; i++) {
          if (cancelledTransfersRef.current.has(batchId)) {
            console.log('[FileFly] Sequential transfer cancelled by user');
            return;
          }

          const currentFile = files[i];
          const singleFileList = [currentFile];
          const batchInfo = {
            batchId,
            current: i + 1,
            total: totalFilesCount,
          };

          const transferState = {
            id: null,
            direction: 'outgoing',
            partnerName: peer.name,
            filesCount: totalFilesCount,
            files: [currentFile],
            firstFileName: `${currentFile.name} (${i + 1} من ${totalFilesCount})`,
            totalBytes: currentFile.size || 0,
            bytesTransferred: 0,
            percentage: 0,
            speedBps: 0,
            status: i === 0 ? 'waiting_approval' : 'transferring',
            batch: batchInfo,
          };

          setActiveTransfer(transferState);

          // Step 1: Send transfer request for single file
          const { transferId, targetBaseUrl } = await requestTransferToPeer(peer, singleFileList, myDevice, batchInfo);
          transferState.id = transferId;
          transferState.targetBaseUrl = targetBaseUrl;
          setActiveTransfer({ ...transferState });

          // Step 2: Poll for recipient response
          let approved = false;
          let checkAttempts = 0;
          const maxAttempts = 60;

          while (!approved && checkAttempts < maxAttempts) {
            if (cancelledTransfersRef.current.has(transferId) || cancelledTransfersRef.current.has(batchId)) {
              return;
            }
            await new Promise((r) => setTimeout(r, i === 0 ? 1000 : 400));
            if (cancelledTransfersRef.current.has(transferId) || cancelledTransfersRef.current.has(batchId)) {
              return;
            }
            checkAttempts++;
            const statusResponse = await checkTransferApproval(targetBaseUrl, transferId);
            if (statusResponse.status === 'accepted') {
              approved = true;
              break;
            }
            if (statusResponse.status === 'declined' || statusResponse.status === 'cancelled') {
              playDeclinedSound();
              setActiveTransfer({ ...transferState, status: 'declined' });
              setTimeout(() => {
                setActiveTransfer((curr) => (curr?.status === 'declined' ? null : curr));
              }, 6000);
              return;
            }
          }

          if (!approved) {
            setActiveTransfer({ ...transferState, status: 'timeout' });
            setTimeout(() => {
              setActiveTransfer((curr) => (curr?.status === 'timeout' ? null : curr));
            }, 6000);
            return;
          }

          // Step 3: Stream file upload
          transferState.status = 'transferring';
          setActiveTransfer({ ...transferState });

          await new Promise((resolve, reject) => {
            uploadControllerRef.current = uploadFilesToPeer(
              targetBaseUrl,
              transferId,
              singleFileList,
              (progress) => {
                setActiveTransfer((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    bytesTransferred: progress.loaded,
                    totalBytes: progress.total,
                    percentage: progress.percentage,
                    speedBps: progress.speedBps,
                    status: 'transferring',
                  };
                });
                socketService.send('CLIENT_TRANSFER_PROGRESS', {
                  id: transferId,
                  bytesTransferred: progress.loaded,
                  totalBytes: progress.total,
                  percentage: progress.percentage,
                  speedBps: progress.speedBps,
                });
              },
              () => {
                socketService.send('CLIENT_TRANSFER_COMPLETED', { id: transferId });
                resolve();
              },
              (err) => reject(err)
            );
          });

          addHistoryRecord({
            id: transferId,
            direction: 'outgoing',
            partnerName: peer.name,
            filesCount: 1,
            firstFileName: currentFile.name,
            totalBytes: currentFile.size,
            completedAt: Date.now(),
          });

          if (i < totalFilesCount - 1) {
            setActiveTransfer((prev) => prev ? {
              ...prev,
              percentage: 100,
              status: 'transferring',
              firstFileName: `تم نقل ${currentFile.name}، جاري بدء الملف التالي (${i + 2}/${totalFilesCount})...`,
            } : null);
            await new Promise((r) => setTimeout(r, 2000));
          }
        }

        playSuccessSound();
        setActiveTransfer((prev) => prev ? { ...prev, status: 'completed', percentage: 100 } : null);
        setTimeout(() => {
          setActiveTransfer((curr) => (curr?.status === 'completed' ? null : curr));
        }, 7000);
      } catch (err) {
        playDeclinedSound();
        console.error('Sequential transfer failed:', err);
        setActiveTransfer((prev) => ({
          ...(prev || {}),
          status: 'error',
          errorMessage: err.message,
        }));
        setTimeout(() => {
          setActiveTransfer((curr) => (curr?.status === 'error' ? null : curr));
        }, 7000);
      }
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. DESKTOP / PC RECIPIENT (or single file): Direct batch
    // ─────────────────────────────────────────────────────────────
    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    let filesToUpload = files;

    const transferState = {
      id: null,
      direction: 'outgoing',
      partnerName: peer.name,
      filesCount: files.length,
      files,
      firstFileName: files[0]?.name || 'ملف',
      totalBytes,
      bytesTransferred: 0,
      percentage: 0,
      speedBps: 0,
      status: 'waiting_approval',
      batch: null,
    };

    setActiveTransfer(transferState);

    try {
      // Step 1: Send transfer request for all files
      const { transferId, targetBaseUrl } = await requestTransferToPeer(peer, files, myDevice, null);
      transferState.id = transferId;
      transferState.targetBaseUrl = targetBaseUrl;
      setActiveTransfer({ ...transferState });

      // Step 2: Poll for recipient response
      let approved = false;
      let checkAttempts = 0;
      const maxAttempts = 60;

      while (!approved && checkAttempts < maxAttempts) {
        if (cancelledTransfersRef.current.has(transferId)) {
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelledTransfersRef.current.has(transferId)) {
          return;
        }
        checkAttempts++;
        const statusResponse = await checkTransferApproval(targetBaseUrl, transferId);
        if (statusResponse.status === 'accepted') {
          approved = true;
          if (Array.isArray(statusResponse.acceptedFileNames) && statusResponse.acceptedFileNames.length > 0) {
            filesToUpload = files.filter((f) => statusResponse.acceptedFileNames.includes(f.name));
            transferState.totalBytes = filesToUpload.reduce((acc, f) => acc + (f.size || 0), 0);
            transferState.filesCount = filesToUpload.length;
            transferState.firstFileName = filesToUpload[0]?.name || 'ملفات';
          }
          break;
        }
        if (statusResponse.status === 'declined' || statusResponse.status === 'cancelled') {
          playDeclinedSound();
          setActiveTransfer({
            ...transferState,
            status: 'declined',
          });
          setTimeout(() => {
            setActiveTransfer((curr) => (curr?.status === 'declined' ? null : curr));
          }, 6000);
          return;
        }
      }

      if (!approved) {
        setActiveTransfer({
          ...transferState,
          status: 'timeout',
        });
        setTimeout(() => {
          setActiveTransfer((curr) => (curr?.status === 'timeout' ? null : curr));
        }, 6000);
        return;
      }

      // Filter by remaining files from activeTransferRef if sender cancelled any before approval
      const liveRemainingFiles = activeTransferRef.current?.files;
      if (Array.isArray(liveRemainingFiles) && liveRemainingFiles.length > 0) {
        filesToUpload = filesToUpload.filter((f) => liveRemainingFiles.some((rf) => rf.name === f.name));
      }

      if (filesToUpload.length === 0) {
        console.log('[FileFly] All outgoing files were cancelled by sender');
        return;
      }

      // Step 3: Stream file upload for accepted files
      transferState.status = 'transferring';
      transferState.files = filesToUpload;
      transferState.filesCount = filesToUpload.length;
      transferState.firstFileName = filesToUpload[0]?.name || 'ملفات';
      transferState.totalBytes = filesToUpload.reduce((acc, f) => acc + (f.size || 0), 0);
      setActiveTransfer({ ...transferState });

      uploadControllerRef.current = uploadFilesToPeer(
        targetBaseUrl,
        transferId,
        filesToUpload,
        (progress) => {
          setActiveTransfer((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              bytesTransferred: progress.loaded,
              totalBytes: progress.total,
              percentage: progress.percentage,
              speedBps: progress.speedBps,
              status: 'transferring',
            };
          });

          socketService.send('CLIENT_TRANSFER_PROGRESS', {
            id: transferId,
            bytesTransferred: progress.loaded,
            totalBytes: progress.total,
            percentage: progress.percentage,
            speedBps: progress.speedBps,
          });
        },
        () => {
          socketService.send('CLIENT_TRANSFER_COMPLETED', { id: transferId });
          playSuccessSound();
          setActiveTransfer((prev) => {
            if (!prev) return null;
            return { ...prev, status: 'completed', percentage: 100 };
          });

          addHistoryRecord({
            id: transferId,
            direction: 'outgoing',
            partnerName: peer.name,
            filesCount: filesToUpload.length,
            firstFileName: filesToUpload[0]?.name || 'ملفات',
            totalBytes: filesToUpload.reduce((acc, f) => acc + (f.size || 0), 0),
            completedAt: Date.now(),
          });

          setTimeout(() => {
            setActiveTransfer((curr) => (curr?.status === 'completed' ? null : curr));
          }, 6000);
        },
        (err) => {
          playDeclinedSound();
          console.error('Upload failed:', err);
          setActiveTransfer((prev) => {
            if (!prev) return null;
            return { ...prev, status: 'error', errorMessage: err.message };
          });
          setTimeout(() => {
            setActiveTransfer((curr) => (curr?.status === 'error' ? null : curr));
          }, 6000);
        }
      );
    } catch (err) {
      playDeclinedSound();
      console.error('Transfer initiation failed:', err);
      setActiveTransfer({
        ...transferState,
        status: 'error',
        errorMessage: err.message,
      });
      setTimeout(() => {
        setActiveTransfer((curr) => (curr?.status === 'error' ? null : curr));
      }, 6000);
    }
  };

  // Safely dismiss completed or idle transfer modal locally without notifying server
  const dismissActiveTransfer = () => {
    setActiveTransfer(null);
  };

  // Cancel in-progress transfer
  const cancelActiveTransfer = () => {
    // If transfer is already completed, only dismiss locally; do not abort on server!
    if (activeTransfer?.status === 'completed') {
      setActiveTransfer(null);
      return;
    }

    const transferId = activeTransfer?.id;
    const targetBaseUrl = activeTransfer?.targetBaseUrl;

    if (transferId) {
      cancelledTransfersRef.current.add(transferId);

      // 1. Notify local/host server via WebSocket
      socketService.send('CANCEL_TRANSFER', {
        transferId,
        id: transferId,
        reason: 'User cancelled request',
      });

      // 2. Notify target peer server via HTTP endpoint
      cancelTransferOnPeer(targetBaseUrl, transferId, 'User cancelled request');
    }

    if (uploadControllerRef.current) {
      try {
        uploadControllerRef.current.abort();
      } catch (_) {}
      uploadControllerRef.current = null;
    }

    playDeclinedSound();
    setActiveTransfer(null);
  };

  // Remove single file from an outgoing transfer before recipient approves
  const removeSenderFile = async (fileName) => {
    const current = activeTransferRef.current;
    if (!current || !current.files || current.files.length === 0) return;

    const remainingFiles = current.files.filter((f) => f.name !== fileName);
    if (remainingFiles.length === 0) {
      // If all files are cancelled, cancel the entire transfer
      cancelActiveTransfer();
      return;
    }

    const remainingTotalBytes = remainingFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    setActiveTransfer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        files: remainingFiles,
        filesCount: remainingFiles.length,
        firstFileName: remainingFiles[0]?.name || 'ملف',
        totalBytes: remainingTotalBytes,
      };
    });

    if (current.id) {
      // 1. Instantly notify server via WebSocket
      socketService.send('REMOVE_FILE_FROM_TRANSFER', {
        transferId: current.id,
        fileName,
      });

      // 2. Also send via HTTP endpoint for peer consistency
      try {
        const baseUrl = (current.targetBaseUrl || '').replace(/\/$/, '');
        const targetUrl = baseUrl ? `${baseUrl}/api/transfer/remove-file` : '/api/transfer/remove-file';
        await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferId: current.id, fileName }),
        });
      } catch (e) {
        console.error('Failed to notify peer of removed file via HTTP:', e);
      }
    }
  };

  // Open / Run Received File directly in Windows default program
  const openFile = async (itemOrTransfer) => {
    const transferId = itemOrTransfer?.id;
    const fileName = itemOrTransfer?.firstFileName || itemOrTransfer?.name;
    const savedPath = itemOrTransfer?.savedPath;

    if (isHostMachine) {
      if (typeof window !== 'undefined' && window.fileflyDesktop && savedPath) {
        if (window.fileflyDesktop.openFile) {
          window.fileflyDesktop.openFile(savedPath);
          return;
        }
      }
      try {
        const res = await apiFetch('/api/open-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferId, fileName, filePath: savedPath }),
        });
        if (!res.ok && transferId) {
          window.open(`${getServerBaseUrl()}/api/transfer/view/${transferId}/0`, '_blank');
        }
      } catch (e) {
        console.error('Failed to open file:', e);
        if (transferId) {
          window.open(`${getServerBaseUrl()}/api/transfer/view/${transferId}/0`, '_blank');
        }
      }
    } else {
      // On web/mobile client: open/stream the file directly in browser media viewer
      if (transferId) {
        window.open(`${getServerBaseUrl()}/api/transfer/view/${transferId}/0`, '_blank');
      }
    }
  };

  return (
    <FileFlyContext.Provider
      value={{
        myDevice,
        isOnline,
        isMobileClient: typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || ''),
        peers,
        history,
        setHistory,
        isScanning,
        isRadarActive,
        toggleRadar,
        activeTransfer,
        pendingIncomingRequest,
        isQrModalOpen,
        isHistoryModalOpen,
        isRenameModalOpen,
        isInstallModalOpen,
        setIsQrModalOpen,
        setIsHistoryModalOpen,
        setIsRenameModalOpen,
        setIsInstallModalOpen,
        deferredInstallPrompt,
        isAppInstalled,
        installPwaApp,
        toggleVisibility,
        updateDeviceName,
        refreshPeers,
        openFile,
        isHostMachine: Boolean(myDevice?.isHost || isHostMachine),
        respondToIncomingRequest,
        sendFilesToDevice,
        cancelActiveTransfer,
        removeSenderFile,
        dismissActiveTransfer,
        activeServerUrl,
        updateActiveServer,
        apiFetch,
        clearHistory,
        deleteHistoryItem,
        reconnectSocket: () => socketService.reconnectNow(),
      }}
    >
      {children}
    </FileFlyContext.Provider>
  );
}

export function useFileFly() {
  const context = useContext(FileFlyContext);
  if (!context) {
    throw new Error('useFileFly must be used within a FileFlyProvider');
  }
  return context;
}
