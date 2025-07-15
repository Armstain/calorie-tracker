'use client';

import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown'
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      let isSlowConnection = false;
      let connectionType = 'unknown';

      // Check connection type if available
      if ('connection' in navigator) {
        const connection = (navigator as unknown as { connection: { effectiveType?: string; type?: string } }).connection;
        connectionType = connection.effectiveType || connection.type || 'unknown';
        
        // Consider 2G and slow-2g as slow connections
        isSlowConnection = connection.effectiveType ? ['slow-2g', '2g'].includes(connection.effectiveType) : false;
      }

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType
      });
    };

    // Initial check
    updateNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes if supported
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection: { addEventListener: (event: string, handler: () => void) => void } }).connection;
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      if ('connection' in navigator) {
        const connection = (navigator as unknown as { connection: { removeEventListener: (event: string, handler: () => void) => void } }).connection;
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}