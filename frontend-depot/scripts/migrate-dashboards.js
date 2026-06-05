import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'src', 'modules');

const STUB_LOADING = '<div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>';

const SPECIAL_PREFIX = {
  'garage_automobile': 'garage',
  'glacier_snack': 'glacier',
  'salon_beaute': 'salon',
};

function getMetierDefault(folder) {
  return folder;
}

function extractJsxAfterLoading(content) {
  const returnIdx = content.lastIndexOf('return (');
  if (returnIdx < 0) return null;
  return content.substring(returnIdx);
}

function transformJSX(jsx) {
  const knownProps = [
    'productionJour', 'ventesJour', 'stockCritique', 'invendus', 'ventesMois', 'boulangers',
    'caJour', 'caMois', 'ventesJour', 'clientsJour', 'produitsJour', 'commandesJour',
    'chiffreAffaires', 'transactionCount', 'stockAlerte', 'promosActives',
    'caJourFormate', 'caMoisFormate', 'ventesAujourdhui', 'clientsAujourdhui',
    'produitsAjoutes', 'rendezVousJour', 'consultationsJour', 'patientsJour',
    'medecinsActifs', 'interventionsJour', 'biensDisponibles', 'locatairesActifs',
    'loyersMois', 'tauxOccupation', 'colisJour', 'livraisonsJour', 'chauffeursActifs',
    'rechargesJour', 'reparationsJour', 'telephonesStock', 'accessoiresStock',
    'commandesJour', 'servicesJour', 'mouvementsJour', 'piecesStock', 'ordresOuverts',
    'evenementsJour', 'naissancesMois', 'stockAliment', 'troupeaux', 'animaux',
    'productionsJour', 'ventesLivre', 'marges', 'stockFaible', 'topVentes',
    'reservationsJour', 'arriveesJour', 'departsJour', 'menagesJour',
    'patientsJour', 'consultationsJour', 'hospitalisationsJour',
    'produitsSoin', 'servicesJour', 'abonnesActifs',
  ];
  let r = jsx;
  for (const prop of knownProps) {
    const re = new RegExp(`(?<!\\.)(stats\\.${prop})(?!\\?)`, 'g');
    r = r.replace(re, `stats?.${prop}`);
  }
  return r;
}

console.log('🚀 Dashboard Migration Script\n');

const modules = readdirSync(MODULES_DIR).filter(d =>
  /^\w+$/.test(d) && !d.startsWith('.')
);

let total = 0;

for (const moduleFolder of modules) {
  const pagesPath = join(MODULES_DIR, moduleFolder, 'pages');
  let files;
  try { files = readdirSync(pagesPath).filter(f => f.startsWith('Dashboard') && (f.endsWith('.jsx') || f.endsWith('.js'))); }
  catch { continue; }

  for (const file of files) {
    const filePath = join(pagesPath, file);
    let content = readFileSync(filePath, 'utf-8');

    // Skip if already transformed
    if (content.includes('useData')) {
      console.log(`  ⏭️  ${moduleFolder}/${file} — already transformed`);
      continue;
    }

    // Skip if uses depotApi (depot-boissons)
    if (content.includes('depotApi')) {
      console.log(`  ⏭️  ${moduleFolder}/${file} — uses depotApi (skip)`);
      continue;
    }

    // Extract prefix from api.get('/X/stats')
    const apiMatch = content.match(/api\.get\('(?:["'])?\/([\w-]+)\/stats/);
    if (!apiMatch) {
      console.log(`  ⏭️  ${moduleFolder}/${file} — no api.get stats pattern`);
      continue;
    }

    const apiPrefix = apiMatch[1];
    const metierDefault = getMetierDefault(moduleFolder);
    const metierPrefix = SPECIAL_PREFIX[moduleFolder];

    // Extract JSX part (everything after the data-loading useEffect)
    const jsxPart = extractJsxAfterLoading(content);
    if (!jsxPart) {
      console.log(`  ⚠️  ${moduleFolder}/${file} — cannot find return (`);
      continue;
    }

    const tjsx = transformJSX(jsxPart);
    const pageName = file.replace(/\.(jsx|js)$/, '');

    const newContent = `import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { useAuth } from '../../../contexts/AuthContext';

export default function ${pageName}() {
  const navigate = useNavigate();
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || '${metierDefault}';
  const prefix = ${metierPrefix ? `'${metierPrefix}'` : "metier.toLowerCase().replace(/_/g, '-')"};
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  const { data: stats, loading } = useData(\`/\${prefix}/stats\`, { enabled: true });

  if (loading) return ${STUB_LOADING};

${tjsx}`;

    writeFileSync(filePath, newContent);
    console.log(`  ✓ ${moduleFolder}/${file} — prefix=${apiPrefix}`);
    total++;
  }
}

console.log(`\n✅ Done. ${total} dashboards migrated.`);
