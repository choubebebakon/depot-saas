import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/1776204959956-01.jpeg';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        nomEntreprise: '',
        email: '',
        password: '',
        confirmPassword: ''
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
                password: formData.password
            });
            navigate('/login', { state: { message: 'Dépôt créé ! Connectez-vous.' } });
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <img src={logo} alt="GesTock" className="w-32 h-auto mx-auto mb-4 object-contain" />
                    <h1 className="text-3xl font-black text-white tracking-tight">GesTock SaaS</h1>
                    <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest">Enregistrez votre dépôt</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
                    {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs font-bold">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Nom du Dépôt</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ex: Dépôt Le Destin"
                                onChange={(e) => setFormData({ ...formData, nomEntreprise: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Email Gérant</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                                placeholder="gerant@exemple.com"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Mot de passe</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Confirmation</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all mt-4 uppercase text-sm"
                        >
                            {loading ? 'Traitement...' : 'Créer mon Dépôt'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <Link to="/login" className="text-slate-500 hover:text-indigo-400 text-xs font-bold transition-all">
                            DÉJÀ UN COMPTE ? SE CONNECTER
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}




