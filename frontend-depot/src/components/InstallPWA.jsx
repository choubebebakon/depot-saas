import React, { useEffect, useState, useCallback } from 'react';
import { Download, Smartphone, X, CheckCircle, Info } from 'lucide-react';

function isStandaloneMode() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function FloatingButton({ onInstall, handleCloseIOS, showIOSInstructions, isIOSDevice, canAutoInstall, className }) {
  if (!canAutoInstall && !isIOSDevice) return null;

  return (
    <>
      <button
        type="button"
        onClick={onInstall}
        className={`fixed bottom-5 right-5 z-[90] rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-base font-bold text-white shadow-2xl shadow-indigo-900/50 transition-all duration-300 hover:from-indigo-500 hover:to-blue-500 hover:scale-105 hover:shadow-indigo-900/60 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 active:scale-95 ${className}`}
        aria-label="Installer l'application GesTock"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Smartphone className="h-5 w-5 text-white" />
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
              <Download className="h-3 w-3 text-white" />
            </div>
          </div>
          <span className="hidden sm:block">Installer l'application</span>
        </div>
      </button>

      {isIOSDevice && (
        <button
          type="button"
          onClick={() => setShowIOSInstructions(true)}
          className="fixed bottom-5 left-5 z-[90] rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-orange-900/40 transition-all duration-300 hover:from-orange-400 hover:to-amber-400 hover:scale-105"
          aria-label="Comment installer sur iOS"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:block">Guide iOS</span>
          </div>
        </button>
      )}

      {showIOSInstructions && <IOSInstallGuide onClose={handleCloseIOS} />}
    </>
  );
}

function BannerPrompt({ onInstall, handleCloseIOS, showIOSInstructions, isIOSDevice, canAutoInstall, installPrompt, setInstallPrompt }) {
  if (!installPrompt && !isIOSDevice) return null;

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-[100] transform transition-all duration-500 ease-out ${installPrompt || isIOSDevice ? 'translate-y-0' : '-translate-y-full'}`}
        role="banner"
      >
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:rounded-none sm:shadow-2xl">
          <div className="relative flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 px-6 py-5 text-white shadow-2xl shadow-indigo-900/50 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Installez GesTock</h3>
                <p className="mt-1 text-indigo-100 text-sm">Accès instantané, mode hors-ligne, notifications push</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {canAutoInstall && (
                <button
                  type="button"
                  onClick={onInstall}
                  className="flex h-11 items-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-black text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <Download className="h-4 w-4" />
                  Installer
                </button>
              )}

              {isIOSDevice && (
                <button
                  type="button"
                  onClick={() => setShowIOSInstructions(true)}
                  className="flex h-11 items-center gap-2 rounded-xl bg-white/15 px-5 py-2 text-sm font-bold text-white backdrop-blur-sm border border-white/20 transition-all hover:bg-white/25"
                >
                  <Info className="h-4 w-4" />
                  Guide iOS
                </button>
              )}

              <button
                type="button"
                onClick={() => setInstallPrompt(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showIOSInstructions && <IOSInstallGuide onClose={handleCloseIOS} />}
    </>
  );
}

function InlinePrompt({ onInstall, handleCloseIOS, showIOSInstructions, isIOSDevice, canAutoInstall, className }) {
  if (!canAutoInstall && !isIOSDevice) return null;

  return (
    <div className={`relative rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white shadow-xl ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-black text-lg">Installer GesTock</h4>
            <p className="mt-1 text-indigo-100 text-sm">Accès rapide, hors-ligne, notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canAutoInstall && (
            <button
              type="button"
              onClick={onInstall}
              className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              <Download className="h-4 w-4" />
              Installer
            </button>
          )}
          {isIOSDevice && (
            <button
              type="button"
              onClick={() => setShowIOSInstructions(true)}
              className="flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur border border-white/20 transition hover:bg-white/25"
            >
              <Info className="h-4 w-4" />
              Guide iOS
            </button>
          )}
        </div>
      </div>
      {showIOSInstructions && <IOSInstallGuide onClose={handleCloseIOS} />}
    </div>
  );
}

export function InstallPWAButton({ className = '', variant = 'floating', onInstall }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode());
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (!isStandaloneMode()) {
        setInstallPrompt(event);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowIOSInstructions(false);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isClient, onInstall]);

  const handleInstall = useCallback(async () => {
    if (isIOS() || isSafari()) {
      setShowIOSInstructions(true);
      return;
    }
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  }, [installPrompt]);

  const handleCloseIOS = useCallback(() => {
    setShowIOSInstructions(false);
  }, []);

  if (!isClient || isInstalled) return null;

  const isIOSDevice = isIOS();
  const canAutoInstall = installPrompt && !isIOSDevice;

  if (variant === 'floating') {
    return <FloatingButton onInstall={handleInstall} handleCloseIOS={handleCloseIOS} showIOSInstructions={showIOSInstructions} isIOSDevice={isIOSDevice} canAutoInstall={canAutoInstall} className={className} />;
  }

  if (variant === 'banner') {
    return <BannerPrompt onInstall={handleInstall} handleCloseIOS={handleCloseIOS} showIOSInstructions={showIOSInstructions} isIOSDevice={isIOSDevice} canAutoInstall={canAutoInstall} installPrompt={installPrompt} setInstallPrompt={setInstallPrompt} />;
  }

  if (variant === 'inline') {
    return <InlinePrompt onInstall={handleInstall} handleCloseIOS={handleCloseIOS} showIOSInstructions={showIOSInstructions} isIOSDevice={isIOSDevice} canAutoInstall={canAutoInstall} className={className} />;
  }

  return null;
}

function IOSInstallGuide({ onClose }) {
  const steps = [
    { text: 'Ouvrez cette page dans ', highlight: 'Safari' },
    { text: "Appuyez sur l'icône ", highlight: 'Partager', suffix: ' (carré avec flèche vers le haut)' },
    { text: 'Faites défiler vers le bas et choisissez ', highlight: '"Sur l\'écran d\'accueil"' },
    { text: 'Appuyez sur ', highlight: '"Ajouter"', suffix: ' en haut à droite' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="ios-guide-title">
      <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 id="ios-guide-title" className="text-lg font-black text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-400" />
            Installation sur iOS (Safari)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                <Info className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Sur iOS, l'installation se fait depuis Safari</p>
                <p className="mt-1 text-sm text-slate-300">Chrome, Firefox et autres navigateurs iOS ne supportent pas l'installation PWA.</p>
              </div>
            </div>
          </div>

          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-black text-white text-sm">{i + 1}</span>
                <div className="pt-1 text-sm text-slate-300">
                  <span>{step.text}<strong className="text-blue-400">{step.highlight}</strong>{step.suffix || ''}</span>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-xl bg-slate-800/50 p-4">
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              Une fois installée, l'app fonctionne comme une app native avec mode hors-ligne
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InstallPWA() {
  return <InstallPWAButton variant="floating" />;
}