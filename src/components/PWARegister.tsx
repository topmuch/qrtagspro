'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        // Demand permission for notifications after SW is registered
        if ('Notification' in window && Notification.permission === 'default') {
          // Don't ask immediately — wait for user interaction (delayed)
          setTimeout(() => {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                console.log('[QRTags PWA] Notification permission granted');
              }
            });
          }, 5000); // 5s delay so user sees the app first
        }
      }).catch(() => {
        // Fail silently
      });
    }
  }, []);

  return null;
}
