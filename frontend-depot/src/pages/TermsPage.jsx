import { FileText, CheckCircle, AlertTriangle, CreditCard, User, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">
          ← Retour à l'accueil
        </Link>

        <div className="legal-header">
          <FileText size={48} className="header-icon" />
          <h1>Conditions Générales de Vente et d'Utilisation</h1>
          <p className="header-subtitle">CGV / CGU du service GeStock</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>Préambule</h2>
            <p>
              Les présentes Conditions Générales régissent l'accès, l'inscription et l'utilisation de la plateforme SaaS GeStock. Tout abonnement ou utilisation du service implique l'acceptation sans réserve des présentes conditions par l'utilisateur.
            </p>
          </section>

          <section className="legal-section">
            <h2>1. Objet du Service</h2>
            <p>
              GeStock est un logiciel de gestion de stock, d'inventaire et d'activités commerciales accessible en mode SaaS (Logiciel en tant qu'un Service). Il est spécifiquement pensé pour répondre aux réalités et aux défis des commerces et entreprises en Afrique.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Inscription et Compte Utilisateur</h2>
            <div className="terms-list">
              <div className="term-item">
                <CheckCircle size={20} className="term-icon" />
                <p>L'accès au service nécessite la création d'un compte professionnel. L'utilisateur s'engage à fournir des informations exactes et à les maintenir à jour.</p>
              </div>
              <div className="term-item">
                <User size={20} className="term-icon" />
                <p>L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et de toutes les actions effectuées depuis son compte.</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>3. Conditions Financières et Abonnements</h2>
            <div className="terms-list">
              <div className="term-item">
                <CreditCard size={20} className="term-icon" />
                <p>Les fonctionnalités de GeStock sont soumises à des formules d'abonnement (dont les tarifs et détails sont affichés sur la page dédiée /pricing).</p>
              </div>
              <div className="term-item">
                <AlertTriangle size={20} className="term-icon warning" />
                <p>Les paiements s'effectuent selon les modalités acceptées par la plateforme (paiements mobiles, cartes bancaires ou virements selon disponibilité locale). En cas de défaut de paiement, l'accès au service pourra être suspendu ou restreint.</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>4. Propriété et Utilisation des Données</h2>
            <div className="terms-list">
              <div className="term-item">
                <CheckCircle size={20} className="term-icon" />
                <p>L'utilisateur demeure l'unique propriétaire de l'ensemble des données commerciales, des catalogues et des informations qu'il saisit dans son espace de gestion GeStock.</p>
              </div>
              <div className="term-item">
                <CheckCircle size={20} className="term-icon" />
                <p>GeStock s'engage à ne revendre, céder ou exploiter commercialement les données propres à l'activité de ses clients.</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>5. Limitation de Responsabilité</h2>
            <div className="terms-list">
              <div className="term-item">
                <CheckCircle size={20} className="term-icon" />
                <p>GeStock s'engage à fournir ses meilleurs efforts pour assurer une disponibilité continue du service (24h/24 et 7j/7). Toutefois, la responsabilité de l'éditeur ne saurait être engagée en cas de force majeure, de pannes de réseau internet indépendantes de sa volonté ou d'interventions de maintenance planifiées.</p>
              </div>
              <div className="term-item">
                <AlertTriangle size={20} className="term-icon warning" />
                <p>L'utilisateur reste seul responsable de la justesse des données qu'il enregistre dans sa gestion de stock et de sa comptabilité.</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>6. Résiliation</h2>
            <div className="terms-list">
              <div className="term-item">
                <CheckCircle size={20} className="term-icon" />
                <p>L'utilisateur peut cesser d'utiliser le service et résilier son abonnement à tout moment.</p>
              </div>
              <div className="term-item">
                <Ban size={20} className="term-icon warning" />
                <p>En cas de non-respect des présentes CGV/CGU, GeStock se réserve le droit de suspendre ou de supprimer un compte utilisateur après notification.</p>
              </div>
            </div>
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

        .legal-section > p {
          color: #94a3b8;
          line-height: 1.8;
          font-size: 1rem;
        }

        .terms-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }

        .term-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.03) inset;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .term-item:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          border-color: rgba(99, 102, 241, 0.3);
        }

        .term-icon {
          color: #6366f1;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .term-icon.warning {
          color: #f59e0b;
        }

        .term-item p {
          color: #94a3b8;
          line-height: 1.7;
          font-size: 1rem;
          margin: 0;
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

          .term-item {
            flex-direction: column;
            gap: 0.75rem;
          }

          .term-icon {
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
}
