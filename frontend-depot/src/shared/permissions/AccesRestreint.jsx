/**
 * Affiché à la place du contenu d'un sous-module quand canRead === false.
 */
export default function AccesRestreint({
  sousModule,
  libelleRoleAutorise = 'Patron ou Gérant',
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: '2rem',
      }}
      role="alert"
      data-sous-module={sousModule || undefined}
    >
      <p
        style={{
          maxWidth: 480,
          textAlign: 'center',
          fontSize: '1.05rem',
          lineHeight: 1.5,
          color: '#94a3b8',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Accès refusé — cette partie est réservée à{' '}
        <strong style={{ color: '#e2e8f0' }}>{libelleRoleAutorise}</strong>.
      </p>
    </div>
  );
}
