export default function DevModeBanner() {
  if (import.meta.env.VITE_DISABLE_SUBSCRIPTION_CHECKS !== 'true') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#dc2626',
        color: 'white',
        textAlign: 'center',
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      ⚠️ MODE DEV — Contrôles d'abonnement désactivés (DISABLE_SUBSCRIPTION_CHECKS). Ne jamais déployer ainsi en production.
    </div>
  );
}