import { useState, useRef, useEffect, useCallback } from 'react';

// Les scanners USB/Bluetooth HID envoient généralement les caractères très
// rapidement puis terminent par Enter. On garde une fenêtre courte pour ne
// pas confondre une saisie clavier humaine avec un scan.
const INTER_KEY_TIMEOUT_MS = 60;
const BUFFER_IDLE_TIMEOUT_MS = 250;
const MIN_BARCODE_LENGTH = 4;

function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest('[contenteditable="true"]')) return true;

  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useBarcodeScanner({ onScan, enabled = true } = {}) {
  const [scannedCode, setScannedCode] = useState(null);
  const bufferRef = useRef('');
  const timerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const clearBuffer = useCallback(() => {
    bufferRef.current = '';
    lastKeyTimeRef.current = 0;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetScan = useCallback(() => {
    clearBuffer();
    setScannedCode(null);
  }, [clearBuffer]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event) => {
      // Si le scanner est branché sur le champ visible, le navigateur gère
      // directement les caractères et le submit du formulaire. Le listener
      // global ne doit surtout pas traiter une deuxième fois ces touches.
      if (isEditableTarget(event.target)) return;

      // Une touche modifiée (Ctrl/Cmd/Alt) ne fait pas partie d'un scan HID.
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === 'Enter') {
        const code = bufferRef.current.trim();

        if (code.length >= MIN_BARCODE_LENGTH) {
          setScannedCode(code);
          onScanRef.current?.(code);
        }

        clearBuffer();
        return;
      }

      if (event.key.length !== 1) return;

      const now = performance.now();
      const previous = lastKeyTimeRef.current;

      if (previous > 0 && now - previous > INTER_KEY_TIMEOUT_MS) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = now;
      bufferRef.current += event.key;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(clearBuffer, BUFFER_IDLE_TIMEOUT_MS);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearBuffer();
    };
  }, [enabled, clearBuffer]);

  return { scannedCode, resetScan };
}
