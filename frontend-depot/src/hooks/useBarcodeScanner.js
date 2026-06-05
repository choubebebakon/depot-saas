import { useState, useRef, useEffect, useCallback } from 'react';

const SCAN_TIMEOUT = 50;

/**
 * Écoute universelle clavier/périphérique scan.
 * @param {object} options
 * @param {function} options.onScan - Callback appelé avec le code scanné
 * @param {boolean} options.enabled - Activer/désactiver l'écoute (défaut: true)
 * @returns {{ scannedCode: string|null, resetScan: function }}
 */
export function useBarcodeScanner({ onScan, enabled = true } = {}) {
  const [scannedCode, setScannedCode] = useState(null);
  const bufferRef = useRef('');
  const timerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const lastKeyTimeRef = useRef(0);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const resetScan = useCallback(() => {
    bufferRef.current = '';
    setScannedCode(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const code = bufferRef.current;
        if (code.length >= 4) {
          setScannedCode(code);
          if (onScanRef.current) onScanRef.current(code);
        }
        bufferRef.current = '';
        clearTimeout(timerRef.current);
        return;
      }

      if (e.key.length === 1) {
        const now = Date.now();
        if (now - lastKeyTimeRef.current > SCAN_TIMEOUT && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }
        lastKeyTimeRef.current = now;
        bufferRef.current += e.key;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [enabled]);

  return { scannedCode, resetScan };
}

export default useBarcodeScanner;
