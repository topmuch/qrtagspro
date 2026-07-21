'use client';

/**
 * QR Scanner Component — uses html5-qrcode for webcam QR detection
 *
 * Props:
 *   onScan: (decodedText: string) => void  — called when a QR is detected
 *   onClose: () => void                    — called when user closes the scanner
 *
 * The component handles camera permissions, errors, and cleanup.
 * It stops the camera when unmounted or when onClose is called.
 */

import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeInstance = useRef<any>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (!scannerRef.current) return;

      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');

        if (!mounted) return;

        const scanner = new Html5Qrcode('qr-scanner-region', {
          verbose: false,
        });
        html5QrcodeInstance.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            // Success — stop scanner and call onScan
            console.log('[QRScanner] QR detected:', decodedText);
            if (mounted) {
              onScan(decodedText);
            }
          },
          (errorMessage: string) => {
            // Per-frame error — ignore (just means no QR in this frame)
          }
        );

        if (mounted) {
          setStatus('scanning');
        }
      } catch (err: any) {
        console.error('[QRScanner] Start failed:', err);
        if (mounted) {
          setStatus('error');
          if (err?.name === 'NotAllowedError') {
            setErrorMsg('Accès caméra refusé. Autorisez la caméra dans votre navigateur, ou saisissez la référence manuellement.');
          } else if (err?.name === 'NotFoundError') {
            setErrorMsg('Aucune caméra détectée sur cet appareil.');
          } else {
            setErrorMsg(err?.message || 'Impossible de démarrer la caméra.');
          }
        }
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (html5QrcodeInstance.current) {
        try {
          html5QrcodeInstance.current.stop().then(() => {
            html5QrcodeInstance.current?.clear();
          }).catch(() => {
            // silent
          });
        } catch {
          // silent
        }
      }
    };
  }, [onScan]);

  const handleManualClose = async () => {
    if (html5QrcodeInstance.current) {
      try {
        await html5QrcodeInstance.current.stop();
        html5QrcodeInstance.current.clear();
      } catch {
        // silent
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black bg-[#111111]">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#E3B23C]" />
            Scanner un QR code
          </h3>
          <button
            type="button"
            onClick={handleManualClose}
            className="text-white/60 hover:text-white p-1"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner area */}
        <div className="relative">
          <div id="qr-scanner-region" ref={scannerRef} className="w-full aspect-square bg-black" />

          {status === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Démarrage de la caméra...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
              <div className="text-center text-white max-w-xs">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
                <p className="text-sm font-medium mb-2">Caméra indisponible</p>
                <p className="text-xs text-white/70">{errorMsg}</p>
              </div>
            </div>
          )}

          {status === 'scanning' && (
            <>
              {/* Scan overlay (corner brackets) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-[250px] h-[250px]">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#E3B23C]" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#E3B23C]" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#E3B23C]" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#E3B23C]" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer instructions */}
        <div className="p-4 bg-gray-50 border-t-2 border-black">
          <p className="text-xs text-black/70 text-center">
            {status === 'scanning'
              ? 'Pointez la caméra vers le QR code du sticker.'
              : 'Autorisez l\'accès caméra pour scanner un QR code.'}
          </p>
          <button
            type="button"
            onClick={handleManualClose}
            className="mt-3 w-full py-2.5 rounded-lg bg-white border-2 border-black text-sm font-semibold text-black hover:bg-gray-100 transition"
          >
            Fermer le scanner
          </button>
        </div>
      </div>
    </div>
  );
}
