import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketClient.js';
import { requestTransferToPeer, uploadFilesToPeer, checkTransferApproval } from '../services/fileSender.js';
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

const FileFlyContext = createContext(null);

export function FileFlyProvider({ children }) {
  const isHostMachine = typeof window !== 'undefined' && (
    Boolean(window.fileflyDesktop) ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
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

  // Device identity
  const [myDevice, setMyDevice] = useState({
    id: initialIdentity.id,
    name: initialIdentity.name,
    visible: initialIdentity.visible,
    os: getClientOS(),
    ip: typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1',
    port: 53316,
    isHost: isHostMachine,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [peers, setPeers] = useState([]);
  const [history, setHistory] = useState([]);
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

    const unsubConnection = socketService.on('connection_change', (connected) => {
      setIsOnline(connected);
      if (connected && !isHostMachine) {
        const clientIdentity = getInitialClientIdentity();
        socketService.send('REGISTER_PEER', {
          id: clientIdentity.id,
          name: clientIdentity.name,
          visible: clientIdentity.visible,
          os: getClientOS(),
        });
      }
    });

    const unsubInit = (data) => {
      const host = data.hostDevice || data.device;
      if (host) {
        hostDeviceRef.current = host;
      }

      const isHost = Boolean(
        data.isLocalHost ||
        window.fileflyDesktop ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );

      if (isHost && host) {
        const cleanHost = { ...host, name: shortenDeviceName(host.name) };
        setMyDevice(cleanHost);
        if (typeof window !== 'undefined' && cleanHost.name) {
          localStorage.setItem('filefly_device_name', cleanHost.name);
        }
        if (data.peers) {
          setPeers(processPeersList(data.peers));
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

        // Announce our presence to the host
        socketService.send('REGISTER_PEER', {
          id: clientIdentity.id,
          name: clientIdentity.name,
          visible: clientIdentity.visible,
          os: clientOS,
        });

        // Set peers: filter out self and deduplicate
        if (data.peers) {
          setPeers(processPeersList(data.peers));
        }
      }

      if (data.history) setHistory(data.history);
    };

    const processPeersList = (rawPeers) => {
      const currentMyDevice = myDeviceRef.current;
      const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('filefly_device_id') : null;
      const host = hostDeviceRef.current;

      const filtered = (rawPeers || []).filter((p) => {
        if (!p || !p.id) return false;
        if (currentMyDevice?.id && p.id === currentMyDevice.id) return false;
        if (savedClientId && p.id === savedClientId) return false;
        if (!currentMyDevice?.isHost && currentMyDevice?.ip && p.ip === currentMyDevice.ip) return false;
        if (currentMyDevice?.isHost && (p.isHost || (host && p.id === host.id))) return false;
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

    // Live progress for incoming & outgoing files
    const unsubProgress = socketService.on('TRANSFER_PROGRESS', (progress) => {
      setActiveTransfer((prev) => {
        if (!prev || (prev.id && prev.id !== progress.id)) {
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
      playSuccessSound();
      setActiveTransfer((prev) => {
        const id = transfer.id || prev?.id;
        const firstFileName = transfer.historyItem?.firstFileName || transfer.firstFileName || prev?.firstFileName || 'ملف';
        const isIncoming = prev?.direction === 'incoming' || transfer.direction === 'incoming';

        // Keep completed transfer state for user interaction without automatically opening the file
        const resolvedCount = transfer.files?.length || transfer.historyItem?.filesCount || prev?.filesCount || 1;

        if (!prev || (prev.id && prev.id !== transfer.id)) {
          return {
            id,
            direction: isIncoming ? 'incoming' : 'outgoing',
            partnerName: transfer.sender?.name || prev?.partnerName || 'جهاز',
            filesCount: resolvedCount,
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
        };
      });

      // Show system notification for completion
      const firstFileName = transfer.historyItem?.firstFileName || transfer.firstFileName || 'الملف';
      showSystemNotification('اكتمل نقل الملف بنجاح! 🎉', {
        body: `تم استلام ${firstFileName} بنجاح عبر FileFly.`,
        tag: 'filefly-transfer',
      });

      if (transfer.historyItem) {
        setHistory((prev) => [transfer.historyItem, ...prev]);
      }

      // Keep completion card visible for 25 seconds so receiver can easily click Save or Preview
      setTimeout(() => {
        setActiveTransfer((curr) => (curr?.status === 'completed' ? null : curr));
      }, 25000);
    });

    // Transfer declined by recipient
    const unsubDeclined = socketService.on('TRANSFER_DECLINED', (transfer) => {
      playDeclinedSound();
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

    return () => {
      unsubConnection();
      unsubInitEvent();
      unsubPeers();
      unsubScanStatus();
      unsubDevice();
      unsubRequest();
      unsubProgress();
      unsubCompleted();
      unsubDeclined();
      unsubCancelled();
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
        await fetch('/api/visibility', {
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
        await fetch('/api/device-name', {
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

  // Accept or decline incoming transfer
  const respondToIncomingRequest = async (decision) => {
    if (!pendingIncomingRequest) return;
    const request = pendingIncomingRequest;
    const transferId = request.id;

    if (decision === 'accept') {
      setActiveTransfer({
        id: transferId,
        direction: 'incoming',
        partnerName: request.sender.name,
        filesCount: request.files.length,
        firstFileName: request.files[0]?.name || 'ملفات',
        totalBytes: request.totalBytes,
        bytesTransferred: 0,
        percentage: 0,
        speedBps: 0,
        status: 'transferring',
      });
    } else {
      playDeclinedSound();
      socketService.send('TRANSFER_DECISION', {
        transferId: transferId,
        decision: 'decline',
        responderId: myDevice.id,
      });

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
    }

    setPendingIncomingRequest(null);

    try {
      await fetch('/api/transfer/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, decision, responderId: myDevice.id }),
      });
    } catch (e) {}
  };

  // Initiate sending files to a peer
  const sendFilesToDevice = async (peer, fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);

    // Set initial waiting transfer state
    const transferState = {
      id: null,
      direction: 'outgoing',
      partnerName: peer.name,
      filesCount: files.length,
      firstFileName: files[0]?.name || 'ملف',
      totalBytes,
      bytesTransferred: 0,
      percentage: 0,
      speedBps: 0,
      status: 'waiting_approval', // waiting_approval -> transferring -> completed
    };

    setActiveTransfer(transferState);

    try {
      // Step 1: Send transfer request
      const { transferId, targetBaseUrl } = await requestTransferToPeer(peer, files, myDevice);
      transferState.id = transferId;
      setActiveTransfer({ ...transferState });

      // Step 2: Poll for recipient response
      let approved = false;
      let checkAttempts = 0;
      const maxAttempts = 60; // 60 seconds timeout

      while (!approved && checkAttempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000));
        checkAttempts++;

        const statusResponse = await checkTransferApproval(targetBaseUrl, transferId);
        
        if (statusResponse.status === 'accepted') {
          approved = true;
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
          }, 9000);
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
        }, 8000);
        return;
      }

      // Step 3: Start uploading
      transferState.status = 'transferring';
      setActiveTransfer({ ...transferState });

      uploadControllerRef.current = uploadFilesToPeer(
        targetBaseUrl,
        transferId,
        files,
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

          // Relay live progress to recipient via WebSocket
          socketService.send('CLIENT_TRANSFER_PROGRESS', {
            id: transferId,
            bytesTransferred: progress.loaded,
            totalBytes: progress.total,
            percentage: progress.percentage,
            speedBps: progress.speedBps,
          });
        },
        () => {
          playSuccessSound();
          setActiveTransfer((prev) => {
            if (!prev) return null;
            return { ...prev, status: 'completed', percentage: 100 };
          });

          // Add to local history
          setHistory((prev) => [
            {
              id: transferId,
              direction: 'outgoing',
              partnerName: peer.name,
              filesCount: files.length,
              firstFileName: files[0]?.name || 'ملفات',
              totalBytes,
              completedAt: Date.now(),
            },
            ...prev,
          ]);

          setTimeout(() => {
            setActiveTransfer((curr) => (curr?.status === 'completed' ? null : curr));
          }, 9000);
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
          }, 8000);
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
      }, 8000);
    }
  };

  // Cancel outgoing transfer
  const cancelActiveTransfer = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort();
    }
    setActiveTransfer(null);
  };

  // Open Downloads Folder in Explorer (on host PC or via API)
  const openDownloadsFolder = async (itemOrPath) => {
    let filePath = null;
    if (typeof itemOrPath === 'string') {
      filePath = itemOrPath;
    } else if (itemOrPath?.savedPath) {
      filePath = itemOrPath.savedPath;
    }

    if (isHostMachine) {
      if (typeof window !== 'undefined' && window.fileflyDesktop) {
        if (filePath && window.fileflyDesktop.showInFolder) {
          window.fileflyDesktop.showInFolder(filePath);
          return;
        }
        if (window.fileflyDesktop.openDownloadsFolder) {
          window.fileflyDesktop.openDownloadsFolder();
          return;
        }
      }
      try {
        await fetch('/api/open-downloads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        });
      } catch (e) {
        console.error('Failed to open downloads folder:', e);
      }
    } else {
      setIsHistoryModalOpen(true);
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
        const res = await fetch('/api/open-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferId, fileName, filePath: savedPath }),
        });
        if (!res.ok && transferId) {
          window.open(`/api/transfer/view/${transferId}/0`, '_blank');
        }
      } catch (e) {
        console.error('Failed to open file:', e);
        if (transferId) {
          window.open(`/api/transfer/view/${transferId}/0`, '_blank');
        }
      }
    } else {
      // On web/mobile client: open/stream the file directly in browser media viewer
      if (transferId) {
        window.open(`/api/transfer/view/${transferId}/0`, '_blank');
      }
    }
  };

  return (
    <FileFlyContext.Provider
      value={{
        myDevice,
        isOnline,
        isHostMachine,
        isMobileClient: typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || ''),
        peers,
        history,
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
        openDownloadsFolder,
        openFile,
        respondToIncomingRequest,
        sendFilesToDevice,
        cancelActiveTransfer,
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
