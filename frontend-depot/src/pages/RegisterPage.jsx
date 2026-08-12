import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo-neon.png';

const METIERS = [
  { id: 'DEPOT_BOISSONS', nom: 'Dépôt de Boissons', icon: 'Package' },
  { id: 'BOUTIQUE', nom: 'Boutique', icon: 'ShoppingBag' },
  { id: 'QUINCAILLERIE', nom: 'Quincaillerie / BTP', icon: 'Wrench' },
  { id: 'PHARMACIE', nom: 'Pharmacie', icon: 'Pill' },
  { id: 'RESTAURANT', nom: 'Restaurant', icon: 'Utensils' },
  { id: 'TELEPHONIE', nom: 'Téléphonie', icon: 'Smartphone' },
  { id: 'SUPERMARCHE', nom: 'Supermarché', icon: 'ShoppingCart' },
  { id: 'CIMENT_BTP', nom: 'Ciment / BTP', icon: 'HardHat' },
  { id: 'PRESSING', nom: 'Pressing', icon: 'Shirt' },
  { id: 'GARAGE_AUTOMOBILE', nom: 'Garage Automobile', icon: 'Wrench' },
  { id: 'ELEVAGE', nom: 'Élevage', icon: 'Tractor' },
  { id: 'SALON_BEAUTE', nom: 'Salon de Coiffure / Beauté', icon: 'Scissors' },
  { id: 'PARFUMERIE', nom: 'Parfumerie / Cosmétique', icon: 'SprayCan' },
  { id: 'BOULANGERIE', nom: 'Boulangerie / Pâtisserie', icon: 'Cookie' },
  { id: 'GLACIER_SNACK', nom: 'Glacier / Snack', icon: 'IceCream' },
  { id: 'LIBRAIRIE', nom: 'Librairie / Papeterie', icon: 'Library' },
  { id: 'CLINIQUE', nom: 'Clinique / Médical', icon: 'Hospital' },
  { id: 'TRANSPORT', nom: 'Transport / Logistique', icon: 'Truck' },
  { id: 'IMMOBILIER', nom: 'Gestion Immobilière', icon: 'Home' },
  { id: 'HOTEL', nom: 'Hôtel', icon: 'Hotel' },
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'radial-gradient(circle at 8% 5%, rgba(34,211,238,.20), transparent 28%), radial-gradient(circle at 92% 8%, rgba(6,182,212,.20), transparent 30%), radial-gradient(circle at 50% 100%, rgba(8,145,178,.16), transparent 34%), linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="GesTock"
            className="w-32 h-auto mx-auto mb-4 object-contain"
            style={{ filter: 'drop-shadow(0 0 22px rgba(34,211,238,0.7))' }}
          />
          <h1 className="text-3xl font-black text-white tracking-tight">GesTock SaaS</h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest">Créez votre compte</p>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
          border: '1px solid rgba(171,202,255,.17)',
          borderRadius: '24px',
          padding: '2rem',
          backdropFilter: 'blur(28px) saturate(145%)',
          WebkitBackdropFilter: 'blur(28px) saturate(145%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.22), 0 28px 80px rgba(0,0,0,.32)'
        }}>
          {error && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '12px',
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
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
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(171,202,255,.17)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                placeholder="Ex: Dépôt Le Destin"
                onChange={(e) => setFormData({ ...formData, nomEntreprise: e.target.value })}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(34,211,238,0.5)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(34,211,238,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(171,202,255,.17)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(171,202,255,.17)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                placeholder="patron@exemple.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(34,211,238,0.5)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(34,211,238,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(171,202,255,.17)';
                  e.target.style.boxShadow = 'none';
                }}
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
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(171,202,255,.17)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    color: '#fff',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(34,211,238,0.5)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(34,211,238,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(171,202,255,.17)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  Confirmation
                </label>
                <input
                  type="password"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(171,202,255,.17)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    color: '#fff',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(34,211,238,0.5)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(34,211,238,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(171,202,255,.17)';
                    e.target.style.boxShadow = 'none';
                  }}
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
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(171,202,255,.17)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  appearance: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(34,211,238,0.5)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(34,211,238,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(171,202,255,.17)';
                  e.target.style.boxShadow = 'none';
                }}
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
                style={{ marginTop: '0.25rem', accentColor: '#22d3ee' }}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              />
              <label htmlFor="acceptTerms" className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                J'accepte les <Link to="/terms" style={{ color: '#22d3ee', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>conditions générales d'utilisation</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                color: '#fff',
                fontWeight: 900,
                padding: '1rem',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(34,211,238,0.4)',
                transition: 'all 0.3s ease',
                marginTop: '1rem',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(171,202,255,.17)', textAlign: 'center' }}>
            <Link
              to="/login"
              style={{
                color: '#8ea2c3',
                fontSize: '0.75rem',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#22d3ee';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#8ea2c3';
              }}
            >
              DÉJÀ UN COMPTE ? SE CONNECTER
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}