import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowLeft, HelpCircle } from 'lucide-react';
import Footer from '../components/Footer';

const faqData = [
  {
    question: "Comment GeStock protège-t-il les données de mon commerce ?",
    answer: "GeStock utilise une architecture multi-tenant hautement sécurisée. Chaque entreprise possède un espace strictement cloisonné et chiffré. Personne d'autre que vous ne peut accéder à vos données de stock et de vente."
  },
  {
    question: "Le logiciel fonctionne-t-il en cas de coupure d'internet ?",
    answer: "GeStock est une solution SaaS cloud pensée pour l'Afrique. Nous optimisons les flux de données pour qu'elle reste fluide même sur des connexions mobiles instables."
  },
  {
    question: "Puis-je gérer plusieurs caissiers ou collaborateurs ?",
    answer: "Oui ! Vous pouvez créer des accès spécifiques pour vos employés en leur attribuant des rôles (vendeur, gestionnaire) afin de garder un œil précis sur toutes les opérations."
  },
  {
    question: "Comment souscrire à un abonnement payant ?",
    answer: "Rendez-vous simplement sur notre page 'Tarifs' (/pricing) pour choisir la formule qui correspond à la taille de votre structure."
  }
];

export default function Faq() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="text-center mb-12">
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-3">
            <HelpCircle size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Centre d'aide &amp; FAQ</h1>
          <p className="text-slate-400">Trouvez rapidement des réponses à vos questions concernant l'utilisation de GeStock.</p>
        </div>

        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div 
              key={index}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-200 hover:text-white"
              >
                <span>{item.question}</span>
                {openIndex === index ? <ChevronUp size={20} className="text-indigo-400" /> : <ChevronDown size={20} className="text-slate-400" />}
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-800/60 pt-4">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
