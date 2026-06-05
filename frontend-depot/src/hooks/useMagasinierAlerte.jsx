import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

let socketInstance = null;

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
    if (!user || role !== 'MAGASINIER' || !tenantId) { // FIX #4: Déconnexion de la socket si l'utilisateur change ou n'est plus magasinier
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance.removeAllListeners();
        socketInstance = null;
      }
      return;
    }

    if (socketInstance?.connected) { // FIX #4: Si connecté, on rejoint la room du nouveau tenant
      socketInstance.emit('join_alerts', { tenantId, role });
    }

    if (!socketInstance) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      socketInstance = io(apiUrl);
    }

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
      if (socketInstance) {
        socketInstance.disconnect(); // FIX #4: Déconnexion de la socket au logout ou démontage
        socketInstance.removeAllListeners(); // FIX #4: Nettoyage des écouteurs pour éviter les fuites mémoire
        socketInstance = null; // FIX #4: Remise à null pour forcer la réinitialisation
      }
      stopBeep();
    };
  }, [user, tenantId, role, startBeep, stopBeep]);

  return { pendingSales, isPlaying, stopBeep, setPendingSales };
}
