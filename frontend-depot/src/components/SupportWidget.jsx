import React, { useState, useEffect, useRef } from 'react';
import { LifeBuoy, Send, X, MessageSquare, AlertCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

const TICKET_TYPES = [
  { value: 'BUG', label: 'Bug', icon: AlertCircle, color: 'text-red-400' },
  { value: 'SUGGESTION', label: 'Suggestion', icon: MessageSquare, color: 'text-indigo-400' },
  { value: 'MESSAGE', label: 'Message', icon: LifeBuoy, color: 'text-emerald-400' },
];

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('MESSAGE');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const reset = () => {
    setType('MESSAGE');
    setMessage('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/support/messages', {
        message: trimmed,
        type,
        pageUrl: window.location.pathname + window.location.search,
        userAgent: navigator.userAgent,
      });
      setSuccess(true);
      setMessage('');
      setTimeout(() => setOpen(false), 1400);
      setTimeout(reset, 1600);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Impossible d\'envoyer le message. Réessayez.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Balle flottante (à gauche du chatbot pour éviter le chevauchement) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Support & Aide"
        title="Support & Aide"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '90px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.55)',
          zIndex: 999,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        {open ? <X size={24} /> : <LifeBuoy size={24} />}
      </button>

      {/* Drawer / Tiroir */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '18px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
            zIndex: 999,
            overflow: 'hidden',
            animation: 'supportFadeIn 0.22s ease',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LifeBuoy size={18} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '14px', lineHeight: 1.2 }}>
                  Support & Aide
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>
                  Réponse rapide de l'équipe GesTock
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle2 size={40} color="#4ade80" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: '#fff', fontWeight: 700 }}>Message envoyé !</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                  Notre équipe a bien reçu votre demande.
                </div>
              </div>
            ) : (
              <>
                {/* Choix du type */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                  {TICKET_TYPES.map((t) => {
                    const isActive = type === t.value;
                    const IconComponent = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '10px 4px',
                          borderRadius: '12px',
                          border: '1px solid #334155',
                          background: isActive ? undefined : '#1e293b',
                          backgroundImage: isActive ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : undefined,
                          borderColor: isActive ? 'transparent' : '#334155',
                          color: isActive ? '#fff' : '#94a3b8',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        <IconComponent size={16} />
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Zone de message */}
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème, suggestion ou message..."
                  rows={4}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    padding: '12px',
                    fontSize: '13px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />

                {error && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '8px 10px' }}>
                    {error}
                  </div>
                )}

                {/* Footer actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      background: '#1e293b',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: message.trim() && !sending ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#334155',
                      color: '#fff',
                      cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      fontWeight: 800,
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {sending ? (
                      <>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'supportSpin 0.7s linear infinite' }} />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>

                {/* Indication page courante */}
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#64748b' }}>
                  <ChevronDown size={12} />
                  Page actuelle : {window.location.pathname}
                </div>
              </>
            )}
          </form>
        </div>
      )}

      <style>{`
        @keyframes supportFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes supportSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}