import { useEffect, useState } from 'react';
import { Database, WifiOff } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { pendingCount } = useOfflineSync();

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

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex items-center justify-between gap-3 rounded-2xl border border-orange-200/20 bg-gradient-to-r from-red-600/95 via-orange-600/95 to-amber-500/95 px-4 py-3 shadow-2xl backdrop-blur-md animate-[offlineBannerIn_220ms_ease-out]">
      <div className="flex items-center gap-3">
        <WifiOff className="h-5 w-5 shrink-0 text-white" />
        <div className="flex flex-col">
          <span className="mb-1 text-[10px] font-black uppercase leading-none tracking-widest text-white">
            Synchronisation interrompue
          </span>
          <span className="text-xs font-medium text-white">
            Connexion perdue. Les actions restent enregistrées localement jusqu'au retour du réseau.
          </span>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1.5">
          <Database className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-black text-white">
            {pendingCount} item{pendingCount > 1 ? 's' : ''} en attente
          </span>
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
