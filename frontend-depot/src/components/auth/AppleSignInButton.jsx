import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

const APPLE_SCRIPT_ID = 'apple-sign-in-js';
const APPLE_SCRIPT_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

function loadAppleScript() {
  if (window.AppleID?.auth) return Promise.resolve();

  const existing = document.getElementById(APPLE_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Apple Sign-In indisponible.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = APPLE_SCRIPT_ID;
    script.src = APPLE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger Apple Sign-In.'));
    document.head.appendChild(script);
  });
}

export default function AppleSignInButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI;

  const handleClick = useCallback(async () => {
    if (disabled || !clientId || !redirectURI) return;

    try {
      const { data: challenge } = await api.get('/auth/apple/challenge');
      await loadAppleScript();

      if (!window.AppleID?.auth) throw new Error('Apple Sign-In indisponible.');

      window.AppleID.auth.init({
        clientId,
        scope: 'name email',
        redirectURI,
        state: challenge.state,
        nonce: challenge.nonce,
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const authorization = response?.authorization;
      if (!authorization?.code || authorization.state !== challenge.state) {
        throw new Error('Réponse Apple invalide.');
      }

      await onCredential({
        code: authorization.code,
        state: authorization.state,
        nonce: challenge.nonce,
      });
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Connexion Apple impossible.';
      window.dispatchEvent(new CustomEvent('gestock:auth-error', { detail: { message } }));
    }
  }, [clientId, disabled, onCredential, redirectURI]);

  useEffect(() => {
    if (!clientId || !redirectURI) return undefined;
    let cancelled = false;
    loadAppleScript().then(() => {
      if (!cancelled) setReady(true);
    }).catch(() => {
      if (!cancelled) setReady(false);
    });
    return () => { cancelled = true; };
  }, [clientId, redirectURI]);

  if (!clientId || !redirectURI) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={disabled || !ready}
      className="w-full h-11 rounded-xl border border-gray-200 bg-black text-white font-medium flex items-center justify-center gap-3 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label="Continuer avec Apple"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M16.7 12.7c0-2.5 2.1-3.7 2.2-3.8-1.2-1.7-3.1-1.9-3.8-1.9-1.6-.2-3.1 1-3.9 1-.8 0-2-1-3.3-1-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.5 3.3 2.5 1.3-.1 1.8-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.3-1.2 3.2-2.4 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-4.2Zm-2.6-7.4c.7-.9 1.2-2.1 1.1-3.3-1.1.1-2.4.7-3.1 1.6-.7.8-1.3 2.1-1.1 3.2 1.2.1 2.4-.6 3.1-1.5Z" />
      </svg>
      Continuer avec Apple
    </button>
  );
}
