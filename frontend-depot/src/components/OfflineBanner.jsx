import { useEffect, useState } from 'react';
import { Database, RefreshCw, WifiOff } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { pendingCount, failedCount, retryFailed, isSyncing } = useOfflineSync();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const hasOfflineWork = pendingCount > 0 || failedCount > 0;

  if (isOnline && failedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200/20 bg-gradient-to-r from-red-600/95 via-orange-600/95 to-amber-500/95 px-4 py-3 shadow-2xl backdrop-blur-md animate-[offlineBannerIn_220ms_ease-out]">
      <div className="flex min-w-0 items-center gap-3">
        <WifiOff className="h-5 w-5 shrink-0 text-white" />
        <div className="flex min-w-0 flex-col">
          <span className="mb-1 text-[10px] font-black uppercase leading-none tracking-widest text-white">
            {isOnline ? 'Synchronisation à vérifier' : 'Synchronisation interrompue'}
          </span>
          <span className="text-xs font-medium text-white">
            {isOnline
              ? 'Certaines actions n’ont pas pu être synchronisées automatiquement.'
              : 'Connexion perdue. Les actions restent enregistrées localement jusqu’au retour du réseau.'}
          </span>
        </div>
      </div>

      {hasOfflineWork && (
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1.5">
              <Database className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-black text-white">
                {pendingCount} en attente
              </span>
            </div>
          )}

          {failedCount > 0 && (
            <button
              type="button"
              onClick={() => void retryFailed()}
              disabled={!isOnline || isSyncing}
              className="flex min-h-10 items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-black text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Réessayer les actions hors ligne en échec"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Réessayer ({failedCount})
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes offlineBannerIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
