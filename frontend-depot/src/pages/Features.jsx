import { useNavigate } from 'react-router-dom';
import { Package, ShieldCheck, Users, BarChart3, Smartphone, Zap } from 'lucide-react';
import Footer from '../components/Footer';

const featuresList = [
  {
    icon: <Package size={28} className="text-primary" />,
    title: "Gestion de Stock en Temps Réel",
    description: "Suivez vos entrées et sorties de marchandises instantanément. Fini les écarts d'inventaire inexpliqués."
  },
  {
    icon: <ShieldCheck size={28} className="text-primary" />,
    title: "Architecture Multi-Tenant Sécurisée",
    description: "Chaque commerce dispose d'un espace strictement cloisonné et chiffré. Vos données commerciales vous appartiennent."
  },
  {
    icon: <Users size={28} className="text-primary" />,
    title: "Gestion Multi-Caissiers & Employés",
    description: "Attribuez des rôles précis (vendeur, gestionnaire, administrateur) et suivez les actions de chacun."
  },
  {
    icon: <BarChart3 size={28} className="text-primary" />,
    title: "Rapports & Analyses Financières",
    description: "Visualisez vos chiffres d'affaires, vos produits les plus vendus et vos marges en un clin d'œil."
  },
  {
    icon: <Smartphone size={28} className="text-primary" />,
    title: "100% Adapté aux Réalités Locales",
    description: "Conçu pour fonctionner de manière fluide, même avec les spécificités de connectivité en Afrique."
  },
  {
    icon: <Zap size={28} className="text-primary" />,
    title: "Interface Ultra-Rapide",
    description: "Une prise en main immédiate sans formation lourde pour vos équipes de vente."
  }
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête de la page */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-indigo-400 font-semibold uppercase tracking-wider text-sm">Puissant & Intuitif</span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mt-2 mb-4">
            Tout ce dont vous avez besoin pour piloter votre commerce
          </h1>
          <p className="text-lg text-slate-400">
            GeStock regroupe tous les outils indispensables pour automatiser votre gestion et booster votre productivité.
          </p>
        </div>

        {/* Grille des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {featuresList.map((feat, index) => (
            <div key={index} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300">
              <div className="bg-indigo-500/10 p-3 rounded-xl w-fit mb-4 text-indigo-400">
                {feat.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>

        {/* Appel à l'action bas de page */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Prêt à transformer la gestion de votre entreprise ?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 text-sm sm:text-base">
            Rejoignez les professionnels qui font confiance à GeStock pour sécuriser leurs stocks.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/pricing')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Voir nos tarifs
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-8 py-3 rounded-xl transition-all border border-slate-700"
            >
              Nous contacter
            </button>
          </div>
        </div>

      </div>
      
      <Footer />
    </div>
  );
}
