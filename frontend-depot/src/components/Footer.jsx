import { Mail, Phone, Share2, MessageCircle, Globe, Link2, Lock, Server, CheckCircle, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo-neon.png';

export default function Footer() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/depot-boissons';

  return (
    <footer className="gestock-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Colonne 1: Marque */}
          <div className="footer-col footer-brand">
            <div className="brand-section">
              <img src={logo} alt="GESTOCK" className="footer-logo" />
              <p className="footer-slogan">
                La solution de gestion pensée pour l'Afrique
              </p>
            </div>
            
            <div className="contact-info">
              <a href="mailto:gestocksaas237@gmail.com" className="contact-link">
                <Mail size={18} />
                <span>gestocksaas237@gmail.com</span>
              </a>
              <a href="https://wa.me/237656929905" target="_blank" rel="noopener noreferrer" className="contact-link">
                <Phone size={18} />
                <span>+237 656929905</span>
              </a>
            </div>

            <div className="social-links">
              <a 
                href="#" 
                className="social-link disabled" 
                title="Bientôt disponible"
                onClick={(e) => e.preventDefault()}
              >
                <Share2 size={20} />
              </a>
              <a href="#" className="social-link" title="Twitter/X">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="social-link" title="Instagram">
                <Globe size={20} />
              </a>
              <a href="#" className="social-link" title="LinkedIn">
                <Link2 size={20} />
              </a>
            </div>
          </div>

          {/* Colonne 2: Produit */}
          <div className="footer-col">
            <h3>Produit</h3>
            <nav>
              <ul>
                <li>
                  <Link to="/features">Fonctionnalités</Link>
                </li>
                <li>
                  <Link to="/pricing">Tarifs</Link>
                </li>
                <li>
                  <Link to="/changelog">Mises à jour</Link>
                </li>
                <li>
                  <Link to="/login">Connexion</Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Colonne 3: Métiers */}
          <div className="footer-col">
            <h3>Métiers</h3>
            <nav>
              <ul>
                <li>
                  <Link to="/depot-boissons">Dépôt de boissons</Link>
                </li>
                <li>
                  <a href="#">Supermarché</a>
                </li>
                <li>
                  <a href="#">Boutiques</a>
                </li>
                <li>
                  <a href="#">Pharmacies & Quincailleries</a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Colonne 4: Support */}
          <div className="footer-col">
            <h3>Support</h3>
            <nav>
              <ul>
                <li>
                  <Link to="/faq">Centre d'aide / FAQ</Link>
                </li>
                <li>
                  <Link to="/blog">Blog</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
                <li className="system-status">
                  <span className="status-indicator">
                    <CheckCircle size={16} className="status-icon" />
                    <span>Statut du système</span>
                  </span>
                  <span className="status-badge">Opérationnel</span>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Barre inférieure */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2026 GESTOCK. Tous droits réservés.
            </p>
            
            <div className="legal-links">
              <Link to="/legal-notice">Mentions Légales</Link>
              <Link to="/privacy-policy">Politique de confidentialité</Link>
              <Link to="/terms">CGV/CGU</Link>
            </div>

            <div className="footer-badges">
              <div className="badge">
                <Server size={14} />
                <span>Multi-tenant</span>
              </div>
              <div className="badge">
                <Lock size={14} />
                <span>Sécurisé</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .gestock-footer {
          background: #0a0a0f;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
          padding: 4rem 0 2rem;
          color: #94a3b8;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
        }

        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
        }

        .footer-col h3 {
          color: #f8fafc;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          letter-spacing: -0.01em;
        }

        .footer-col nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .footer-col nav ul li a {
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s ease;
          font-size: 0.9375rem;
        }

        .footer-col nav ul li a:hover {
          color: #a5b4fc;
        }

        /* Brand Section */
        .brand-section {
          margin-bottom: 1.5rem;
        }

        .footer-logo {
          height: 40px;
          width: auto;
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.2));
        }

        .footer-slogan {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: #64748b;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .contact-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s ease;
          font-size: 0.9375rem;
        }

        .contact-link:hover {
          color: #a5b4fc;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.1);
          color: #94a3b8;
          transition: all 0.2s ease;
        }

        .social-link:hover:not(.disabled) {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
          color: #a5b4fc;
        }

        .social-link.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* System Status */
        .system-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-icon {
          color: #22c55e;
        }

        .status-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.625rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 100px;
          color: #22c55e;
          font-weight: 600;
        }

        /* Footer Bottom */
        .footer-bottom {
          padding-top: 2rem;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }

        .footer-bottom-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .copyright {
          font-size: 0.875rem;
          color: #64748b;
        }

        .legal-links {
          display: flex;
          gap: 2rem;
        }

        .legal-links a {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s ease;
        }

        .legal-links a:hover {
          color: #a5b4fc;
        }

        .footer-badges {
          display: flex;
          gap: 1rem;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #94a3b8;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .footer-bottom-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }

          .legal-links {
            flex-direction: column;
            gap: 0.75rem;
          }

          .footer-badges {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </footer>
  );
}
