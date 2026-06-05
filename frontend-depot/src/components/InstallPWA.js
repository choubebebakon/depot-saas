import React, { useEffect, useState } from 'react';

function isStandaloneMode() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (!isStandaloneMode()) {
        setInstallPrompt(event);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installerApplication = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  if (isInstalled || !installPrompt) return null;

  return React.createElement(
    'button',
    {
      type: 'button',
      onClick: installerApplication,
      className:
        'fixed bottom-4 right-4 z-[90] rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-xl shadow-indigo-900/40 transition hover:bg-indigo-500',
    },
    "Installer l'application Gestock"
  );
}
