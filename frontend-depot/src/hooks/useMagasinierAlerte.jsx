import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { acquireVenteSocket, releaseVenteSocket, destroyVenteSocket } from '../shared/realtime/venteSocket';

export function useMagasinierAlerte() {
  const { user, tenantId, role } = useAuth();
  const [pendingSales, setPendingSales] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPlayingRef = useRef(false);

  const initAudio = useCallback(() => {
    if (audioContextRef.current || typeof window === 'undefined') return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) {
      audioContextRef.current = new AudioContextCtor();
    }
  }, []);

  const playSingleBeep = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, context.currentTime);

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(context.destination);

    osc.start();
    osc.stop(context.currentTime + 0.5);
  }, []);

  const stopBeep = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startBeep = useCallback(() => {
    if (isPlayingRef.current) return;
    initAudio();

    const context = audioContextRef.current;
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume();
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    playSingleBeep();
    intervalRef.current = setInterval(playSingleBeep, 2000);
  }, [initAudio, playSingleBeep]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopBeep();
    };
  }, [stopBeep]);

  useEffect(() => {
    if (!user || role !== 'MAGASINIER' || !tenantId) { // FIX #4: Perte d'identité (logout, plus magasinier) → destruction totale de la socket partagée
      destroyVenteSocket();
      return undefined;
    }

    // Socket singleton partagée (VenteGateway) : on ne la déconnecte PAS au
    // démontage (StrictMode double-mount) — on retire seulement nos écouteurs.
    const socketInstance = acquireVenteSocket();

    const joinAlerts = () => {
      socketInstance?.emit('join_alerts', { tenantId, role });
    };

    const handleNouvelleVente = (vente) => {
      if (!isMountedRef.current) return;
      setPendingSales((prev) => {
        if (prev.find((v) => v.id === vente.id)) return prev;
        return [...prev, vente];
      });
      startBeep();
    };

    const handleVentePriseEnCharge = (data) => {
      if (!isMountedRef.current) return;
      setPendingSales((prev) => {
        const updated = prev.filter((v) => v.id !== data.venteId);
        if (updated.length === 0) {
          stopBeep();
        }
        return updated;
      });
    };

    if (socketInstance.connected) {
      joinAlerts();
    }
    socketInstance.on('connect', joinAlerts);
    socketInstance.on('nouvelle_vente', handleNouvelleVente);
    socketInstance.on('vente_prise_en_charge', handleVentePriseEnCharge);

    return () => {
      socketInstance.off('connect', joinAlerts);
      socketInstance.off('nouvelle_vente', handleNouvelleVente);
      socketInstance.off('vente_prise_en_charge', handleVentePriseEnCharge);
      releaseVenteSocket();
      stopBeep();
    };
  }, [user, tenantId, role, startBeep, stopBeep]);

  return { pendingSales, isPlaying, stopBeep, setPendingSales };
}
