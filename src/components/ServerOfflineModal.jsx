import { useEffect, useRef } from 'react';
import { useFileFly } from '../context/FileFlyContext.jsx';
import { scanLocalNetworkForServer } from '../services/serverDiscovery.js';

export default function ServerOfflineModal() {
  const { 
    isOnline, 
    isHostMachine, 
    updateActiveServer 
  } = useFileFly();

  const abortControllerRef = useRef(null);
  const isScanningRef = useRef(false);

  // Background continuous network probe to auto-discover server when network returns
  useEffect(() => {
    if (isHostMachine || isOnline) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isScanningRef.current = false;
      return;
    }

    let isMounted = true;

    const runContinuousScan = async () => {
      if (isScanningRef.current) return;
      isScanningRef.current = true;

      while (isMounted && !isOnline && !isHostMachine) {
        abortControllerRef.current = new AbortController();

        try {
          const found = await scanLocalNetworkForServer(null, abortControllerRef.current.signal);

          if (found && found.ok && isMounted) {
            updateActiveServer(found.url);
            break;
          }
        } catch (_) {
          // Ignore abort or network errors
        }

        // Wait 2 seconds before next round
        if (isMounted && !isOnline) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      isScanningRef.current = false;
    };

    const startTimer = setTimeout(() => {
      if (!isOnline && !isHostMachine && isMounted) {
        runContinuousScan();
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(startTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isScanningRef.current = false;
    };
  }, [isOnline, isHostMachine, updateActiveServer]);

  return null;
}
