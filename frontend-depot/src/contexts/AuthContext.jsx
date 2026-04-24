import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Au démarrage, vérifie si un token existe en localStorage
    useEffect(() => {
        const token = localStorage.getItem('depot_token');
        const savedUser = localStorage.getItem('depot_user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, user: userData } = response.data;

        // Sauvegarde du token et des infos utilisateur
        localStorage.setItem('depot_token', access_token);
        localStorage.setItem('depot_user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('depot_token');
        localStorage.removeItem('depot_user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, loading,
            tenantId: user?.tenantId || null,
            role: user?.role || null,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook rapide pour consommer le contexte
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
    return ctx;
}




