// Diagnostic NotchPay — clés JAMAIS affichées.
// Usage : node scripts/notchpay-diag.mjs
//
// FAITS VALIDÉS (compte LIVE GesTock) :
//  - clé PUBLIQUE  → header `Authorization` (endpoints paiement standard)
//  - clé PRIVÉE    → header `X-Grant` (endpoints à risque / transferts)
//  - les clés contiennent un point littéral (pk. / sk. / hsk.)
import fs from 'node:fs';

const envText = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) {
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[m[1]] = val.trim();
  }
}
const clean = (v) => (v || '').replace(/\s+/g, '');
const PUBLIC = clean(env.NOTCHPAY_PUBLIC_KEY);
const PRIVATE = clean(env.NOTCHPAY_PRIVATE_KEY);
const HASH = clean(env.NOTCHPAY_HASH_KEY);
const ENDPOINT = clean(env.NOTCHPAY_ENDPOINT) || 'https://api.notchpay.co';
// Le verrouillage du canal est DÉSACTIVÉ par défaut (cf. .env.example) : la
// sonde reproduit donc exactement ce que le backend enverra réellement.
const LOCK_CHANNEL = clean(env.NOTCHPAY_LOCK_CHANNEL) === 'true';

console.log('── Étape 1 : variables .env ──');
console.log('ENDPOINT =', ENDPOINT);
// Le point littéral est LÉGITIME dans les clés NotchPay (pk. / sk. / hsk.)
const FORMAT_OK = /^[A-Za-z0-9_.-]+$/;
for (const [nom, val] of [
  ['NOTCHPAY_PUBLIC_KEY', PUBLIC],
  ['NOTCHPAY_PRIVATE_KEY', PRIVATE],
  ['NOTCHPAY_HASH_KEY', HASH],
]) {
  console.log(
    nom.padEnd(20),
    val
      ? `✅ | longueur ${val.length} | préfixe ${val.slice(0, 7)}… | format ${FORMAT_OK.test(val) ? 'OK' : '⚠️ INATTENDU'}`
      : '❌ ABSENT',
  );
}
if (!PUBLIC) {
  console.log('\n⛔ Authorization exige la clé PUBLIQUE — impossible de continuer.');
  process.exit(1);
}

const axios = (await import('axios')).default;

console.log('\n── Étape 2 : GET /channels (couverture RÉELLE) ──');
try {
  // OBSERVÉ EN RÉEL : /channels renvoie 401 SANS en-tête → on envoie la clé
  // publique (la documentation le présente comme public, l'API exige l'auth).
  const res = await axios.get(`${ENDPOINT}/channels`, {
    headers: { Authorization: PUBLIC, 'Content-Type': 'application/json' },
    timeout: 20000,
  });
  const channels = res.data?.channels ?? res.data ?? [];
  const list = Array.isArray(channels) ? channels : Object.values(channels);
  console.log(`✅ HTTP ${res.status} — ${list.length} canal(aux) renvoyé(s)`);
  for (const c of list.slice(0, 80)) {
    const id = c.id ?? c.name ?? c.code ?? JSON.stringify(c).slice(0, 60);
    const cur = c.currency ?? c.currencies ?? '-';
    const min = c.min ?? c.minAmount ?? '-';
    const max = c.max ?? c.maxAmount ?? '-';
    const country = c.country ?? c.countries ?? '-';
    console.log(
      `   id=${id} | country=${JSON.stringify(country)} | devise=${JSON.stringify(cur)} | min=${min} | max=${max}`,
    );
  }
  fs.writeFileSync(
    new URL('../notchpay-channels-raw.json', import.meta.url),
    JSON.stringify(res.data, null, 2),
  );
  console.log(
    '   (brut complet écrit dans backend-depot/notchpay-channels-raw.json)',
  );
} catch (e) {
  console.log('❌ /channels :', e.response?.status ?? e.message);
  console.log(JSON.stringify(e.response?.data ?? '', null, 2).slice(0, 600));
}

console.log('\n── Étape 3 : POST /payments/initialize (Authorization = clé PUBLIQUE) ──');
try {
  const res = await axios.post(
    `${ENDPOINT}/payments/initialize`,
    {
      amount: 1000,
      currency: 'XAF',
      customer: { email: 'diag@gestock.test', name: 'Diag GesTock' },
      phone: '237670000000',
      // Miroir EXACT du backend : `locked_currency` est toujours envoyé ;
      // `locked_channel` UNIQUEMENT si NOTCHPAY_LOCK_CHANNEL=true (mesuré en
      // réel : le verrou fait échouer la page Collect → « Méthode de paiement
      // indisponible », pour cm.mtn comme pour cm.orange).
      locked_currency: 'XAF',
      ...(LOCK_CHANNEL
        ? { locked_channel: 'cm.mtn', locked_country: 'CM' }
        : {}),
      reference: 'GST-DIAG-' + Date.now(),
      description: 'Diagnostic GesTock (aucun débit : vous ne validez rien)',
    },
    {
      headers: { Authorization: PUBLIC, 'Content-Type': 'application/json' },
      timeout: 20000,
    },
  );
  console.log('✅ HTTP', res.status);
  console.log(JSON.stringify(res.data, null, 2).slice(0, 900));
  console.log('\n🎉 Authentification PUBLIQUE VALIDE → init de paiement OK.');

  // ── Étape 3bis : la page de paiement hébergée est-elle FONCTIONNELLE ? ──
  // On récupère le HTML de `authorization_url` et on vérifie que les méthodes
  // actives du compte (MTN MoMo / Orange Money) y sont bien proposées. C'est le
  // contrôle qui détecte l'incident « Méthode de paiement indisponible ».
  const url = res.data?.authorization_url;
  if (!url) {
    console.log('⚠️  Pas d authorization_url dans la réponse.');
  } else {
    console.log('\n── Étape 3bis : contrôle de la page hébergée ──');
    const page = await axios.get(url, {
      timeout: 20000,
      validateStatus: () => true,
    });
    const html = typeof page.data === 'string' ? page.data : '';
    const hasMtn = html.includes('MTN');
    const hasOrange = html.includes('Orange');
    console.log(`GET ${url.slice(0, 48)}… → HTTP ${page.status}`);
    LOCK_CHANNEL
      ? console.log(
          '⚠️  NOTCHPAY_LOCK_CHANNEL=true → attendez-vous au message « Méthode de paiement indisponible » (incident connu).',
        )
      : null;
    console.log(
      hasMtn && hasOrange
        ? '✅ MTN MoMo ET Orange Money sont proposés → page opérationnelle.'
        : '❌ Méthodes NON listées dans la page → vérifier la couverture du compte.',
    );
  }
} catch (e) {
  console.log('❌ HTTP', e.response?.status ?? '(réseau)');
  console.log(
    JSON.stringify(e.response?.data ?? e.message, null, 2).slice(0, 900),
  );
}
