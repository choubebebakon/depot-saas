import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'src', 'modules');

const SPECIAL_PREFIX = {
  'garage_automobile': 'garage',
  'glacier_snack': 'glacier',
  'salon_beaute': 'salon',
};

const STUB_LOADING = '<div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>';

function extractDataVariable(content) {
  const m = content.match(/const \[(\w+),\s*set\w+\]\s*=\s*useState\s*\(\s*null\s*\)/);
  return m ? m[1] : 'rapport';
}

function extractPeriode(content) {
  const m = content.match(/const \[periode,\s*setPeriode\]\s*=\s*useState\s*\(/);
  return m ? true : false;
}

function getApiPrefix(content) {
  const m = content.match(/api\.(?:get|post)\(['"`]\/([\w-]+)\//);
  return m ? m[1] : null;
}

function getJSX(content) {
  const returnIdx = content.indexOf('\n  return (');
  if (returnIdx < 0) return content.substring(content.lastIndexOf('return ('));
  return content.substring(returnIdx);
}

function getMetierDefault(folder, apiPrefix) {
  for (const [k, v] of Object.entries(SPECIAL_PREFIX)) {
    if (v === apiPrefix && folder.startsWith(k.replace(/_\w+$/, ''))) return k;
  }
  return folder;
}

console.log('🚀 RapportsPage Migration Script\n');

const modules = readdirSync(MODULES_DIR).filter(d => /^\w+$/.test(d) && !d.startsWith('.'));

let total = 0;

for (const moduleFolder of modules) {
  const filePath = join(MODULES_DIR, moduleFolder, 'pages', 'RapportsPage.jsx');
  try {
    const content = readFileSync(filePath, 'utf-8');

    if (content.includes('useData')) {
      console.log(`  ⏭️  ${moduleFolder} — already transformed`);
      continue;
    }

    if (content.includes('depotApi')) {
      console.log(`  ⏭️  ${moduleFolder} — uses depotApi (skip)`);
      continue;
    }

    const apiPrefix = getApiPrefix(content);
    if (!apiPrefix) {
      console.log(`  ⏭️  ${moduleFolder} — no api.get pattern (static data?)`);
      continue;
    }

    const dataVar = extractDataVariable(content);
    const hasPeriode = extractPeriode(content);
    const jsxPart = getJSX(content);
    const metierDefault = getMetierDefault(moduleFolder, apiPrefix);
    const mappedPrefix = SPECIAL_PREFIX[moduleFolder];
    const prefixDecl = mappedPrefix ? `const prefix = '${mappedPrefix}';` : "const prefix = metier.toLowerCase().replace(/_/g, '-');";
    const paramsDecl = hasPeriode ? ', params: { periode }' : '';

    let tjsx = jsxPart;
    tjsx = tjsx.replace(new RegExp(`${dataVar}\\.(?!\\?)`, 'g'), `${dataVar}?.`);

    const newContent = `import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';

export default function RapportsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || '${metierDefault}';
  ${prefixDecl}
  ${hasPeriode ? "const [periode, setPeriode] = useState('MOIS');" : ''}
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  const { data: ${dataVar}, loading, refetch } = useData(\`/\${prefix}/rapports\`, { enabled: true${paramsDecl} });

  if (loading) return ${STUB_LOADING};

${tjsx}`;

    writeFileSync(filePath, newContent);
    console.log(`  ✓ ${moduleFolder} — ${dataVar}, periode=${hasPeriode}, prefix=${apiPrefix}`);
    total++;
  } catch {
    // No RapportsPage in this module
  }
}

console.log(`\n✅ Done. ${total} RapportsPage migrated.`);
