import { Mail, Phone, Building2, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function LegalNoticePage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">
          ← Retour à l'accueil
        </Link>

        <div className="legal-header">
          <Building2 size={48} className="header-icon" />
          <h1>Mentions Légales</h1>
          <p className="header-subtitle">Informations légales relatives au service GeStock</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Éditeur du Service</h2>
            <p>Le service GeStock est édité et exploité par :</p>
            
            <div className="info-card">
              <div className="info-item">
                <span className="info-label">Propriétaire / Représentant légal :</span>
                <span className="info-value">BAKON MABONG Albert Alain (Développeur & Fondateur)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Contact :</span>
                <a href="mailto:gestocksaas237@gmail.com" className="info-link">
                  <Mail size={16} />
                  gestocksaas237@gmail.com
                </a>
              </div>
              <div className="info-item">
                <span className="info-label">WhatsApp :</span>
                <a href="https://wa.me/237688002284" target="_blank" rel="noopener noreferrer" className="info-link">
                  <Phone size={16} />
                  +237 688002284
                </a>
              </div>
              <div className="info-item">
                <span className="info-label">Nature du service :</span>
                <span className="info-value">Solution logicielle SaaS de gestion de stock, d'inventaire et de facturation multi-tenant dédiée aux professionnels.</span>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>2. Hébergement</h2>
            <p>
              L'infrastructure technique, les bases de données et l'application GeStock sont hébergées par des fournisseurs de services cloud hautement sécurisés garantissant la disponibilité et l'intégrité des données (conformes aux normes de sécurité internationales en vigueur).
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Propriété Intellectuelle</h2>
            <p>
              L'ensemble de la structure, des éléments visuels, graphiques, textuels, du code source, des logos (notamment la marque GeStock) et des bases de données composant ce site et l'application est la propriété exclusive de son éditeur, sauf mention contraire. Toute reproduction, représentation, modification ou exploitation totale ou partielle est strictement interdite sans autorisation écrite préalable.
            </p>
          </section>
        </div>
      </div>

      <Footer />

      <style>{`
        .legal-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
          color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
        }

        .legal-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .legal-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 6rem 2rem 4rem;
          position: relative;
          z-index: 1;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.9375rem;
          margin-bottom: 2rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #a5b4fc;
        }

        .legal-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .header-icon {
          color: #6366f1;
          margin-bottom: 1.5rem;
        }

        .legal-header h1 {
          font-size: 3rem;
          font-weight: 900;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #f8fafc 0%, #c7d2fe 50%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          color: #94a3b8;
          font-size: 1.125rem;
        }

        .legal-content {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .legal-section {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 24px;
          padding: 2.5rem;
          backdrop-filter: blur(40px) saturate(180%);
          position: relative;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset,
            0 -20px 40px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .legal-section:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.08) inset,
            0 -25px 50px rgba(0, 0, 0, 0.25);
        }

        .legal-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), rgba(34, 211, 238, 0.3), transparent);
          border-radius: 24px 24px 0 0;
        }

        .legal-section::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%);
          border-radius: 24px;
          pointer-events: none;
        }

        .legal-section h2 {
          color: #f8fafc;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          letter-spacing: -0.01em;
        }

        .legal-section p {
          color: #94a3b8;
          line-height: 1.8;
          font-size: 1rem;
        }

        .info-card {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          backdrop-filter: blur(20px);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.03) inset;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          border-color: rgba(99, 102, 241, 0.3);
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .info-value {
          color: #f8fafc;
          font-size: 1rem;
        }

        .info-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #a5b4fc;
          text-decoration: none;
          font-size: 1rem;
          transition: color 0.2s ease;
        }

        .info-link:hover {
          color: #c7d2fe;
        }

        @media (max-width: 768px) {
          .legal-container {
            padding: 4rem 1.5rem 2rem;
          }

          .legal-header h1 {
            font-size: 2rem;
          }

          .legal-section {
            padding: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}
