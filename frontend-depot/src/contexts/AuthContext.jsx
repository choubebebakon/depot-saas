/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { roleLabel, normalizeMetierSlug } from '../shared/permissions/matrix';

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
    const [permissionsState, setPermissionsState] = useState(null);
    const [libellePoste, setLibellePoste] = useState(null);

    const loadPermissions = useCallback(async () => {
        const token = localStorage.getItem('depot_token');
        if (!token) {
            setPermissionsState(null);
            setLibellePoste(null);
            return null;
        }
        try {
            const { data } = await api.get('/auth/permissions');
            setPermissionsState(data);
            setLibellePoste(data?.libellePoste || null);
            return data;
        } catch (error) {
            console.warn('[AuthContext] Permissions API indisponible, fallback matrice locale', error);
            setPermissionsState(null);
            return null;
        }
    }, []);

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
            await loadPermissions();
            return userData;
        } catch (error) {
            console.error('[AuthContext] Échec du rafraîchissement du profil:', error);
            return null;
        }
    }, [loadPermissions]);

    const updateUser = useCallback((updatedFields) => {
        setUser((prev) => {
            const merged = { ...prev, ...updatedFields };
            localStorage.setItem('depot_user', JSON.stringify(merged));
            return merged;
        });
    }, []);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('depot_token');
            if (token) {
                try {
                    await refreshUser();
                } catch (error) {
                    console.error('[AuthContext] Session expirée ou invalide au démarrage:', error);
                    localStorage.removeItem('depot_token');
                    localStorage.removeItem('depot_user');
                    localStorage.removeItem('gestock_metier');
                    delete api.defaults.headers.common.Authorization;
                    setUser(null);
                    setPermissionsState(null);
                    setLibellePoste(null);
                }
            }
            setLoading(false);
        };

        verifyAuth();
    }, [refreshUser]);

    // Libellé de poste local si API absente
    useEffect(() => {
        if (libellePoste || !user?.role) return;
        const slug = normalizeMetierSlug(user.metier || localStorage.getItem('gestock_metier'));
        if (slug) setLibellePoste(roleLabel(user.role, slug));
    }, [user, libellePoste]);

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
        await loadPermissions();
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
            setPermissionsState(null);
            setLibellePoste(null);
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, loading,
            refreshUser,
            updateUser,
            permissionsState,
            libellePoste,
            tenantId: user?.tenantId || null,
            role: user?.role || null,
            metier: user?.metier || null,
            nomEntreprise: user?.nomEntreprise || null,
            planType: user?.planType || user?.plan || 'FREE',
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