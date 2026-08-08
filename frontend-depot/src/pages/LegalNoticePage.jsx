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
                <span className="info-value">Albert (Développeur & Fondateur)</span>
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
                <a href="https://wa.me/237656929905" target="_blank" rel="noopener noreferrer" className="info-link">
                  <Phone size={16} />
                  +237 656929905
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
          background: #0a0a0f;
          color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .legal-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 6rem 2rem 4rem;
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
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 20px;
          padding: 2.5rem;
          backdrop-filter: blur(30px);
        }

        .legal-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
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
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
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
