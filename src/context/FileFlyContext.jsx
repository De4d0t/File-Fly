import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketClient.js';
import { requestTransferToPeer, uploadFilesToPeer, checkTransferApproval } from '../services/fileSender.js';
import { playTransferRequestSound, playSuccessSound, playDeclinedSound } from '../utils/soundEffects.js';

const FileFlyContext = createContext(null);

export function FileFlyProvider({ children }) {
  // Device identity
  const [myDevice, setMyDevice] = useState({
    id: 'local-dev',
    name: 'جهازي',
    visible: true,
    os: 'windows',
    ip: '127.0.0.1',
    port: 53316,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [peers, setPeers] = useState([]);
  const [history, setHistory] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [pendingIncomingRequest, setPendingIncomingRequest] = useState(null);
  
  // Active transfer state for progress bars
  const [activeTransfer, setActiveTransfer] = useState(null);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // Active XHR upload controller reference
  const uploadControllerRef = useRef(null);

  // Register mobile device if opening on a phone browser
  const registerMobileClient = useCallback(async (deviceData) => {
    try {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const osType = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? 'ios'
        : /Android/i.test(navigator.userAgent)
        ? 'android'
        : 'browser';

      // Load saved mobile name from localStorage if exists
      const savedMobileName = localStorage.getItem('filefly_device_name');
      const finalName = savedMobileName || (isMobile ? (osType === 'ios' ? 'آيفون' : 'أندرويد') : deviceData?.name || 'متصفح');

      await fetch('/api/peers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deviceData?.id || localStorage.getItem('filefly_device_id') || crypto.randomUUID(),
          name: finalName,
          os: osType,
        }),
      });
    } catch (e) {}
  }, []);

  // Initialize Socket and listeners
  useEffect(() => {
    socketService.connect();

    const unsubConnection = socketService.on('connection_change', (connected) => {
      setIsOnline(connected);
    });

    const unsubInit = socketService.on('INIT_STATE', (data) => {
      if (data.device) {
        setMyDevice(data.device);
        registerMobileClient(data.device);
      }
      if (data.peers) setPeers(data.peers);
      if (data.history) setHistory(data.history);
    });

    const unsubPeers = socketService.on('PEERS_UPDATE', (peersList) => {
      setPeers(peersList || []);
    });

    const unsubScanStatus = socketService.on('SCAN_STATUS', (status) => {
      setIsScanning(Boolean(status?.scanning));
    });

    const unsubDevice = socketService.on('DEVICE_UPDATE', (updated) => {
      setMyDevice((prev) => ({ ...prev, ...updated }));
    });

    // When someone wants to send files to this device
    const unsubRequest = socketService.on('TRANSFER_REQUEST', (transfer) => {
      setPendingIncomingRequest(transfer);
      playTransferRequestSound();

      // Show native desktop notification if available
      if (window.fileflyDesktop?.showNotification) {
        window.fileflyDesktop.showNotification(
          'طلب نقل ملف جديد - FileFly',
          `الجهاز ${transfer.sender.name} يرغب في إرسال ${transfer.files.length} ملف.`
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

      setTimeout(() => {
        setActiveTransfer(null);
      }, 4000);
    });

    // Transfer cancelled
    const unsubCancelled = socketService.on('TRANSFER_CANCELLED', () => {
      playDeclinedSound();
      setActiveTransfer(null);
      setPendingIncomingRequest(null);
    });

    return () => {
      unsubConnection();
      unsubInit();
      unsubPeers();
      unsubScanStatus();
      unsubDevice();
      unsubRequest();
      unsubProgress();
      unsubCompleted();
      unsubCancelled();
    };
  }, [registerMobileClient]);

  // Toggle Visibility (مكشوف / مخفي)
  const toggleVisibility = async () => {
    const nextState = !myDevice.visible;
    setMyDevice((prev) => ({ ...prev, visible: nextState }));

    socketService.send('SET_VISIBILITY', { visible: nextState });

    try {
      await fetch('/api/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: nextState }),
      });
    } catch (e) {}
  };

  // Update device name
  const updateDeviceName = async (newName) => {
    if (!newName || !newName.trim()) return;
    const name = newName.trim();
    setMyDevice((prev) => ({ ...prev, name }));
    localStorage.setItem('filefly_device_name', name);

    socketService.send('SET_NAME', { name });

    try {
      await fetch('/api/device-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch (e) {}
  };

  // Refresh discovered peers list
  const refreshPeers = () => {
    socketService.send('REFRESH_PEERS', {});
  };

  // Accept or decline incoming transfer
  const respondToIncomingRequest = async (decision) => {
    if (!pendingIncomingRequest) return;
    const transferId = pendingIncomingRequest.id;

    if (decision === 'accept') {
      setActiveTransfer({
        id: transferId,
        direction: 'incoming',
        partnerName: pendingIncomingRequest.sender.name,
        filesCount: pendingIncomingRequest.files.length,
        firstFileName: pendingIncomingRequest.files[0]?.name || 'ملفات',
        totalBytes: pendingIncomingRequest.totalBytes,
        bytesTransferred: 0,
        percentage: 0,
        speedBps: 0,
        status: 'transferring',
      });
    } else {
      playDeclinedSound();
    }

    setPendingIncomingRequest(null);

    try {
      await fetch('/api/transfer/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, decision }),
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

      // Step 2: Poll / wait for receiver's response
      let isApproved = false;
      let attempts = 0;

      while (!isApproved && attempts < 45) { // 45 seconds timeout
        await new Promise((res) => setTimeout(res, 1000));
        attempts++;

        const statusData = await checkTransferApproval(targetBaseUrl, transferId);
        if (statusData.status === 'accepted') {
          isApproved = true;
          break;
        } else if (statusData.status === 'declined' || statusData.status === 'cancelled') {
          playDeclinedSound();
          setActiveTransfer(null);
          alert(`تم رفض الطلب من قِبل ${peer.name}`);
          return;
        }
      }

      if (!isApproved) {
        setActiveTransfer(null);
        alert(`انتهت مهلة انتظار الموافقة من ${peer.name}`);
        return;
      }

      // Step 3: Stream file upload
      setActiveTransfer((prev) => ({ ...prev, status: 'transferring' }));

      uploadControllerRef.current = uploadFilesToPeer(
        targetBaseUrl,
        transferId,
        files,
        (progress) => {
          setActiveTransfer((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              bytesTransferred: progress.loaded,
              totalBytes: progress.total,
              percentage: progress.percentage,
              speedBps: progress.speedBps || prev.speedBps,
            };
          });
        },
        () => {
          playSuccessSound();
          setActiveTransfer((prev) => ({
            ...prev,
            status: 'completed',
            percentage: 100,
          }));

          setTimeout(() => {
            setActiveTransfer(null);
          }, 3500);
        },
        (error) => {
          playDeclinedSound();
          alert(`خطأ أثناء النقل: ${error.message}`);
          setActiveTransfer(null);
        }
      );
    } catch (err) {
      playDeclinedSound();
      alert(`تعذر بدء النقل: ${err.message}`);
      setActiveTransfer(null);
    }
  };

  // Cancel active transfer
  const cancelActiveTransfer = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort();
      uploadControllerRef.current = null;
    }
    setActiveTransfer(null);
  };

  // Open downloads folder on PC
  const openDownloadsFolder = async () => {
    if (window.fileflyDesktop?.openDownloadsFolder) {
      window.fileflyDesktop.openDownloadsFolder();
    } else {
      try {
        await fetch('/api/open-downloads', { method: 'POST' });
      } catch (e) {}
    }
  };

  return (
    <FileFlyContext.Provider
      value={{
        myDevice,
        isOnline,
        peers,
        history,
        isScanning,
        activeTransfer,
        pendingIncomingRequest,
        isQrModalOpen,
        setIsQrModalOpen,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        isRenameModalOpen,
        setIsRenameModalOpen,
        toggleVisibility,
        updateDeviceName,
        refreshPeers,
        respondToIncomingRequest,
        sendFilesToDevice,
        cancelActiveTransfer,
        openDownloadsFolder,
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
