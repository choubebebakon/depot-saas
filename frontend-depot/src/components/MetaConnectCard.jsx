import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Trash2, ShieldCheck, Link2, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useNotif } from '../context/NotifContext';

function FacebookIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

/**
 * Carte « Connexion Meta native » (PARTIE 4) — déclenche le SDK JS Embedded
 * Signup (WhatsApp/WABA, fait vérifié n°10) dans le navigateur du commerçant.
 *
 * FAIT VÉRIFIÉ N°1 : le code d'autorisation arrive dans le callback JS
 * (`response.authResponse.code`), PAS par une redirection serveur. C'est ce
 * composant qui l'envoie au backend via POST /meta/integrations (appel API
 * classique) ; l'échange du code est fait serveur-à-serveur uniquement.
 *
 * Variables requises (Vite, injectées au build) :
 *   VITE_META_APP_ID    — ID de l'app Meta (public)
 *   VITE_META_CONFIG_ID — ID du template de configuration Embedded Signup
 */
const META_APP_ID = import.meta.env.VITE_META_APP_ID;
const META_CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID;
const SDK_URL = 'https://connect.facebook.net/fr_FR/sdk.js';
const SDK_VERSION = 'v21.0';

/** Charge le SDK Facebook une seule fois et résout quand window.FB est prêt. */
function loadFacebookSdk() {
  return new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB);
    if (!META_APP_ID) return reject(new Error('VITE_META_APP_ID manquant (build frontend).'));
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = SDK_URL;
      script.async = true;
      script.onerror = () => reject(new Error('Impossible de charger le SDK Facebook.'));
      document.body.appendChild(script);
    }
    window.fbAsyncInit = () => {
      window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: SDK_VERSION });
      resolve(window.FB);
    };
  });
}

function formatExpiry(tokenExpiresAt) {
  if (!tokenExpiresAt) return 'Sans expiration connue (à confirmer côté Meta)';
  const days = Math.max(0, Math.round((new Date(tokenExpiresAt).getTime() - Date.now()) / 86400000));
  return `Expire dans ~${days} j`;
}

function StatusBadge({ integration }) {
  if (!integration.isActive) {
    return <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">Déconnecté</span>;
  }
  if (integration.lastCheckStatus === 'EXPIRING_SOON') {
    return <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">Bientôt expiré</span>;
  }
  return <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">Actif</span>;
}

export default function MetaConnectCard({ canEdit }) {
  const { success, error: notifError } = useNotif();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [revoking, setRevoking] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['meta-integrations'],
    queryFn: async () => (await api.get('/meta/integrations')).data,
    enabled: canEdit,
  });

  const integrations = data?.integrations ?? [];

  // Ouvre Embedded Signup puis envoie le code au backend (fait vérifié n°1).
  const connect = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const FB = await loadFacebookSdk();
      FB.login(async (response) => {
        try {
          const code = response?.authResponse?.code;
          if (!code) {
            notifError('Connexion Meta annulée ou refusée.');
            return;
          }
          // Le code part vers NOTRE backend : l'échange est serveur à serveur
          // (fait vérifié n°2) — le secret Meta ne quitte jamais le backend.
          await api.post('/meta/integrations', { code });
          success('WhatsApp Business connecté. Les webhooks sont abonnés.');
          queryClient.invalidateQueries({ queryKey: ['meta-integrations'] });
        } catch (err) {
          notifError(err?.response?.data?.message || 'Échec de la connexion Meta.');
        } finally {
          setConnecting(false);
        }
      }, {
        // Embedded Signup v4 : config_id obligatoire (fait vérifié n°11).
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {} },
      });
    } catch (err) {
      notifError(err?.message || 'Impossible d’ouvrir la fenêtre Meta.');
      setConnecting(false);
    }
  }, [connecting, notifError, queryClient, success]);

  const verify = async (id) => {
    setVerifying(true);
    try {
      const res = await api.get(`/meta/integrations/${id}/verify`);
      if (res.data?.isActive) success('Token Meta valide (vérifié via debug_token).');
      else notifError('Token révoqué ou expiré côté Meta — connexion désactivée.');
      queryClient.invalidateQueries({ queryKey: ['meta-integrations'] });
    } catch {
      notifError('Vérification impossible pour le moment.');
    } finally {
      setVerifying(false);
    }
  };

  const revoke = async (id) => {
    setRevoking(id);
    try {
      await api.delete(`/meta/integrations/${id}`);
      success('Connexion Meta révoquée.');
      queryClient.invalidateQueries({ queryKey: ['meta-integrations'] });
    } catch {
      notifError('Révocation impossible pour le moment.');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-3xl p-8 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400"><FacebookIcon className="w-5 h-5" /></div>
        <div>
          <h3 className="text-white font-bold">Canaux Meta (WhatsApp / Instagram / Messenger)</h3>
          <p className="text-slate-400 text-xs">Connectez le numéro WhatsApp Business de votre dépôt. Les messages de vos clients arrivent ensuite dans GeStock.</p>
        </div>
        <div className="flex-1" />
        {canEdit && (
          <button type="button" onClick={() => refetch()} className="text-slate-400 hover:text-white p-2 rounded-lg transition-colors" aria-label="Rafraîchir">
            <RefreshCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {!canEdit && (
        <p className="text-amber-300 text-sm mb-4">Seuls le PATRON et le GÉRANT peuvent gérer la connexion Meta.</p>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
      )}

      {isError && (
        <p className="text-red-400 text-sm">Impossible de charger le statut de connexion Meta.</p>
      )}

      {!isLoading && !isError && integrations.length === 0 && (
        <div className="text-slate-400 text-sm">Aucun canal Meta connecté.</div>
      )}

      {integrations.length > 0 && (
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center gap-4 bg-slate-900/60 border border-slate-700 rounded-2xl px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white font-bold text-sm">{integration.displayPhoneNumber || integration.facebookPageId || integration.id}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest">{integration.channel}</span>
                  <StatusBadge integration={integration} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {formatExpiry(integration.tokenExpiresAt)}
                  {integration.lastCheckedAt ? ` · vérifié le ${new Date(integration.lastCheckedAt).toLocaleString('fr-FR')}` : ''}
                  {integration.lastError ? ` · ${integration.lastError}` : ''}
                </p>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => verify(integration.id)} disabled={verifying}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl hover:bg-indigo-500/20 transition-colors disabled:opacity-50">
                    {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Vérifier
                  </button>
                  <button type="button" onClick={() => revoke(integration.id)} disabled={revoking === integration.id}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50">
                    {revoking === integration.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Révoquer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <button type="button" onClick={connect} disabled={connecting}
          className="mt-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          {connecting ? 'Connexion Meta en cours…' : 'Connecter WhatsApp Business'}
        </button>
      )}
    </div>
  );
}
