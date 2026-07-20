'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer l'abonnement aux push notifications VAPID.
 *
 * Flow:
 * 1. Demande la clé publique VAPID depuis l'API
 * 2. Si permission notification accordée → subscribe au service worker
 * 3. Envoie la subscription au serveur (POST /api/push/subscribe)
 * 4. Quand le serveur envoie un push → le SW affiche la notification
 *
 * Utilisation sur /suivi/[reference]:
 * const { isSubscribed, subscribe } = usePushNotification(reference);
 */
export function usePushNotification(reference: string) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch VAPID public key
  useEffect(() => {
    fetch('/api/push/subscribe')
      .then(r => r.json())
      .then(d => { if (d.publicKey) setPublicKey(d.publicKey); })
      .catch(() => {});
  }, []);

  // Check if already subscribed
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => {
        if (sub) setIsSubscribed(true);
      })
      .catch(() => {});
  }, []);

  const subscribe = useCallback(async () => {
    if (!publicKey || loading) return;
    setLoading(true);

    try {
      // 1. Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setLoading(false);
        return false;
      }

      // 2. S'abonner via le service worker
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // 3. Envoyer la subscription au serveur
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          subscription: sub.toJSON(),
        }),
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[push] Subscribe error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey, reference, loading]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, endpoint: sub.endpoint }),
        });
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('[push] Unsubscribe error:', err);
    }
  }, [reference]);

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    loading,
    supported: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window,
  };
}

// Helper: convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
