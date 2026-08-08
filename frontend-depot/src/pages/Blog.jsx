import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import Footer from '../components/Footer';

const articles = [
  {
    title: "5 astuces infaillibles pour éliminer les écarts de stock dans votre commerce",
    date: "15 Juin 2026",
    readTime: "4 min de lecture",
    excerpt: "Les pertes invisibles plombent la rentabilité de nombreux dépôts et boutiques. Voici comment y remédier simplement..."
  },
  {
    title: "Pourquoi la digitalisation du stock est indispensable en Afrique en 2026",
    date: "28 Mai 2026",
    readTime: "6 min de lecture",
    excerpt: "Passer des cahiers papier au logiciel SaaS : retour d'expérience sur la transformation digitale des commerces de proximité."
  }
];

export default function Blog() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="mb-12">
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-3">
            <BookOpen size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Le Blog GeStock</h1>
          <p className="text-slate-400">Conseils, actualités et stratégies pour optimiser la gestion de votre entreprise.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((art, index) => (
            <div key={index} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
              <div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span>{art.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {art.readTime}</span>
                </div>
                <h2 className="text-xl font-bold mb-3 text-white">{art.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{art.excerpt}</p>
              </div>
              <button 
                onClick={() => navigate('/bientot-disponible')}
                className="text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center gap-1 w-fit"
              >
                Lire l'article &rarr;
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
