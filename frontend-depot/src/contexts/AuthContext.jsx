/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

function loadStoredUser() {
    const token = localStorage.getItem('depot_token');
    const savedUser = localStorage.getItem('depot_user') || localStorage.getItem('user');

    if (!token || !savedUser) return null;

    try {
        const parsedUser = JSON.parse(savedUser);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

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
    const [loading, setLoading] = useState(!!localStorage.getItem('depot_token'));

    // 🔥 AJOUT : Fonction pour rafraîchir instantanément les infos de l'utilisateur depuis le serveur
    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('depot_token');
        if (!token) return null;
        
        try {
            const response = await api.get('/auth/me');
            const userData = response.data;
            
            localStorage.setItem('depot_user', JSON.stringify(userData));
            if (userData?.metier) {
                localStorage.setItem('gestock_metier', userData.metier);
            }
            setUser(userData);
            return userData;
        } catch (error) {
            console.error('[AuthContext] Échec du rafraîchissement du profil:', error);
            return null;
        }
    }, []);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('depot_token');
            if (token) {
                try {
                    // On utilise le refreshUser ici aussi pour éviter la duplication de code
                    await refreshUser();
                } catch (error) {
                    console.error('[AuthContext] Session expirée ou invalide au démarrage:', error);
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
    }, [refreshUser]);

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
            refreshUser, // 👈 On partage la fonction magique ici
            tenantId: user?.tenantId || null,
            role: user?.role || null,
            metier: user?.metier || null,
            nomEntreprise: user?.nomEntreprise || null,
            planType: user?.planType || user?.plan || 'FREE', // 👈 Sécurité pour centraliser le planType
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