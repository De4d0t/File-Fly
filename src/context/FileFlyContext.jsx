import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketClient.js';
import { requestTransferToPeer, uploadFilesToPeer, checkTransferApproval } from '../services/fileSender.js';
import { playTransferRequestSound, playSuccessSound, playDeclinedSound } from '../utils/soundEffects.js';
import { generateUUID } from '../utils/formatters.js';

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

  const getClientDefaultName = () => {
    const os = getClientOS();
    if (os === 'ios') return 'آيفون';
    if (os === 'android') return 'هاتف أندرويد';
    if (os === 'mac') return 'ماك بوك';
    if (os === 'windows') return 'لابتوب 2 (Windows)';
    return 'جهاز متصل';
  };

  // Helper to load client settings safely from localStorage
  const getInitialClientIdentity = () => {
    if (typeof window === 'undefined') {
      return { id: 'temp-id', name: 'جهازي', visible: true };
    }
    const id = localStorage.getItem('filefly_device_id') || generateUUID();
    localStorage.setItem('filefly_device_id', id);

    const name = localStorage.getItem('filefly_device_name') || getClientDefaultName();
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
  const [isRadarActive, setIsRadarActive] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('filefly_radar_active');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [pendingIncomingRequest, setPendingIncomingRequest] = useState(null);
  
  // Active transfer state for progress bars
  const [activeTransfer, setActiveTransfer] = useState(null);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

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
        setMyDevice(host);
        if (data.peers) {
          setPeers(data.peers.filter((p) => p.id !== host.id));
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

        // Set peers: filter out self
        const allFiltered = (data.peers || []).filter((p) => p.id !== clientIdentity.id);
        setPeers(allFiltered);
      }

      if (data.history) setHistory(data.history);
    };

    const unsubInitEvent = socketService.on('INIT_STATE', unsubInit);

    const unsubPeers = socketService.on('PEERS_UPDATE', (peersList) => {
      const currentMyDevice = myDeviceRef.current;
      const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('filefly_device_id') : null;
      const host = hostDeviceRef.current;

      const filtered = (peersList || []).filter((p) => {
        if (!p || !p.id) return false;
        if (currentMyDevice?.id && p.id === currentMyDevice.id) return false;
        if (savedClientId && p.id === savedClientId) return false;
        if (currentMyDevice?.isHost && (p.isHost || (host && p.id === host.id))) return false;
        return true;
      });

      setPeers(filtered);
    });

    const unsubScanStatus = socketService.on('SCAN_STATUS', (status) => {
      const scanning = typeof status === 'boolean' ? status : Boolean(status?.scanning);
      setIsScanning(scanning);
    });

    const unsubRadarStatus = socketService.on('RADAR_STATUS', (status) => {
      if (typeof status?.active === 'boolean') {
        setIsRadarActive(status.active);
        if (typeof window !== 'undefined') {
          localStorage.setItem('filefly_radar_active', String(status.active));
        }
      }
    });

    const unsubDevice = socketService.on('DEVICE_UPDATE', (updated) => {
      if (isHostMachine) {
        setMyDevice((prev) => ({ ...prev, ...updated }));
      }
    });

    // When someone wants to send files to this device
    const unsubRequest = socketService.on('TRANSFER_REQUEST', (transfer) => {
      const currentId = myDeviceRef.current?.id;

      // STRICT SAFETY CHECK: If I am the sender, DO NOT show incoming prompt to myself
      if (transfer.sender?.id && currentId && transfer.sender.id === currentId) {
        return;
      }

      // Automatically dismiss any open modal so transfer request is immediately unobstructed
      setIsQrModalOpen(false);
      setIsHistoryModalOpen(false);
      setIsRenameModalOpen(false);

      // Set pending request to display TransferModal immediately
      setPendingIncomingRequest(transfer);
      playTransferRequestSound();

      // Show native desktop notification if available
      if (window.fileflyDesktop?.showNotification) {
        window.fileflyDesktop.showNotification(
          'طلب استلام ملف جديد - FileFly',
          `الجهاز ${transfer.sender?.name || 'مجهول'} يرغب في إرسال ${transfer.files?.length || 1} ملف.`
        );
      }
    });

    // Live progress for incoming files
    const unsubProgress = socketService.on('TRANSFER_PROGRESS', (progress) => {
      setActiveTransfer((prev) => {
        if (!prev || prev.id !== progress.id) return prev;
        return {
          ...prev,
          ...progress,
          status: 'transferring',
        };
      });
    });

    // Transfer completed
    const unsubCompleted = socketService.on('TRANSFER_COMPLETED', (transfer) => {
      playSuccessSound();
      setActiveTransfer((prev) => {
        if (!prev || prev.id !== transfer.id) return null;
        return { ...prev, status: 'completed', percentage: 100 };
      });

      if (transfer.historyItem) {
        setHistory((prev) => [transfer.historyItem, ...prev]);
      }

      // Keep completion card visible for 12 seconds so receiver can choose to Open or Download
      setTimeout(() => {
        setActiveTransfer((curr) => (curr?.status === 'completed' ? null : curr));
      }, 12000);
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

      if (window.fileflyDesktop?.showNotification) {
        window.fileflyDesktop.showNotification(
          'تم رفض طلب النقل - FileFly',
          `قام ${transfer.recipient?.name || 'المستلم'} برفض طلب نقل الملف.`
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
      unsubRadarStatus();
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
              ...progress,
              status: 'transferring',
            };
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

  // Open Downloads Folder in Explorer (on host PC) or open History/Downloads Modal (on mobile/second PC)
  const openDownloadsFolder = async () => {
    if (isHostMachine) {
      if (typeof window !== 'undefined' && window.fileflyDesktop?.openDownloadsFolder) {
        window.fileflyDesktop.openDownloadsFolder();
        return;
      }
      try {
        await fetch('/api/open-downloads', { method: 'POST' });
      } catch (e) {
        console.error('Failed to open downloads folder:', e);
      }
    } else {
      setIsHistoryModalOpen(true);
    }
  };

  // Open / Run Received File
  const openFile = async (itemOrTransfer) => {
    const transferId = itemOrTransfer?.id;
    const fileName = itemOrTransfer?.firstFileName || itemOrTransfer?.name;
    const savedPath = itemOrTransfer?.savedPath;

    if (isHostMachine) {
      try {
        await fetch('/api/open-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferId, fileName, filePath: savedPath }),
        });
      } catch (e) {
        console.error('Failed to open file:', e);
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
        setIsQrModalOpen,
        setIsHistoryModalOpen,
        setIsRenameModalOpen,
        toggleVisibility,
        updateDeviceName,
        refreshPeers,
        openDownloadsFolder,
        openFile,
        respondToIncomingRequest,
        sendFilesToDevice,
        cancelActiveTransfer,
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
