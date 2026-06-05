import { useState, useRef, useEffect } from 'react';
import { getAuthToken } from '../../utils/auth'; // FIX #2: Utilisation du helper getAuthToken pour centraliser l'accès aux tokens

const METIER_CONFIG = {
  DEPOT_BOISSONS:   { couleur: '#2563eb', icon: '\u{1F4E6}', nom: 'Assistant Dépôt' },
  BOUTIQUE:         { couleur: '#0891b2', icon: '\u{1F3EA}', nom: 'Assistant Boutique' },
  PHARMACIE:        { couleur: '#059669', icon: '\u{1F48A}', nom: 'Assistant Pharmacie' },
  RESTAURANT:       { couleur: '#dc2626', icon: '\u{1F37D}', nom: 'Assistant Restaurant' },
  HOTEL:            { couleur: '#7c3aed', icon: '\u{1F3E8}', nom: 'Assistant Hôtel' },
  QUINCAILLERIE:    { couleur: '#b45309', icon: '\u{1F6E0}', nom: 'Assistant Quinc.' },
  SUPERMARCHE:      { couleur: '#0284c7', icon: '\u{1F6D2}', nom: 'Assistant Supermarché' },
  GARAGE_AUTOMOBILE:{ couleur: '#374151', icon: '\u{1F527}', nom: 'Assistant Garage' },
  CLINIQUE:         { couleur: '#0e7490', icon: '\u{1F3E5}', nom: 'Assistant Clinique' },
  TRANSPORT:        { couleur: '#92400e', icon: '\u{1F69A}', nom: 'Assistant Transport' },
  IMMOBILIER:       { couleur: '#1e40af', icon: '\u{1F3E2}', nom: 'Assistant Immo' },
  ELEVAGE:          { couleur: '#65a30d', icon: '\u{1F413}', nom: 'Assistant Élevage' },
  BOULANGERIE:      { couleur: '#d97706', icon: '\u{1F35E}', nom: 'Assistant Boulangerie' },
  PRESSING:         { couleur: '#7e22ce', icon: '\u{1F454}', nom: 'Assistant Pressing' },
  SALON_BEAUTE:     { couleur: '#db2777', icon: '\u{1F487}', nom: 'Assistant Salon' },
  PARFUMERIE:       { couleur: '#9333ea', icon: '\u{1F9F4}', nom: 'Assistant Parfumerie' },
  LIBRAIRIE:        { couleur: '#1d4ed8', icon: '\u{1F4DA}', nom: 'Assistant Librairie' },
  GLACIER_SNACK:    { couleur: '#06b6d4', icon: '\u{1F366}', nom: 'Assistant Glacier' },
  CIMENT_BTP:       { couleur: '#78716c', icon: '\u{1F9F1}', nom: 'Assistant BTP' },
};

const DEFAULT_CONFIG = { couleur: '#2563eb', icon: '\u{1F916}', nom: 'GeStock Assistant' };

