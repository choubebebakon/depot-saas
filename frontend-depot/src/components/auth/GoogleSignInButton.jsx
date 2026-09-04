import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Impossible de charger Google Sign-In.'));
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;

    if (!clientId || !containerRef.current || disabled) return undefined;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) callbackRef.current(response.credential);
          },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: Math.min(containerRef.current.clientWidth || 360, 400),
          logo_alignment: 'left',
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Google Sign-In indisponible.');
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [clientId, disabled]);

  if (!clientId) return null;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="min-h-[44px] flex items-center justify-center overflow-hidden"
        aria-label="Se connecter avec Google"
        aria-disabled={disabled}
      />
      {error && <p className="text-center text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
