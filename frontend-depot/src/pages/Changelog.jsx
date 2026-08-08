import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const changelogData = [
  {
    version: "v1.2.0",
    date: "Juillet 2026",
    title: "Refonte du Footer & Optimisation Multi-Métiers",
    items: [
      "Intégration de 9 nouveaux secteurs d'activité (Restaurant, Hôtel, Ciment BTP, etc.).",
      "Amélioration de la structure responsive et de l'accessibilité globale.",
      "Correction de bugs mineurs sur le système de routage."
    ]
  },
  {
    version: "v1.1.0",
    date: "Juin 2026",
    title: "Module de Sécurité Multi-Tenant Avancé",
    items: [
      "Isolation complète des bases de données par client.",
      "Mise en place du hachage de mots de passe renforcé.",
      "Optimisation des requêtes de stock en temps réel."
    ]
  },
  {
    version: "v1.0.0",
    date: "Mai 2026",
    title: "Lancement Officiel de GeStock 🚀",
    items: [
      "Sortie de la version initiale pensée pour l'Afrique.",
      "Gestion des stocks, des dépôts de boissons et des supermarchés.",
      "Connexion rapide via WhatsApp et e-mail intégrée."
    ]
  }
];

export default function Changelog() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        {/* En-tête */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
            <Sparkles size={16} /> Mises à jour produit
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Changelog GeStock</h1>
          <p className="text-slate-400 text-lg">
            Découvrez les dernières améliorations, correctifs et nouveautés déployés sur la plateforme.
          </p>
        </div>

        {/* Timeline des versions */}
        <div className="space-y-12 border-l-2 border-slate-800 pl-6 ml-2 sm:ml-4">
          {changelogData.map((release, index) => (
            <div key={index} className="relative">
              {/* Point de repère sur la ligne */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-slate-950" />
              
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1 rounded-full text-xs border border-indigo-500/20">
                  {release.version}
                </span>
                <span className="text-slate-400 text-sm">{release.date}</span>
              </div>

              <h2 className="text-2xl font-bold mb-4">{release.title}</h2>

              <ul className="space-y-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
                {release.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
      
      <Footer />
    </div>
  );
}
