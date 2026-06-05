import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo-neon.png';

const METIERS = [
  { id: 'DEPOT_BOISSONS', nom: 'Dépôt de Boissons', icon: '🥤' },
  { id: 'BOUTIQUE', nom: 'Boutique', icon: '🏪' },
  { id: 'QUINCAILLERIE', nom: 'Quincaillerie / BTP', icon: '🛠' },
  { id: 'PHARMACIE', nom: 'Pharmacie', icon: '💊' },
  { id: 'RESTAURANT', nom: 'Restaurant', icon: '🍽' },
  { id: 'TELEPHONIE', nom: 'Téléphonie', icon: '📱' },
  { id: 'SUPERMARCHE', nom: 'Supermarché', icon: '🛒' },
  { id: 'CIMENT_BTP', nom: 'Ciment / BTP', icon: '🏗️' },
  { id: 'PRESSING', nom: 'Pressing', icon: '👔' },
  { id: 'GARAGE_AUTOMOBILE', nom: 'Garage Automobile', icon: '🔧' },
  { id: 'ELEVAGE', nom: 'Élevage', icon: '🐄' },
  { id: 'SALON_BEAUTE', nom: 'Salon de Coiffure / Beauté', icon: '💇' },
  { id: 'PARFUMERIE', nom: 'Parfumerie / Cosmétique', icon: '🧴' },
  { id: 'BOULANGERIE', nom: 'Boulangerie / Pâtisserie', icon: '🥖' },
  { id: 'GLACIER_SNACK', nom: 'Glacier / Snack', icon: '🍦' },
  { id: 'LIBRAIRIE', nom: 'Librairie / Papeterie', icon: '📚' },
  { id: 'CLINIQUE', nom: 'Clinique / Médical', icon: '🏥' },
  { id: 'TRANSPORT', nom: 'Transport / Logistique', icon: '🚛' },
  { id: 'IMMOBILIER', nom: 'Gestion Immobilière', icon: '🏠' },
  { id: 'HOTEL', nom: 'Hôtel', icon: '🏨' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nomEntreprise: '',
    email: '',
    password: '',
    confirmPassword: '',
    metier: 'DEPOT_BOISSONS',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        nomEntreprise: formData.nomEntreprise,
        email: formData.email,
        password: formData.password,
        metier: formData.metier,
        acceptTerms: true,
      });
      navigate('/login', { state: { message: 'Compte créé ! Connectez-vous.' } });
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      if (Array.isArray(apiMessage)) {
        setError(apiMessage.join(', '));
      } else if (typeof apiMessage === 'string') {
        setError(apiMessage);
      } else {
        setError(err.message || "Erreur d'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="GesTock"
            className="w-32 h-auto mx-auto mb-4 object-contain drop-shadow-[0_0_22px_rgba(34,211,238,0.7)]"
          />
          <h1 className="text-3xl font-black text-white tracking-tight">GesTock SaaS</h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest">Créez votre compte</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                placeholder="Ex: Dépôt Le Destin"
                onChange={(e) => setFormData({ ...formData, nomEntreprise: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                placeholder="patron@exemple.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  Confirmation
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Secteur d'activité
              </label>
              <select
                required
                value={formData.metier}
                onChange={(e) => setFormData({ ...formData, metier: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all appearance-none"
              >
                {METIERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                type="checkbox"
                required
                id="acceptTerms"
                className="mt-1 accent-indigo-500"
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              />
              <label htmlFor="acceptTerms" className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                J'accepte les <Link to="/cgu" className="text-indigo-400 hover:underline">conditions générales d'utilisation</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all mt-4 uppercase text-sm"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link
              to="/login"
              className="text-slate-500 hover:text-indigo-400 text-xs font-bold transition-all"
            >
              DÉJÀ UN COMPTE ? SE CONNECTER
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}