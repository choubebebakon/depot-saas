import api from './axios';

export const userApi = {
  // Récupérer le profil utilisateur
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Mettre à jour le profil utilisateur
  updateProfile: async (data) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },

  // Upload de photo de profil
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  // Activer/Désactiver la 2FA
  toggle2FA: async (enabled) => {
    const response = await api.post('/auth/2fa', { enabled });
    return response.data;
  },

  // Récupérer les préférences utilisateur
  getPreferences: async () => {
    const response = await api.get('/auth/preferences');
    return response.data;
  },

  // Mettre à jour les préférences utilisateur
  updatePreferences: async (data) => {
    const response = await api.put('/auth/preferences', data);
    return response.data;
  },
};

export default userApi;
