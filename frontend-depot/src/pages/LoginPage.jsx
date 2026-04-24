import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message || '';
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Fond animé */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 -left-20 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* LOGO GESTOCK */}
                <div className="text-center mb-8">
                    <img
                        src="/1776204959956-01.jpeg"
                        alt="GesTock"
                        className="w-48 h-auto object-contain mx-auto mb-4 shadow-lg shadow-indigo-500/30 rounded-xl"
                    />
                    <h1 className="text-2xl font-black text-white tracking-tight">GesTock</h1>
                    <p className="text-slate-400 text-sm mt-1">Gestion de stock Â· Cameroun</p>
                </div>

                {/* Carte de connexion */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-lg font-bold text-white mb-6">Connexion</h2>

                    {successMessage && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-xl mb-5 text-center font-bold">
                            âœ… {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5 text-center font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Adresse email
                            </label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="patron@exemple.cm"
                                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 mt-2 uppercase text-sm tracking-widest"
                        >
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </form>

                    {/* LIEN VERS L'INSCRIPTION */}
                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Nouveau sur GesTock ?</p>
                        <Link
                            to="/register"
                            className="inline-block w-full py-3 rounded-xl border border-indigo-500/30 text-indigo-400 text-xs font-black hover:bg-indigo-500/10 transition-all uppercase tracking-widest"
                        >
                            Enregistrer mon Dépôt
                        </Link>
                    </div>
                </div>

                <p className="text-center text-slate-600 text-[10px] mt-6 uppercase tracking-[0.2em] font-bold">
                    GesTock v1.3 Â· Paiement Mobile Money
                </p>
            </div>
        </div>
    );
}




