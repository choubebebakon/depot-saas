import { Mail, Phone, Share2, MessageCircle, Globe, Link2, Lock, Server, CheckCircle, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo-neon.png';

export default function Footer() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/depot-boissons' || location.pathname === '/depot-boissons-landing' || location.pathname === '/supermarche-landing' || location.pathname === '/boutique-landing';

  return (
    <footer className="gestock-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Colonne 1: Marque */}
          <div className="footer-col footer-brand">
            <div className="brand-section">
              <img src={logo} alt="GESTOCK" className="footer-logo" />
              <p className="footer-slogan">
                Pilotez votre activité avec plus de clarté, de contrôle et de sérénité.
              </p>
              <div className="footer-brand-promise">
                <span className="promise-dot" />
                <span>Une gestion plus simple. Des décisions plus rapides.</span>
              </div>
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
                href="https://www.facebook.com/share/1BinAQxPbM/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link" 
                title="Facebook"
              >
                <Share2 size={20} />
              </a>
              <a 
                href="https://discord.gg/GvfSRKuRUp" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link" 
                title="Discord"
              >
                <MessageCircle size={20} />
              </a>
              <a 
                href="#" 
                className="social-link disabled" 
                title="Bientôt disponible"
                onClick={(e) => e.preventDefault()}
              >
                <Globe size={20} />
              </a>
              <a 
                href="#" 
                className="social-link disabled" 
                title="Bientôt disponible"
                onClick={(e) => e.preventDefault()}
              >
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
                  <Link to="/depot-boissons-landing">
                    Dépôt de boissons
                    <span className="active-badge">Actif</span>
                  </Link>
                </li>
                <li>
                  <Link to="/supermarche-landing">
                    Supermarché
                    <span className="active-badge">Actif</span>
                  </Link>
                </li>
                <li>
                  <Link to="/boutique-landing">
                    Boutiques
                    <span className="active-badge">Actif</span>
                  </Link>
                </li>
                <li>
                  <Link to="/metier/pharmacie">Pharmacie</Link>
                </li>
                <li>
                  <Link to="/metier/quincaillerie">Quincaillerie</Link>
                </li>
                <li>
                  <Link to="/metier/restaurant">Restaurant</Link>
                </li>
                <li>
                  <Link to="/metier/hotel">Hôtel</Link>
                </li>
                <li>
                  <Link to="/metier/ciment-btp">Ciment / BTP</Link>
                </li>
                <li>
                  <Link to="/metier/pressing">Pressing</Link>
                </li>
                <li>
                  <Link to="/metier/garage-automobile">Garage Automobile</Link>
                </li>
                <li>
                  <Link to="/metier/elevage">Élevage</Link>
                </li>
                <li>
                  <Link to="/metier/agriculture">Agriculture</Link>
                </li>
                <li>
                  <Link to="/metier/boulangerie-patisserie">Boulangerie / Pâtisserie</Link>
                </li>
                <li>
                  <Link to="/metier/clinique">Clinique</Link>
                </li>
                <li>
                  <Link to="/metier/transport-logistique">Transport / Logistique</Link>
                </li>
                <li>
                  <Link to="/metier/gestion-immobiliere">Gestion Immobilière</Link>
                </li>
                <li>
                  <Link to="/metier/ressources-humaines">Ressources Humaines</Link>
                </li>
                <li>
                  <Link to="/metier/tontine">Tontine</Link>
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
          --footer-bg: #040814;
          --footer-surface: rgba(12, 23, 46, 0.58);
          --footer-surface-strong: rgba(17, 31, 61, 0.72);
          --footer-line: rgba(174, 205, 255, 0.13);
          --footer-line-bright: rgba(165, 190, 255, 0.23);
          --footer-text: #f4f7ff;
          --footer-muted: #8c9ab5;
          --footer-soft: #64738f;
          --footer-blue: #65a9ff;
          --footer-purple: #8b72ff;
          position: relative;
          isolation: isolate;
          overflow: hidden;
          padding: 5.5rem 0 1.5rem;
          color: var(--footer-muted);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
          background:
            radial-gradient(circle at 8% 12%, rgba(67, 126, 255, 0.16), transparent 30%),
            radial-gradient(circle at 88% 18%, rgba(132, 86, 255, 0.14), transparent 28%),
            radial-gradient(circle at 50% 100%, rgba(42, 111, 210, 0.09), transparent 36%),
            var(--footer-bg);
          border-top: 1px solid rgba(145, 181, 255, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.055),
            0 -30px 90px rgba(20, 65, 145, 0.08);
        }

        .gestock-footer::before,
        .gestock-footer::after {
          content: "";
          position: absolute;
          pointer-events: none;
          z-index: -1;
          border-radius: 999px;
          filter: blur(12px);
          animation: footerFloat 9s ease-in-out infinite alternate;
        }

        .gestock-footer::before {
          width: 260px;
          height: 260px;
          left: -150px;
          top: 80px;
          background: rgba(54, 128, 255, 0.13);
        }

        .gestock-footer::after {
          width: 300px;
          height: 300px;
          right: -180px;
          bottom: 20px;
          background: rgba(126, 82, 255, 0.11);
          animation-delay: -4s;
        }

        .footer-container {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .footer-container::before {
          content: "";
          position: absolute;
          left: 2rem;
          right: 2rem;
          top: -1.5rem;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(112, 169, 255, 0.3),
            rgba(153, 113, 255, 0.3),
            transparent
          );
          opacity: 0.8;
        }

        .footer-grid {
          position: relative;
          display: grid;
          grid-template-columns: 1.45fr 0.85fr 0.95fr 0.95fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .footer-col {
          position: relative;
          min-width: 0;
          padding: 1.55rem;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--footer-line);
          border-radius: 28px;
          background:
            linear-gradient(145deg, rgba(58, 91, 147, 0.16), rgba(8, 17, 35, 0.42));
          backdrop-filter: blur(24px) saturate(145%);
          -webkit-backdrop-filter: blur(24px) saturate(145%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.09),
            inset 0 -1px 0 rgba(255, 255, 255, 0.025),
            0 18px 55px rgba(0, 0, 0, 0.18);
          transition:
            transform 0.45s cubic-bezier(.2,.8,.2,1),
            border-color 0.35s ease,
            box-shadow 0.35s ease;
        }

        .footer-col::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: 27px;
          pointer-events: none;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.09),
            transparent 23%,
            transparent 72%,
            rgba(120, 155, 255, 0.035)
          );
        }

        .footer-col:hover {
          transform: translateY(-4px);
          border-color: var(--footer-line-bright);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.11),
            0 22px 65px rgba(0, 0, 0, 0.24),
            0 0 45px rgba(70, 125, 255, 0.07);
        }

        .footer-brand {
          justify-content: flex-start;
        }

        .brand-section {
          position: relative;
          margin-bottom: 1.25rem;
        }

        .footer-logo {
          display: block;
          height: 42px;
          width: auto;
          max-width: 190px;
          object-fit: contain;
          margin-bottom: 1.15rem;
          filter:
            drop-shadow(0 0 10px rgba(76, 139, 255, 0.3))
            drop-shadow(0 0 24px rgba(119, 88, 255, 0.14));
          transition: filter 0.35s ease, transform 0.35s ease;
        }

        .footer-logo:hover {
          transform: translateY(-1px) scale(1.015);
          filter:
            drop-shadow(0 0 12px rgba(76, 160, 255, 0.42))
            drop-shadow(0 0 30px rgba(119, 88, 255, 0.2));
        }

        .footer-slogan {
          max-width: 360px;
          margin: 0;
          color: #b1bdd1;
          font-size: 0.96rem;
          line-height: 1.7;
          letter-spacing: -0.01em;
        }

        .footer-brand-promise {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          margin-top: 1rem;
          padding: 0.52rem 0.72rem;
          border: 1px solid rgba(117, 165, 255, 0.14);
          border-radius: 999px;
          background: rgba(58, 102, 180, 0.09);
          color: #91a8ca;
          font-size: 0.73rem;
          line-height: 1.25;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
        }

        .promise-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 50%;
          background: #65d9a0;
          box-shadow:
            0 0 0 4px rgba(101, 217, 160, 0.08),
            0 0 14px rgba(101, 217, 160, 0.45);
          animation: promisePulse 2.5s ease-in-out infinite;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-bottom: 1.3rem;
        }

        .contact-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.72rem;
          width: fit-content;
          max-width: 100%;
          padding: 0.45rem 0.65rem;
          margin-left: -0.65rem;
          border-radius: 12px;
          color: #96a5bf;
          text-decoration: none;
          transition:
            color 0.25s ease,
            background 0.25s ease,
            transform 0.25s ease;
        }

        .contact-link svg {
          color: #76a9ff;
          filter: drop-shadow(0 0 8px rgba(76, 145, 255, 0.32));
        }

        .contact-link:hover {
          color: #edf3ff;
          background: rgba(91, 132, 210, 0.08);
          transform: translateX(3px);
        }

        .social-links {
          display: flex;
          gap: 0.65rem;
          margin-top: auto;
        }

        .social-link {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          border-radius: 15px;
          color: #93a4c0;
          text-decoration: none;
          background:
            linear-gradient(145deg, rgba(83, 119, 182, 0.16), rgba(18, 31, 59, 0.48));
          border: 1px solid rgba(170, 201, 255, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 8px 20px rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition:
            transform 0.3s cubic-bezier(.2,.8,.2,1),
            color 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.3s ease;
        }

        .social-link:hover:not(.disabled) {
          transform: translateY(-4px);
          color: #f4f7ff;
          border-color: rgba(113, 167, 255, 0.42);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 10px 28px rgba(34, 75, 150, 0.2),
            0 0 22px rgba(85, 135, 255, 0.12);
        }

        .social-link.disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .footer-col h3 {
          position: relative;
          margin: 0 0 1.25rem;
          color: #f5f7ff;
          font-size: 0.78rem;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.13em;
        }

        .footer-col h3::after {
          content: "";
          display: block;
          width: 25px;
          height: 2px;
          margin-top: 0.65rem;
          border-radius: 99px;
          background: linear-gradient(90deg, #65a9ff, #8b72ff);
          box-shadow: 0 0 12px rgba(103, 137, 255, 0.4);
        }

        .footer-col nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .footer-col nav ul li {
          margin: 0;
        }

        .footer-col nav ul li a {
          position: relative;
          display: inline-flex;
          align-items: center;
          min-height: 35px;
          padding: 0.35rem 0.55rem;
          margin-left: -0.55rem;
          border-radius: 10px;
          color: #8c9ab5;
          text-decoration: none;
          font-size: 0.9rem;
          transition:
            color 0.25s ease,
            background 0.25s ease,
            transform 0.25s ease;
        }

        .footer-col nav ul li a::before {
          content: "";
          width: 0;
          height: 1px;
          margin-right: 0;
          border-radius: 99px;
          background: linear-gradient(90deg, #65a9ff, #8b72ff);
          box-shadow: 0 0 10px rgba(100, 151, 255, 0.45);
          transition: width 0.25s ease, margin-right 0.25s ease;
        }

        .footer-col nav ul li a:hover {
          color: #edf3ff;
          background: rgba(92, 130, 203, 0.07);
          transform: translateX(3px);
        }

        .footer-col nav ul li a:hover::before {
          width: 9px;
          margin-right: 7px;
        }

        .system-status {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.6rem;
          margin-top: 0.65rem;
          padding: 0.75rem;
          border: 1px solid rgba(106, 155, 228, 0.12);
          border-radius: 15px;
          background: rgba(44, 73, 122, 0.07);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #a4b2c8;
          font-size: 0.82rem;
        }

        .status-icon {
          color: #5ee0a2;
          filter: drop-shadow(0 0 7px rgba(94, 224, 162, 0.45));
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          padding: 0.28rem 0.62rem;
          border: 1px solid rgba(77, 221, 153, 0.2);
          border-radius: 999px;
          color: #72e5ae;
          background: rgba(45, 195, 129, 0.08);
          font-size: 0.7rem;
          font-weight: 700;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 0 18px rgba(50, 207, 139, 0.05);
        }

        .footer-bottom {
          position: relative;
          padding: 1rem;
          border: 1px solid var(--footer-line);
          border-radius: 22px;
          background:
            linear-gradient(145deg, rgba(45, 71, 117, 0.13), rgba(8, 16, 32, 0.5));
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            0 15px 40px rgba(0, 0, 0, 0.14);
        }

        .footer-bottom::before {
          content: "";
          position: absolute;
          left: 15%;
          right: 15%;
          top: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(104, 164, 255, 0.22),
            rgba(139, 114, 255, 0.22),
            transparent
          );
        }

        .footer-bottom-content {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1rem;
        }

        .copyright {
          margin: 0;
          font-size: 0.78rem;
          color: #64738f;
        }

        .legal-links {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .legal-links a {
          padding: 0.35rem 0.55rem;
          border-radius: 9px;
          color: #7f8ea9;
          text-decoration: none;
          font-size: 0.76rem;
          transition:
            color 0.25s ease,
            background 0.25s ease;
        }

        .legal-links a:hover {
          color: #e8efff;
          background: rgba(95, 137, 215, 0.08);
        }

        .footer-badges {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
          padding: 0.42rem 0.65rem;
          border: 1px solid rgba(157, 190, 247, 0.12);
          border-radius: 999px;
          color: #7f90ab;
          background: rgba(55, 84, 135, 0.08);
          font-size: 0.69rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .badge svg {
          color: #79a9ff;
          filter: drop-shadow(0 0 6px rgba(91, 149, 255, 0.3));
        }

        .active-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.5rem;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(6, 182, 212, 0.15));
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 999px;
          color: #22d3ee;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-left: 0.5rem;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
        }

        .footer-col nav ul li a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        @keyframes footerFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(22px, -12px, 0) scale(1.08);
          }
        }

        @keyframes promisePulse {
          0%, 100% {
            opacity: 0.75;
            transform: scale(0.92);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        @media (max-width: 1100px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-brand {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .gestock-footer {
            padding: 4rem 0 1rem;
          }

          .footer-container {
            padding: 0 1rem;
          }

          .footer-container::before {
            left: 1rem;
            right: 1rem;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .footer-brand {
            grid-column: auto;
          }

          .footer-col {
            padding: 1.25rem;
            border-radius: 22px;
          }

          .footer-col::before {
            border-radius: 21px;
          }

          .footer-col h3 {
            margin-bottom: 1rem;
          }

          .footer-slogan {
            max-width: none;
          }

          .footer-bottom {
            padding: 1rem;
            border-radius: 20px;
          }

          .footer-bottom-content {
            grid-template-columns: 1fr;
            justify-items: start;
            gap: 0.8rem;
          }

          .legal-links {
            justify-content: flex-start;
          }

          .footer-badges {
            justify-content: flex-start;
          }
        }

        @media (max-width: 430px) {
          .footer-brand-promise {
            align-items: flex-start;
            border-radius: 16px;
          }

          .contact-link {
            font-size: 0.84rem;
          }

          .social-link {
            width: 41px;
            height: 41px;
            border-radius: 14px;
          }

          .legal-links {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.1rem;
          }

          .legal-links a {
            margin-left: -0.55rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gestock-footer::before,
          .gestock-footer::after,
          .promise-dot {
            animation: none;
          }

          .footer-col,
          .footer-logo,
          .contact-link,
          .social-link,
          .footer-col nav ul li a {
            transition: none;
          }
        }
      `}</style>
    </footer>
  );
}