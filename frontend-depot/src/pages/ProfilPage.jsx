import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotif } from '../context/NotifContext';
import { User, Mail, Phone, Building, MapPin, Calendar, Shield, Edit2, Save, Camera, Lock, Key, Upload, X, Check, AlertCircle } from 'lucide-react';
import userApi from '../api/userApi';

export default function ProfilPage() {
  const { user, updateUser } = useAuth();
  const { success, error } = useNotif();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // État pour le changement de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // État pour la 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  
  // État pour les préférences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: true,
    language: 'fr',
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
    role: user?.role || '',
    createdAt: user?.createdAt || '',
  });

  // Charger les préférences utilisateur au montage
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await userApi.getPreferences();
      setPreferences(prefs || {
        emailNotifications: true,
        darkMode: true,
        language: 'fr',
      });
    } catch (err) {
      // Si l'endpoint n'existe pas encore, utiliser localStorage
      const localPrefs = localStorage.getItem('user_preferences');
      if (localPrefs) {
        setPreferences(JSON.parse(localPrefs));
      } else {
        setPreferences({
          emailNotifications: true,
          darkMode: true,
          language: 'fr',
        });
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await userApi.updateProfile(formData);
      updateUser({ ...user, ...formData });
      success('Profil mis à jour avec succès');
      setIsEditing(false);
    } catch (err) {
      error('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: user?.nom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
      adresse: user?.adresse || '',
      role: user?.role || '',
      createdAt: user?.createdAt || '',
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      error('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Créer un aperçu local
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload vers le serveur
      const result = await userApi.uploadAvatar(file);
      updateUser({ ...user, avatar: result.avatar });
      success('Photo de profil mise à jour');
    } catch (err) {
      error('Erreur lors du téléchargement de la photo');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setPasswordLoading(true);
    try {
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      success('Mot de passe changé avec succès');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error('Erreur lors du changement de mot de passe');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    setTwoFALoading(true);
    try {
      await userApi.toggle2FA(!twoFAEnabled);
      setTwoFAEnabled(!twoFAEnabled);
      success(twoFAEnabled ? '2FA désactivée' : '2FA activée');
    } catch (err) {
      error('Erreur lors du changement de 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setPreferencesLoading(true);
    try {
      await userApi.updatePreferences(newPreferences);
      success('Préférences mises à jour');
    } catch (err) {
      // Si l'API n'est pas disponible, sauvegarder dans localStorage
      localStorage.setItem('user_preferences', JSON.stringify(newPreferences));
      success('Préférences sauvegardées localement');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Mon Profil</h1>
        <p className="text-slate-400">Gérez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte Profil */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-lg overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  formData.nom?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-full shadow-lg transition-all cursor-pointer">
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
            
            <h2 className="text-white font-bold text-xl mb-1">{formData.nom || 'Utilisateur'}</h2>
            <p className="text-slate-400 text-sm mb-4">{formData.email}</p>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-400 text-xs font-bold uppercase">{formData.role || 'Utilisateur'}</span>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Membre depuis {formatDate(formData.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Carte Sécurité */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mt-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Sécurité
            </h3>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mb-3"
            >
              <Key className="w-4 h-4" />
              Changer le mot de passe
            </button>
            <button
              onClick={handleToggle2FA}
              disabled={twoFALoading}
              className={`w-full ${twoFAEnabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'} disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2`}
            >
              <Shield className="w-4 h-4" />
              {twoFALoading ? 'Chargement...' : twoFAEnabled ? 'Désactiver la 2FA' : 'Activer la 2FA'}
            </button>
          </div>
        </div>

        {/* Formulaire Informations */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg">Informations Personnelles</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Nom complet</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-slate-900/50 border border-slate-700 disabled:border-slate-800 disabled:opacity-50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-slate-900/50 border border-slate-700 disabled:border-slate-800 disabled:opacity-50 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-slate-900/50 border border-slate-700 disabled:border-slate-800 disabled:opacity-50 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Adresse</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-slate-900/50 border border-slate-700 disabled:border-slate-800 disabled:opacity-50 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Rôle</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      disabled
                      className="w-full bg-slate-900/50 border border-slate-800 text-slate-500 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Entreprise</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={user?.nomEntreprise || 'Non défini'}
                      disabled
                      className="w-full bg-slate-900/50 border border-slate-800 text-slate-500 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carte Préférences */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mt-6">
            <h3 className="text-white font-bold text-lg mb-4">Préférences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                <div>
                  <p className="text-white font-semibold text-sm">Notifications par email</p>
                  <p className="text-slate-400 text-xs">Recevoir les alertes et rapports par email</p>
                </div>
                <button
                  onClick={() => handlePreferenceChange('emailNotifications', !preferences.emailNotifications)}
                  disabled={preferencesLoading}
                  className={`w-12 h-6 rounded-full relative transition-all disabled:opacity-40 ${preferences.emailNotifications ? 'bg-cyan-600' : 'bg-slate-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.emailNotifications ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                <div>
                  <p className="text-white font-semibold text-sm">Mode sombre</p>
                  <p className="text-slate-400 text-xs">Utiliser le thème sombre par défaut</p>
                </div>
                <button
                  onClick={() => handlePreferenceChange('darkMode', !preferences.darkMode)}
                  disabled={preferencesLoading}
                  className={`w-12 h-6 rounded-full relative transition-all disabled:opacity-40 ${preferences.darkMode ? 'bg-cyan-600' : 'bg-slate-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.darkMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                <div>
                  <p className="text-white font-semibold text-sm">Langue</p>
                  <p className="text-slate-400 text-xs">Langue de l'interface</p>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  disabled={preferencesLoading}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Changement de Mot de Passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg">Changer le mot de passe</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Mot de passe actuel</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                {passwordLoading ? 'Chargement...' : 'Changer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}