'use client';

import { useEffect, useRef, useState } from 'react';

interface ScanEventData {
  [key: string]: unknown;
  _broadcastAt?: string;
  _source?: string;
}

interface UseTrackingSocketReturn {
  /** Whether the socket is currently connected to the server. */
  isConnected: boolean;
  /** The most recent scan event payload received for this reference. */
  lastEvent: ScanEventData | null;
}

/**
 * Tracking hook — uses polling (not WebSocket) for maximum reliability.
 *
 * The WebSocket mini-service (tracking-ws) requires port 3005 to be
 * proxied by Caddy/Nginx, which is complex to configure on Coolify.
 * Polling every 15s is simpler, more reliable, and sufficient for
 * baggage tracking (scans are not sub-second events).
 *
 * If WebSocket is needed later, re-enable the socket.io code below.
 */
export function useTrackingSocket(reference: string): UseTrackingSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ScanEventData | null>(null);
  const lastScanDateRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!reference) return;
    mountedRef.current = true;

    const POLL_INTERVAL = 15000; // 15 secondes

    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(`/api/suivi/${reference}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!mountedRef.current) return;

        setIsConnected(true);

        // Détecter un nouveau scan en comparant la date du dernier scan
        const currentLastScan = data.baggage?.lastScanDate || null;
        if (currentLastScan && currentLastScan !== lastScanDateRef.current) {
          if (lastScanDateRef.current !== null) {
            // Nouveau scan détecté !
            setLastEvent({
              reference,
              scanDate: currentLastScan,
              location: data.baggage?.lastLocation || null,
              _source: 'polling',
              _broadcastAt: new Date().toISOString(),
            });
          }
          lastScanDateRef.current = currentLastScan;
        }
      } catch {
        if (mountedRef.current) setIsConnected(false);
      }
    };

    // Premier poll immédiat
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [reference]);

  return { isConnected, lastEvent };
}