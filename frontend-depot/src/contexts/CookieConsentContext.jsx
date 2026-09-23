import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CookieConsentContext = createContext(null);

const CONSENT_KEY = 'gestock_cookie_consent';
const CONSENT_VERSION = '1.0';

const defaultConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
  version: CONSENT_VERSION,
  timestamp: null,
};

export function CookieConsentProvider({ children }) {
  const [consent, setConsentState] = useState(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          return { ...defaultConsent, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to parse cookie consent:', e);
    }
    return defaultConsent;
  });

  const [showBanner, setShowBanner] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version !== CONSENT_VERSION) {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateConsent = useCallback((newConsent) => {
    const updated = {
      ...defaultConsent,
      ...consent,
      ...newConsent,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    setConsentState(updated);
    localStorage.setItem(CONSENT_KEY, JSON.stringify(updated));
    setShowBanner(false);
    
    if (newConsent.analytics) {
      window.dispatchEvent(new CustomEvent('gestock:consent:analytics', { detail: true }));
    }
    if (newConsent.marketing) {
      window.dispatchEvent(new CustomEvent('gestock:consent:marketing', { detail: true }));
    }
  }, [consent]);

  const acceptAll = useCallback(() => {
    updateConsent({ analytics: true, marketing: true, preferences: true });
  }, [updateConsent]);

  const rejectAll = useCallback(() => {
    updateConsent({ analytics: false, marketing: false, preferences: false });
  }, [updateConsent]);

  const openBanner = useCallback(() => setShowBanner(true), []);

  const hasConsent = useCallback((category) => {
    return consent[category] === true;
  }, [consent]);

  const value = {
    consent,
    showBanner: isLoaded && showBanner,
    updateConsent,
    acceptAll,
    rejectAll,
    openBanner,
    hasConsent,
    isLoaded,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}