import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNotif } from '../../../context/NotifContext';
import { boutiqueApi } from '../services/boutiqueApi';

const TYPES_BOUTIQUE = [
  { key: 'generique', label: 'Boutique générique', icone: '🛍️' },
  { key: 'parfumerie', label: 'Parfumerie', icone: '🌸' },
  { key: 'librairie', label: 'Librairie', icone: '📚' },
  { key: 'telephonie', label: 'Téléphonie', icone: '📱' },
  { key: 'salon_beaute', label: 'Salon de beauté', icone: '💅' },
  { key: 'glacier', label: 'Glacier / Snack', icone: '🍦' },
];

export default function TypeBoutiqueSelector() {
  const navigate = useNavigate();
  const { success, error } = useNotif();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['boutique-categories'],
    queryFn: async () => {
      const res = await boutiqueApi.getCategories();
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  });

  const seedMutation = useMutation({
    mutationFn: (type) => boutiqueApi.seedCategories(type),
    onSuccess: (res) => {
      success(`${res.data?.created || 0} catégories initialisées`);
      navigate('/boutique/dashboard');
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Erreur lors de l\'initialisation');
    },
  });

  // Don't show if categories already exist or loading
  if (isLoading || categories.length > 0) {
    return null;
  }

  const handleSelect = (type) => {
    seedMutation.mutate(type);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">
            🏪 Configurez votre boutique
          </h1>
          <p className="text-slate-400 text-lg">
            Choisissez le type de votre commerce pour initialiser les catégories prédéfinies
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TYPES_BOUTIQUE.map((type) => (
            <button
              key={type.key}
              onClick={() => handleSelect(type.key)}
              disabled={seedMutation.isPending}
              className="bg-slate-800/60 border border-slate-700/50 hover:border-amber-500 hover:bg-slate-800 rounded-2xl p-8 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {type.icone}
              </div>
              <h3 className="text-white font-bold text-xl mb-2">{type.label}</h3>
              <p className="text-slate-500 text-sm">
                {type.key === 'generique' 
                  ? 'Catégories génériques pour tous types de commerce'
                  : 'Catégories spécialisées pour ce secteur'
                }
              </p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Vous pourrez modifier les catégories et en ajouter d'autres ultérieurement
          </p>
        </div>
      </div>
    </div>
  );
}
