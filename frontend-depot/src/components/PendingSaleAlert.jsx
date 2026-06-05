import { useMagasinierAlerte } from '../hooks/useMagasinierAlerte';
import { VolumeX, AlertCircle } from 'lucide-react';

export default function PendingSaleAlert() {
  const { pendingSales, isPlaying, stopBeep } = useMagasinierAlerte();

  if (pendingSales.length === 0) return null;

  return (
    <div className="bg-orange-500 text-white px-4 py-3 shadow-lg flex items-center justify-between animate-pulse fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-3">
        <AlertCircle size={24} className="animate-bounce" />
        <div>
          <p className="font-bold">Nouvelle(s) vente(s) en attente !</p>
          <p className="text-sm opacity-90">
            {pendingSales.length} facture(s) nécessitent votre attention.{' '}
            <span className="font-mono bg-orange-600 px-1 rounded">
              Dernière: {pendingSales[pendingSales.length - 1]?.reference}
            </span>
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => {
            stopBeep();
            window.dispatchEvent(new CustomEvent('nav-change', { detail: 'livraisons' }));
          }}
          className="bg-white text-orange-600 px-4 py-2 rounded-md font-medium hover:bg-orange-50 transition-colors"
        >
          Voir les livraisons
        </button>
        {isPlaying && (
          <button
            onClick={stopBeep}
            className="p-2 bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
            title="Couper le son"
          >
            <VolumeX size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
