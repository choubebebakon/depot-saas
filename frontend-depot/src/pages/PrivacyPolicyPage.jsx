import { Shield, Lock, Database, UserCheck, Mail, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">
          ← Retour à l'accueil
        </Link>

        <div className="legal-header">
          <Shield size={48} className="header-icon" />
          <h1>Politique de Confidentialité</h1>
          <p className="header-subtitle">Comment GeStock protège et traite vos données personnelles</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>Introduction</h2>
            <p>
              La présente Politique de Confidentialité décrit la manière dont GeStock collecte, utilise, protège et traite les données à caractère personnel de ses utilisateurs dans le cadre de l'utilisation de sa plateforme SaaS.
            </p>
          </section>

          <section className="legal-section">
            <h2>1. Données collectées</h2>
            <p>Dans le cadre de l'utilisation de GeStock, nous sommes amenés à collecter les catégories de données suivantes :</p>
            
            <div className="data-categories">
              <div className="data-card">
                <UserCheck size={24} className="card-icon" />
                <h3>Données d'identification et de compte</h3>
                <p>Nom, prénom, adresse e-mail, numéro de téléphone, nom de l'entreprise ou du commerce.</p>
              </div>
              
              <div className="data-card">
                <Database size={24} className="card-icon" />
                <h3>Données professionnelles et opérationnelles</h3>
                <p>Catalogues produits, mouvements de stocks, données de vente, et informations relatives aux clients finaux de votre propre commerce saisies dans le logiciel.</p>
              </div>
              
              <div className="data-card">
                <Lock size={24} className="card-icon" />
                <h3>Données techniques</h3>
                <p>Adresse IP, journaux de connexion (logs), données de navigation à des fins de sécurité et de diagnostic technique.</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>2. Finalité du traitement des données</h2>
            <p>Vos données sont collectées pour des objectifs précis et légitimes :</p>
            
            <ul className="purpose-list">
              <li>Fournir, exploiter et maintenir le service SaaS GeStock.</li>
              <li>Assurer la gestion des abonnements et l'authentification sécurisée des utilisateurs (architecture multi-tenant isolée).</li>
              <li>Améliorer l'expérience utilisateur, optimiser les performances de l'application et proposer un support technique réactif.</li>
              <li>Assurer la sécurité de la plateforme contre les accès non autorisés et la fraude.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Sécurité des données</h2>
            <p>
              GeStock met en œuvre des mesures de sécurité techniques et organisationnelles rigoureuses (chiffrement des flux de données, cloisonnement strict des données entre les différentes entreprises clientes (multi-tenant), mots de passe hachés) afin de protéger vos informations contre toute perte, altération ou divulgation non autorisée.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Vos droits</h2>
            <p>
              Conformément aux principes de protection des données, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles. Pour exercer ces droits, vous pouvez nous contacter directement à l'adresse e-mail :
            </p>
            
            <div className="contact-box">
              <a href="mailto:gestocksaas237@gmail.com" className="contact-link-large">
                <Mail size={20} />
                gestocksaas237@gmail.com
              </a>
            </div>
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
          position: relative;
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

        .data-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .data-card {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .card-icon {
          color: #6366f1;
        }

        .data-card h3 {
          color: #f8fafc;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        .data-card p {
          color: #94a3b8;
          font-size: 0.9375rem;
          line-height: 1.6;
          margin: 0;
        }

        .purpose-list {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .purpose-list li {
          color: #94a3b8;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.7;
        }

        .purpose-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #6366f1;
          font-weight: bold;
        }

        .contact-box {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          display: flex;
          justify-content: center;
        }

        .contact-link-large {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: #a5b4fc;
          text-decoration: none;
          font-size: 1.125rem;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .contact-link-large:hover {
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

          .data-categories {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
