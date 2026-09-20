import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotif } from '../context/NotifContext';
import { User, Mail, Phone, Building, MapPin, Calendar, Shield, Edit2, Save, Camera, Lock, Key, Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import userApi from '../api/userApi';
import resolveFileUrl from '../shared/utils/fileUrl';

export default function ProfilPage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { success, error } = useNotif();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: true,
    language: 'fr',
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    role: '',
    createdAt: '',
  });

  const syncFormDataWithUser = useCallback(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        adresse: user.adresse || '',
        role: user.role || '',
        createdAt: user.createdAt || '',
      });
      if (user.avatar && !avatarPreview) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user, avatarPreview]);

  useEffect(() => {
    syncFormDataWithUser();
  }, [syncFormDataWithUser]);

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
    } catch {
      const localPrefs = localStorage.getItem('user_preferences');
      if (localPrefs) {
        setPreferences(JSON.parse(localPrefs));
      }
    }
  };

  const validateField = (name, value) => {
    const errors = { ...formErrors };
    switch (name) {
      case 'nom':
        if (!value.trim()) errors.nom = 'Le nom est requis';
        else if (value.trim().length < 2) errors.nom = 'Le nom doit contenir au moins 2 caractères';
        else delete errors.nom;
        break;
      case 'email':
        if (!value.trim()) errors.email = 'L\'email est requis';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Format d\'email invalide';
        else delete errors.email;
        break;
      case 'telephone':
        if (value && !/^[\d\s+\-.()]{8,}$/.test(value)) errors.telephone = 'Format de téléphone invalide';
        else delete errors.telephone;
        break;
      case 'adresse':
        if (value && value.length > 500) errors.adresse = 'L\'adresse ne doit pas dépasser 500 caractères';
        else delete errors.adresse;
        break;
      default:
        break;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const hasFormErrors = () => {
    const newErrors = {};
    ['nom', 'email', 'telephone', 'adresse'].forEach(field => {
      validateField(field, formData[field]);
    });
    setFormErrors(newErrors);
    setTouched({ nom: true, email: true, telephone: true, adresse: true });
    return Object.keys(newErrors).length > 0;
  };

  const handleSave = async () => {
    if (hasFormErrors()) {
      error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const dataToSend = {
      nom: formData.nom.trim(),
      email: formData.email.trim(),
      telephone: formData.telephone.trim(),
      adresse: formData.adresse.trim(),
    };

    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const updatedUser = await userApi.updateProfile(dataToSend);
      updateUser(updatedUser);
      success('Profil mis à jour avec succès');
      setIsEditing(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const msg = err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du profil';
        error(msg);
        if (err.response?.data?.errors) {
          const fieldErrors = {};
          err.response.data.errors.forEach(e => {
            fieldErrors[e.field] = e.message;
          });
          setFormErrors(fieldErrors);
        }
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    syncFormDataWithUser();
    setFormErrors({});
    setTouched({});
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      error('Format non supporté. Utilisez JPG, PNG ou WebP');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error('L\'image ne doit pas dépasser 5MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    const previewPromise = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    const preview = await previewPromise;
    setAvatarPreview(preview);

    abortControllerRef.current = new AbortController();
    try {
      const result = await userApi.uploadAvatar(file);
      // URL résolue (absolue) pour que l'avatar s'affiche partout en temps réel,
      // y compris après refreshUser() qui renverra la même URL depuis le backend.
      const avatarUrl = resolveFileUrl(result.avatar);
      updateUser({ ...user, avatar: avatarUrl });
      setAvatarPreview(avatarUrl);
      success('Photo de profil mise à jour');
      await refreshUser();
    } catch (err) {
      if (err.name !== 'AbortError') {
        error('Erreur lors du téléchargement de la photo');
        setAvatarPreview(user?.avatar || null);
      }
    } finally {
      setUploadingAvatar(false);
      abortControllerRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePasswordChange = async () => {
    const newErrors = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Mot de passe actuel requis';
    if (!passwordData.newPassword) newErrors.newPassword = 'Nouveau mot de passe requis';
    else if (passwordData.newPassword.length < 8) newErrors.newPassword = 'Minimum 8 caractères';
    else if (!/[A-Z]/.test(passwordData.newPassword)) newErrors.newPassword = 'Au moins une majuscule';
    else if (!/[a-z]/.test(passwordData.newPassword)) newErrors.newPassword = 'Au moins une minuscule';
    else if (!/[0-9]/.test(passwordData.newPassword)) newErrors.newPassword = 'Au moins un chiffre';
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';

    setPasswordErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setPasswordLoading(true);
    abortControllerRef.current = new AbortController();
    try {
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      success('Mot de passe changé avec succès');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err) {
      if (err.name !== 'AbortError') {
        const msg = err.response?.data?.message || 'Erreur lors du changement de mot de passe';
        error(msg);
      }
    } finally {
      setPasswordLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleToggle2FA = async () => {
    setTwoFALoading(true);
    abortControllerRef.current = new AbortController();
    try {
      const newState = !twoFAEnabled;
      await userApi.toggle2FA(newState);
      setTwoFAEnabled(newState);
      success(newState ? '2FA activée' : '2FA désactivée');
    } catch (err) {
      if (err.name !== 'AbortError') {
        error('Erreur lors du changement de 2FA');
      }
    } finally {
      setTwoFALoading(false);
      abortControllerRef.current = null;
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setPreferencesLoading(true);
    try {
      await userApi.updatePreferences(newPreferences);
      success('Préférences mises à jour');
    } catch {
      localStorage.setItem('user_preferences', JSON.stringify(newPreferences));
      success('Préférences sauvegardées localement');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const currentAvatar = resolveFileUrl(avatarPreview || user?.avatar);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Mon Profil</h1>
        <p className="text-slate-400">Gérez vos informations personnelles et préférences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-lg overflow-hidden relative">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  formData.nom?.[0]?.toUpperCase() || 'U'
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-full shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={triggerFileInput}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
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

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mt-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Sécurité
            </h3>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mb-3"
            >
              <Key className="w-4 h-4" /> Changer le mot de passe
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

        <div className="lg:col-span-2">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg">Informations Personnelles</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                >
                  <Edit2 className="w-4 h-4" /> Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
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
                  onBlur={handleBlur}
                  disabled={!isEditing}
                  className={`w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:cursor-not-allowed ${
                    !isEditing ? 'border-slate-700 disabled:border-slate-800 disabled:opacity-50' :
                    formErrors.nom && touched.nom ? 'border-red-500 focus:border-red-500' : 'border-slate-700'
                  }`}
                  aria-invalid={formErrors.nom && touched.nom}
                  aria-describedby={formErrors.nom && touched.nom ? 'nom-error' : undefined}
                />
                {formErrors.nom && touched.nom && (
                  <p id="nom-error" className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.nom}
                  </p>
                )}
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
                    onBlur={handleBlur}
                    disabled={!isEditing}
                    className={`w-full bg-slate-900/50 border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:cursor-not-allowed ${
                      !isEditing ? 'border-slate-700 disabled:border-slate-800 disabled:opacity-50' :
                      formErrors.email && touched.email ? 'border-red-500 focus:border-red-500' : 'border-slate-700'
                    }`}
                    aria-invalid={formErrors.email && touched.email}
                    aria-describedby={formErrors.email && touched.email ? 'email-error' : undefined}
                  />
                </div>
                {formErrors.email && touched.email && (
                  <p id="email-error" className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.email}
                  </p>
                )}
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
                    onBlur={handleBlur}
                    disabled={!isEditing}
                    placeholder="+33 6 12 34 56 78"
                    className={`w-full bg-slate-900/50 border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:cursor-not-allowed ${
                      !isEditing ? 'border-slate-700 disabled:border-slate-800 disabled:opacity-50' :
                      formErrors.telephone && touched.telephone ? 'border-red-500 focus:border-red-500' : 'border-slate-700'
                    }`}
                    aria-invalid={formErrors.telephone && touched.telephone}
                    aria-describedby={formErrors.telephone && touched.telephone ? 'phone-error' : undefined}
                  />
                </div>
                {formErrors.telephone && touched.telephone && (
                  <p id="phone-error" className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.telephone}
                  </p>
                )}
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
                    onBlur={handleBlur}
                    disabled={!isEditing}
                    placeholder="123 Rue de l'Exemple, 75000 Paris"
                    className={`w-full bg-slate-900/50 border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:cursor-not-allowed ${
                      !isEditing ? 'border-slate-700 disabled:border-slate-800 disabled:opacity-50' :
                      formErrors.adresse && touched.adresse ? 'border-red-500 focus:border-red-500' : 'border-slate-700'
                    }`}
                    aria-invalid={formErrors.adresse && touched.adresse}
                    aria-describedby={formErrors.adresse && touched.adresse ? 'adresse-error' : undefined}
                  />
                </div>
                {formErrors.adresse && touched.adresse && (
                  <p id="adresse-error" className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.adresse}
                  </p>
                )}
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
                  role="switch"
                  aria-checked={preferences.emailNotifications}
                  aria-label="Notifications par email"
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
                  role="switch"
                  aria-checked={preferences.darkMode}
                  aria-label="Mode sombre"
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

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg">Changer le mot de passe</h3>
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordErrors({}); }}
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
                  className={`w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all ${passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-700'}`}
                  autoComplete="current-password"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {passwordErrors.currentPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all ${passwordErrors.newPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-700'}`}
                  autoComplete="new-password"
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {passwordErrors.newPassword}
                  </p>
                )}
                {!passwordErrors.newPassword && passwordData.newPassword && (
                  <div className="mt-2 flex gap-1" aria-label="Force du mot de passe">
                    {[
                      { test: /.{8,}/, label: '8+' },
                      { test: /[A-Z]/, label: 'Maj' },
                      { test: /[a-z]/, label: 'Min' },
                      { test: /[0-9]/, label: 'Chiffre' },
                    ].map((rule, i) => (
                      <div key={i} className={`flex-1 h-1.5 rounded ${rule.test(passwordData.newPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} title={rule.label} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={`w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all ${passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-700'}`}
                  autoComplete="new-password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordErrors({}); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Changer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}