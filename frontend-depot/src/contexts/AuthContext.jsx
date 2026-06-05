/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

function loadStoredUser() {
    const token = localStorage.getItem('depot_token');
    const savedUser = localStorage.getItem('depot_user') || localStorage.getItem('user');

    if (!token || !savedUser) return null;

    try {
        const parsedUser = JSON.parse(savedUser);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        // Sync gestock_metier from stored user
        if (parsedUser?.metier) {
            localStorage.setItem('gestock_metier', parsedUser.metier);
        }

        return parsedUser;
    } catch (e) {
        console.error('Erreur de parsing de l utilisateur sauvegarde:', e);
        localStorage.removeItem('depot_user');
        localStorage.removeItem('user');
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(loadStoredUser);
    // FIX M4 : Vrai état de chargement initialisé à true si un token existe (en attente de validation)
    const [loading, setLoading] = useState(!!localStorage.getItem('depot_token'));

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('depot_token');
            if (token) {
                try {
                    // On profite du boot pour rafraîchir le profil et le statut de l'abonnement du tenant
                    const response = await api.get('/auth/me');
                    const userData = response.data;
                    
                    localStorage.setItem('depot_user', JSON.stringify(userData));
                    if (userData?.metier) {
                        localStorage.setItem('gestock_metier', userData.metier);
                    }
                    setUser(userData);
                } catch (error) {
                    console.error('[AuthContext] Session expirée ou invalide au démarrage:', error);
                    // Si l'API renvoie une erreur (ex: token expiré), on nettoie tout
                    localStorage.removeItem('depot_token');
                    localStorage.removeItem('depot_user');
                    localStorage.removeItem('gestock_metier');
                    delete api.defaults.headers.common.Authorization;
                    setUser(null);
                }
            }
            setLoading(false);
        };

        verifyAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, accessToken, user: userData } = response.data;
        const token = access_token || accessToken;

        localStorage.setItem('depot_token', token);
        localStorage.setItem('depot_user', JSON.stringify(userData));
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        if (userData?.metier) {
            localStorage.setItem('gestock_metier', userData.metier);
        }

        setUser(userData);
        return userData;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn('[AuthContext] Échec de la déconnexion côté serveur, nettoyage local en cours...', error);
        } finally {
            localStorage.removeItem('depot_token');
            localStorage.removeItem('depot_user');
            localStorage.removeItem('gestock_metier');
            delete api.defaults.headers.common.Authorization;
            setUser(null);
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, loading,
            tenantId: user?.tenantId || null,
            role: user?.role || null,
            metier: user?.metier || null,
            nomEntreprise: user?.nomEntreprise || null,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit etre utilise dans AuthProvider');
    return ctx;
}