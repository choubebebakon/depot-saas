import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoNeon from '../assets/logo-neon.png';
import api from '../api/axios';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant.');
      setTokenValid(false);
    }
  }, [token]);

  const validatePassword = (password) => {
    const newErrors = {};
    if (!password) {
      newErrors.newPassword = 'Nouveau mot de passe requis';
    } else if (password.length < 8) {
      newErrors.newPassword = 'Minimum 8 caractères';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.newPassword = 'Au moins une majuscule';
    } else if (!/[a-z]/.test(password)) {
      newErrors.newPassword = 'Au moins une minuscule';
    } else if (!/[0-9]/.test(password)) {
      newErrors.newPassword = 'Au moins un chiffre';
    }
    return newErrors;
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (field === 'newPassword') {
      const newErrors = validatePassword(value);
      setErrors({ ...errors, ...newErrors });
    }
    if (field === 'confirmPassword') {
      if (value && value !== form.newPassword) {
        setErrors({ ...errors, confirmPassword: 'Les mots de passe ne correspondent pas' });
      } else {
        const { confirmPassword, ...rest } = errors;
        setErrors(rest);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const newErrors = validatePassword(form.newPassword);
    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!token) {
      setError('Token invalide.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess('Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
      setForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la réinitialisation. Le lien a peut-être expiré.';
      setError(msg);
      if (msg.includes('expiré') || msg.includes('invalide') || msg.includes('utilisé')) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
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

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src={logoNeon}
              alt="GesTock"
              className="w-40 h-auto object-contain mx-auto mb-4"
              style={{ filter: 'drop-shadow(0 0 24px rgba(34,211,238,0.75))' }}
            />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">GesStock</h1>
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
            <h2 className="text-lg font-bold text-white mb-2">Lien invalide ou expiré</h2>
            <p className="text-slate-400 text-sm mb-6">{error || 'Ce lien de réinitialisation a expiré ou a déjà été utilisé.'}</p>
            
            <div style={{ textAlign: 'center' }}>
              <Link
                to="/forgot-password"
                style={{ display: 'inline-block', width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #22d3ee, #06b6d4)', color: '#fff', fontWeight: 900, fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', marginBottom: '1rem' }}
              >
                Demander un nouveau lien
              </Link>
              <Link
                to="/login"
                style={{ display: 'inline-block', width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', fontSize: '0.75rem', fontWeight: 900, transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(34,211,238,0.1)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logoNeon}
            alt="GesTock"
            className="w-40 h-auto object-contain mx-auto mb-4"
            style={{ filter: 'drop-shadow(0 0 24px rgba(34,211,238,0.75))' }}
          />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">GesStock</h1>
          <p className="text-slate-400 text-sm mt-1">Gestion de stock · Cameroun</p>
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
          <h2 className="text-lg font-bold text-white mb-2">Nouveau mot de passe</h2>
          <p className="text-slate-400 text-sm mb-6">Votre lien est valide. Choisissez un mot de passe sécurisé.</p>

          {success && (
            <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '0.875rem', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', textAlign: 'center', fontWeight: 700 }}>
              ✅ {success}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.875rem', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', textAlign: 'center', fontWeight: 700 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                required
                value={form.newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.newPassword ? '#ef4444' : 'rgba(171,202,255,.17)'}`, color: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', outline: 'none', transition: 'all 0.3s ease' }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(34,211,238,0.5)'; e.target.style.boxShadow = '0 0 0 2px rgba(34,211,238,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = errors.newPassword ? '#ef4444' : 'rgba(171,202,255,.17)'; e.target.style.boxShadow = 'none'; }}
              />
              {errors.newPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.confirmPassword ? '#ef4444' : 'rgba(171,202,255,.17)'}`, color: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', outline: 'none', transition: 'all 0.3s ease' }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(34,211,238,0.5)'; e.target.style.boxShadow = '0 0 0 2px rgba(34,211,238,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : 'rgba(171,202,255,.17)'; e.target.style.boxShadow = 'none'; }}
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="text-slate-500 text-xs space-y-1" style={{ fontFamily: 'monospace' }}>
              <p>✓ Minimum 8 caractères</p>
              <p>✓ Au moins une majuscule</p>
              <p>✓ Au moins une minuscule</p>
              <p>✓ Au moins un chiffre</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: 'linear-gradient(135deg, #22d3ee, #06b6d4)', color: '#fff', fontWeight: 900, padding: '0.875rem 1.5rem', borderRadius: '12px', transition: 'all 0.3s ease', boxShadow: '0 4px 20px rgba(34,211,238,0.4)', marginTop: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.1em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(171,202,255,.17)', textAlign: 'center' }}>
            <Link
              to="/login"
              style={{ display: 'inline-block', width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', fontSize: '0.75rem', fontWeight: 900, transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(34,211,238,0.1)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
            >
              Retour à la connexion
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-600 text-[10px] mt-6 uppercase tracking-[0.2em] font-bold">
          GesTock v1.3 · Paiement Mobile Money
        </p>
      </div>
    </div>
  );
}