import { X, Check, Settings, Shield, BarChart3, Megaphone, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useCookieConsent } from '../contexts/CookieConsentContext';

export default function CookieConsentBanner() {
  const { 
    showBanner, 
    consent, 
    acceptAll, 
    rejectAll, 
    updateConsent, 
    openBanner 
  } = useCookieConsent();

  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    setToggles({
      necessary: true,
      analytics: consent.analytics,
      marketing: consent.marketing,
      preferences: consent.preferences,
    });
  }, [consent]);

  const handleToggle = (category) => {
    if (category === 'necessary') return;
    setToggles(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 150));
    updateConsent({
      analytics: toggles.analytics,
      marketing: toggles.marketing,
      preferences: toggles.preferences,
    });
    setSaving(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div 
        className="cookie-overlay" 
        onClick={() => expanded && setExpanded(false)}
        aria-hidden={!expanded}
      />
      
      <div 
        className={`cookie-banner ${expanded ? 'expanded' : ''}`}
        role="dialog"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
        aria-modal="true"
      >
        {!expanded ? (
          <div className="cookie-compact">
            <div className="cookie-icon">
              <Shield size={20} />
            </div>
            <div className="cookie-text">
              <p id="cookie-title" className="cookie-title">Nous utilisons des cookies</p>
              <p id="cookie-desc" className="cookie-desc">
                En acceptant, vous permettez l'utilisation de cookies pour l'analyse, 
                la personnalisation et la publicité ciblée.
              </p>
            </div>
            <div className="cookie-actions">
              <button 
                className="cookie-btn cookie-btn-secondary"
                onClick={() => setExpanded(true)}
                type="button"
              >
                <Settings size={16} /> Personnaliser
              </button>
              <button 
                className="cookie-btn cookie-btn-primary"
                onClick={rejectAll}
                type="button"
              >
                Refuser
              </button>
              <button 
                className="cookie-btn cookie-btn-primary cookie-btn-accept"
                onClick={acceptAll}
                type="button"
              >
                Tout accepter
                <Check size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="cookie-expanded">
            <div className="cookie-header">
              <div className="cookie-icon">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="cookie-title">Gestion des cookies</h3>
                <p className="cookie-desc">
                  Choisissez les catégories de cookies que vous souhaitez autoriser. 
                  Les cookies nécessaires ne peuvent pas être désactivés.
                </p>
              </div>
              <button 
                className="cookie-close"
                onClick={() => setExpanded(false)}
                aria-label="Fermer"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="cookie-categories">
              <CookieCategory
                icon={Shield}
                name="Nécessaires"
                description="Indispensables au fonctionnement du site (authentification, sécurité, panier). Ne peuvent pas être désactivés."
                enabled={true}
                disabled
              />
              <CookieCategory
                icon={SlidersHorizontal}
                name="Préférences"
                description="Mémorisent vos choix (langue, région, thème) pour améliorer votre expérience."
                enabled={toggles.preferences}
                onChange={() => handleToggle('preferences')}
              />
              <CookieCategory
                icon={BarChart3}
                name="Analytiques"
                description="Nous aident à comprendre comment les visiteurs interagissent avec le site (pages visitées, temps passé). Données anonymisées."
                enabled={toggles.analytics}
                onChange={() => handleToggle('analytics')}
              />
              <CookieCategory
                icon={Megaphone}
                name="Marketing"
                description="Utilisés pour afficher des publicités pertinentes et mesurer l'efficacité des campagnes."
                enabled={toggles.marketing}
                onChange={() => handleToggle('marketing')}
              />
            </div>

            <div className="cookie-footer">
              <button 
                className="cookie-btn cookie-btn-secondary"
                onClick={rejectAll}
                type="button"
                disabled={saving}
              >
                Tout refuser
              </button>
              <button 
                className="cookie-btn cookie-btn-primary"
                onClick={handleSave}
                type="button"
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer mes choix'}
                <Check size={16} />
              </button>
            </div>

            <p className="cookie-policy-link">
              <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
                En savoir plus sur notre politique de cookies
              </a>
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .cookie-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 9998;
          animation: fadeIn 0.2s ease;
        }

        .cookie-banner {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          left: 1.5rem;
          max-width: 480px;
          margin: 0 auto;
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 20px;
          padding: 1.25rem;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          backdrop-filter: blur(20px) saturate(180%);
          z-index: 9999;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
        }

        @media (min-width: 640px) {
          .cookie-banner {
            bottom: 2rem;
            right: 2rem;
            left: auto;
            max-width: 420px;
            margin: 0;
          }
        }

        .cookie-banner.expanded {
          max-width: 520px;
          padding: 1.5rem;
        }

        .cookie-compact {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cookie-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
          color: #818cf8;
        }

        .cookie-text {
          flex: 1;
        }

        .cookie-title {
          margin: 0 0 0.375rem;
          font-size: 0.9375rem;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.3;
        }

        .cookie-desc {
          margin: 0;
          font-size: 0.8125rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .cookie-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .cookie-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          white-space: nowrap;
        }

        .cookie-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cookie-btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .cookie-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          transform: translateY(-1px);
        }

        .cookie-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cookie-btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .cookie-btn-accept {
          flex: 1;
        }

        .cookie-expanded {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .cookie-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .cookie-header .cookie-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 14px;
        }

        .cookie-header .cookie-title {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .cookie-header .cookie-desc {
          font-size: 0.875rem;
        }

        .cookie-close {
          margin-left: auto;
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cookie-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        .cookie-categories {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cookie-footer {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(148, 163, 184, 0.15);
        }

        .cookie-footer .cookie-btn {
          flex: 1;
        }

        .cookie-policy-link {
          margin: 0;
          text-align: center;
          font-size: 0.75rem;
        }

        .cookie-policy-link a {
          color: #818cf8;
          text-decoration: none;
        }

        .cookie-policy-link a:hover {
          text-decoration: underline;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cookie-banner, .cookie-overlay {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

function CookieCategory({ icon: Icon, name, description, enabled, onChange, disabled }) {
  return (
    <div className="cookie-category">
      <div className="cookie-category-info">
        <div className="cookie-category-icon">
          <Icon size={20} />
        </div>
        <div>
          <h4 className="cookie-category-name">{name}</h4>
          <p className="cookie-category-desc">{description}</p>
        </div>
      </div>
      <label className={`cookie-toggle ${enabled ? 'on' : ''} ${disabled ? 'disabled' : ''}`}>
        <input 
          type="checkbox" 
          checked={enabled} 
          onChange={onChange}
          disabled={disabled}
          aria-label={name}
        />
        <span className="cookie-toggle-slider">
          <span className="cookie-toggle-thumb" />
        </span>
      </label>

      <style jsx>{`
        .cookie-category {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 14px;
        }

        .cookie-category-info {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .cookie-category-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
        }

        .cookie-category-name {
          margin: 0 0 0.25rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #f8fafc;
        }

        .cookie-category-desc {
          margin: 0;
          font-size: 0.8125rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .cookie-toggle {
          position: relative;
          flex-shrink: 0;
          width: 48px;
          height: 28px;
        }

        .cookie-toggle input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .cookie-toggle-slider {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          transition: all 0.2s ease;
        }

        .cookie-toggle-slider::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: #94a3b8;
          border-radius: 50%;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .cookie-toggle.on .cookie-toggle-slider {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
        }

        .cookie-toggle.on .cookie-toggle-slider::before {
          left: 24px;
          background: white;
        }

        .cookie-toggle.disabled .cookie-toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cookie-toggle.disabled .cookie-toggle-slider::before {
          background: #64748b;
        }

        @media (max-width: 480px) {
          .cookie-category {
            flex-direction: column;
            align-items: stretch;
          }
          .cookie-toggle {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}