export default function GeStockChatbot({ metier = 'DEPOT_BOISSONS', tenantNom = '' }) {
  const config = METIER_CONFIG[metier] ?? DEFAULT_CONFIG;

  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      texte: `Bonjour ! Je suis votre assistant GeStock ${config.icon}\n\nJe peux vous aider avec :\n\u2022 Vos ventes et statistiques\n\u2022 Votre stock et alertes\n\u2022 Vos clients et fournisseurs\n\u2022 Et plus encore...\n\nQue voulez-vous savoir ?`,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]);
    fetchSuggestions();
  }, [metier]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchSuggestions() {
    try {
      const token = getAuthToken(); // FIX #2: Remplacement de access_token par getAuthToken()
      const res = await fetch('/api/v1/chatbot/suggestions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      }
    } catch {
      setSuggestions(['Ventes du jour ?', 'Stock en rupture ?', 'Bilan du mois ?']);
    }
  }

  async function envoyerMessage(texte) {
    const messageTexte = texte || input.trim();
    if (!messageTexte || loading) return;

    setInput('');
    setSuggestions([]);

    const msgUser = {
      id: Date.now(),
      role: 'user',
      texte: messageTexte,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msgUser]);
    setLoading(true);

    try {
      const token = getAuthToken(); // FIX #2: Remplacement de access_token par getAuthToken()
      const res = await fetch('/api/v1/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageTexte }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        texte: data.reponse ?? "Désolé, je n'ai pas pu répondre.",
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]);

      if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
      }

    } catch (err) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        texte: '\u26A0\uFE0F Service temporairement indisponible. Réessayez dans un moment.',
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        erreur: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyerMessage();
    }
  }

  return (
    <>
      <button
        onClick={() => setOuvert(!ouvert)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: config.couleur,
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          boxShadow: `0 4px 20px ${config.couleur}60`,
          zIndex: 1000,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={config.nom}
      >
        {ouvert ? '\u2715' : config.icon}
      </button>

      {ouvert && (
        <div style={styles.chatWindow}>
          <div style={{ ...styles.header, background: config.couleur }}>
            <div style={styles.headerLeft}>
              <span style={styles.headerIcon}>{config.icon}</span>
              <div>
                <div style={styles.headerTitle}>{config.nom}</div>
                <div style={styles.headerSub}>{tenantNom}</div>
              </div>
            </div>
            <div style={styles.headerDot} title="En ligne" />
          </div>

          <div style={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.msgWrapper,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ ...styles.avatar, background: config.couleur + '20' }}>
                    {config.icon}
                  </div>
                )}
                <div
                  style={{
                    ...styles.bubble,
                    ...(msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant),
                    background: msg.role === 'user' ? config.couleur : '#1e293b',
                    borderColor: msg.erreur ? '#ef4444' : undefined,
                  }}
                >
                  <p style={styles.bubbleText}>{msg.texte}</p>
                  <span style={styles.bubbleHeure}>{msg.heure}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.msgWrapper, justifyContent: 'flex-start' }}>
                <div style={{ ...styles.avatar, background: config.couleur + '20' }}>
                  {config.icon}
                </div>
                <div style={{ ...styles.bubble, ...styles.bubbleAssistant }}>
                  <div style={styles.typing}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {suggestions.length > 0 && !loading && (
            <div style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => envoyerMessage(s)}
                  style={{ ...styles.suggBtn, borderColor: config.couleur + '40' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div style={styles.inputArea}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              disabled={loading}
              rows={1}
              style={styles.textarea}
            />
            <button
              onClick={() => envoyerMessage()}
              disabled={!input.trim() || loading}
              style={{
                ...styles.sendBtn,
                background: input.trim() && !loading ? config.couleur : '#334155',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              {'\u27A4'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}

const styles = {
  chatWindow: {
    position: 'fixed',
    bottom: '90px',
    right: '24px',
    width: '360px',
    height: '520px',
    background: '#0d1117',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 999,
    overflow: 'hidden',
    animation: 'fadeIn 0.2s ease',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  header: {
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: { fontSize: '22px' },
  headerTitle: { color: '#fff', fontWeight: 700, fontSize: '14px' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: '11px' },
  headerDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 6px #4ade80',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    scrollbarWidth: 'none',
  },
  msgWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid transparent',
  },
  bubbleUser: {
    borderBottomRightRadius: '4px',
    color: '#fff',
  },
  bubbleAssistant: {
    background: '#1e293b',
    borderBottomLeftRadius: '4px',
    color: '#e2e8f0',
  },
  bubbleText: {
    fontSize: '13px',
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  bubbleHeure: {
    fontSize: '10px',
    opacity: 0.5,
    display: 'block',
    marginTop: '4px',
    textAlign: 'right',
  },
  typing: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
  },
  suggestions: {
    padding: '8px 12px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    borderTop: '1px solid #1e293b',
    flexShrink: 0,
  },
  suggBtn: {
    fontSize: '11px',
    padding: '5px 10px',
    borderRadius: '20px',
    border: '1px solid',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '10px 12px',
    borderTop: '1px solid #1e293b',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#f1f5f9',
    padding: '10px 12px',
    fontSize: '13px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  sendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    flexShrink: 0,
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
