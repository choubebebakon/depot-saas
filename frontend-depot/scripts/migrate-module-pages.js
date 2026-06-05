import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'src', 'modules');
const BACKUP_DIR = join(__dirname, '..', 'src', '.backup-pages');

const CRUD_PAGE_NAMES = new Set([
  'VentesPage', 'StockPage', 'ClientsPage', 'FournisseursPage',
  'PersonnelPage', 'DepensesPage', 'ProduitsPage', 'CategoriesPage',
  'PromotionsPage', 'RecettesPage', 'TablesPage', 'MenuPage',
  'ServicesPage', 'PrestationsPage', 'AbonnementsPage', 'FidelitePage',
  'ReceptionsPage', 'RetoursPage', 'LotsPage', 'ChantiersPage',
  'VehiculesPage', 'ChauffeursPage', 'FlottePage', 'ColisPage',
  'LivraisonsPage', 'TourneesPage', 'DevisPage', 'FacturesPage',
  'LocatairesPage', 'BiensPage', 'LoyersPage', 'ContratsPage',
  'InterventionsPage', 'VisitesPage', 'PatientsPage', 'MedecinsPage',
  'MedicamentsPage', 'OrdonnancesPage', 'PrescriptionsPage',
  'ConsultationsPage', 'ReservationsPage', 'ChambresPage', 'MenagePage',
  'CommandesPage', 'ProductionPage', 'RechargesPage',
  'TelephonesPage', 'AccessoiresPage', 'ReparationsPage',
  'AlertesDlcPage', 'AlimentationPage', 'TroupeauxPage',
  'ReproductionPage', 'SantePage', 'EvenementsPage',
  'AgendaPage', 'CalendrierPage', 'TicketsPage',
  'CataloguePage', 'ConsignesPage', 'UtilisateursPage',
  'StockArticlesPage', 'PiecesStockPage', 'InventairePage',
  'FacturationPage', 'DocumentsPage', 'SuiviTourneesPage',
  'WholesalersPage',
]);

const API_PREFIX_MAP = {
  'garage_automobile': 'garage',
  'glacier_snack': 'glacier_snack',
  'salon_beaute': 'salon',
};

function getModuleSlug(folder) {
  return API_PREFIX_MAP[folder] || folder.replace(/_/g, '-');
}

function extractInfo(content, moduleSlug) {
  const r = {};

  // Resource name from api.get('/module-slug/resource', ...)
  const apiRe = new RegExp(`api\\.(?:get|post|delete|patch)\\([\`'"]\\/${moduleSlug}\\/([^\`'")\\s?]+)`, 'i');
  const apiMatch = content.match(apiRe);
  r.resource = apiMatch ? apiMatch[1].replace(/[`'"\s]/g, '').split('?')[0].split('/')[0] : null;

  // Data variable name (first useState([]))
  const usMatch = content.match(/const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\s*\(\s*\[\s*\]/);
  r.varName = usMatch ? usMatch[1] : 'items';

  r.hasFormModal = content.includes('FormModal');
  r.hasConfirmModal = content.includes('ConfirmModal');
  r.hasSubmit = content.includes('handleSubmit');
  r.hasDelete = content.includes('handleDelete');
  r.hasOpenEdit = content.includes('openEdit');
  r.hasToggle = content.includes('handleToggle');
  r.hasUsePerm = content.includes('usePermission');
  r.hasNotifState = content.includes('const [notif, setNotif]');

  // Form imports
  r.extraImports = [];
  const allImports = content.match(/^import .+$/gm) || [];
  const skipPrefixes = ['react', 'react-router-dom', './hooks/', '../hooks/', '../../hooks/',
    './context/', '../context/', '../../context/', '../api/', './api/',
    './shared/', '../shared/', '../../shared/'];
  for (const line of allImports) {
    let skip = false;
    for (const p of skipPrefixes) { if (line.includes(`from '${p}`) || line.includes(`from "${p}`)) { skip = true; break; } }
    if (!skip && !line.includes('FormModal') && !line.includes('ConfirmModal') && !line.includes('usePermission') && !line.includes('PERMISSIONS')) {
      // Check if it's a form import from ../forms/ or ../../../shared/forms/
      if (/from ['"]\.\.\/forms\//.test(line) || /from ['"]\.\.\/\.\.\/\.\.\/shared\/forms\//.test(line)) {
        r.customForm = line;
      } else if (!/from ['"].*\/api/.test(line)) {
        r.extraImports.push(line);
      }
    }
  }

  // perm line
  const permMatch = content.match(/const perm = usePermission\([^;]+;/);
  r.permLine = permMatch ? permMatch[0] : null;

  // Form default for inline FormModal
  r.formDefault = '{}';
  if (r.hasFormModal) {
    const fm = content.match(/const\s+\[form,\s*setForm\]\s*=\s*useState\s*\(\s*(\{[^}]+\})\s*\)/);
    if (fm) r.formDefault = fm[1];
  }

  r.hasEditItemRef = content.includes('setEditItem') || content.includes('editItem');

  return r;
}

function isAlreadyTransformed(content) {
  return /from ['"]\.\.\/\.\.\/hooks\/useData['"]/.test(content) ||
         /from ['"]\.\.\/\.\.\/\.\.\/hooks\/useData['"]/.test(content);
}

function isCrudPattern(content) {
  if (content.includes('useCallback') && content.includes('useEffect') && content.includes('setLoading')) return true;
  if (content.includes('useEffect') && /api\.(?:get|post)/.test(content)) return true;
  return false;
}

function buildNewPage(filename, content, moduleFolder, info) {
  const pageName = filename.replace(/\.jsx?$/, '');
  const depth = '../../../';
  const { resource, varName, hasFormModal, hasConfirmModal,
          hasSubmit, hasDelete, hasOpenEdit, hasToggle,
          hasUsePerm, hasNotifState, permLine, formDefault,
          hasEditItemRef, customForm, extraImports } = info;

  // ---- Imports ----
  let imports = `import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '${depth}hooks/useData';
import { useNotif } from '${depth}context/NotifContext';
import { useAuth } from '${depth}contexts/AuthContext';
import api from '${depth}api/axios';`;

  if (hasFormModal) imports += `\nimport FormModal from '${depth}shared/components/forms/FormModal';`;
  if (hasConfirmModal) imports += `\nimport ConfirmModal from '${depth}shared/components/forms/ConfirmModal';`;
  if (hasUsePerm) {
    imports += `\nimport { usePermission } from '${depth}shared/hooks/usePermission';`;
    const permImport = content.match(/import\s+\{ PERMISSIONS \}\s+from\s+['"](.+?)['"]/);
    if (permImport) imports += `\nimport { PERMISSIONS } from '${permImport[1]}';`;
  }
  if (customForm) imports += `\n${customForm}`;
  for (const ei of extraImports) imports += `\n${ei}`;

  // ---- States ----
  let states = '';
  const s = (decl) => { states += `  ${decl}\n`; };
  if (content.includes('const [search,')) s("const [search, setSearch] = useState('');");
  if (content.includes('const [formOpen,')) s('const [formOpen, setFormOpen] = useState(false);');
  if (hasEditItemRef) s('const [editItem, setEditItem] = useState(null);');
  if (content.includes('const [confirmDelete,')) s('const [confirmDelete, setConfirmDelete] = useState(null);');
  if (content.includes('const [form, setForm]')) s(`const [form, setForm] = useState(${formDefault});`);
  if (content.includes('const [editForm,')) s('const [editForm, setEditForm] = useState({});');
  s('const [deleting, setDeleting] = useState(false);');

  // ---- Body ----
  let body = `\n  const { success, error: notifError } = useNotif();\n`;

  if (hasUsePerm && permLine) {
    body += `\n  ${permLine}\n`;
  }

  body += `\n  const {
    data: ${varName} = [],
    loading,
    refetch,
  } = useData(\`/\${prefix}/${resource}\`, { enabled: true });\n\n`;

  if (hasDelete) {
    const idRef = content.includes('confirmDelete.id') ? 'confirmDelete.id' : 'confirmDelete';
    body += `  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(\`/\${prefix}/${resource}/\${${idRef}}\`);
      setConfirmDelete(null);
      success('Élément supprimé');
      refetch();
    } catch {
      notifError('Erreur lors de la suppression', 'Échec');
    } finally {
      setDeleting(false);
    }
  };
`;
  }

  if (hasSubmit) {
    body += `  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.patch(\`/\${prefix}/${resource}/\${editItem.id}\`, form);
      } else {
        await api.post(\`/\${prefix}/${resource}\`, form);
      }
      setFormOpen(false);
      setEditItem(null);
      success(editItem ? 'Élément modifié' : 'Élément créé');
      refetch();
    } catch {
      notifError("Erreur lors de l'enregistrement", 'Échec');
    }
  };
`;
  }

  if (hasOpenEdit) {
    body += `  const openEdit = (item) => {
    setEditItem(item);
    setForm(item);
    setFormOpen(true);
  };
`;
  }

  if (hasToggle) {
    body += `  const handleToggle = async (item) => {
    try {
      await api.patch(\`/\${prefix}/${resource}/\${item.id}\`, { actif: !item.actif });
      success(item.actif ? 'Désactivé' : 'Activé');
      refetch();
    } catch {
      notifError('Erreur lors de la modification', 'Échec');
    }
  };
`;
  }

  // ---- Assemble function body (ends with return statement) ----
  const mappedPrefix = API_PREFIX_MAP[moduleFolder];
  const prefixDecl = mappedPrefix
    ? `  const prefix = '${mappedPrefix}';`
    : `  const prefix = metier.toLowerCase().replace(/_/g, '-');`;
  const funcBody = `export default function ${pageName}() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || '${moduleFolder}';
${prefixDecl}

${states}${body}`;

  return imports + '\n\n' + funcBody;
}

// ---- JSX transforms ----
function transformReturnJsx(jsx, info) {
  let r = jsx;

  // Remove any stray } right before return (
  r = r.replace(/^\s*\}\s*\n\s*return\s*\(/, '\n  return (');

  // showNotif -> success
  r = r.replace(/showNotif\(/g, 'success(');

  // alert(...) -> notifError(...)
  r = r.replace(/alert\(('|")(.+?)\1\)/g, "notifError($1$2$1, 'Échec')");

  // window.confirm -> true
  r = r.replace(/window\.confirm\([^)]+\)/g, 'true');

  // window.location.reload() -> refetch()
  r = r.replace(/window\.location\.reload\(\)/g, 'refetch()');

  // metier="hardcoded" -> metier={prefix}
  r = r.replace(/metier=["']\w+["']/g, 'metier={prefix}');

  // onSuccess={load} -> onSuccess={refetch}
  r = r.replace(/onSuccess=\{load\}/g, 'onSuccess={refetch}');

  // load() -> refetch()
  r = r.replace(/\bload\(\)/g, 'refetch()');

  // Remove notif toast divs
  r = r.replace(/\{notif\s*&&[\s\S]*?setTimeout[^}]*\}\s*/g, '');

  // {total} -> {varName.length}
  r = r.replace(/\{total\}/g, `{${info.varName}.length}`);

  return r;
}

// ---- Main ----
console.log('🚀 Module Pages Migration Script\n');
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

const modules = readdirSync(MODULES_DIR).filter(d =>
  existsSync(join(MODULES_DIR, d, 'pages'))
);
console.log(`Found ${modules.length} modules with pages\n`);

for (const moduleFolder of modules) {
  const pagesPath = join(MODULES_DIR, moduleFolder, 'pages');
  const files = readdirSync(pagesPath).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
  console.log(`\n📁 ${moduleFolder} (${files.length} pages)`);

  for (const file of files) {
    const filePath = join(pagesPath, file);
    const content = readFileSync(filePath, 'utf-8');
    const pageName = file.replace(/\.jsx?$/, '');
    const moduleSlug = getModuleSlug(moduleFolder);

    if (!CRUD_PAGE_NAMES.has(pageName)) {
      console.log(`  ⏭️  ${file} — not in CRUD list`);
      continue;
    }
    if (isAlreadyTransformed(content)) {
      console.log(`  ✅ ${file} — already transformed`);
      continue;
    }
    if (!isCrudPattern(content)) {
      console.log(`  ⏭️  ${file} — not a CRUD pattern`);
      continue;
    }

    const info = extractInfo(content, moduleSlug);
    if (!info.resource) {
      console.log(`  ⚠️  ${file} — could not detect resource`);
      continue;
    }

    // Backup
    const backDir = join(BACKUP_DIR, moduleFolder, 'pages');
    if (!existsSync(backDir)) mkdirSync(backDir, { recursive: true });
    writeFileSync(join(backDir, file), content);

    try {
      // Strategy: split at the first `export default function`
      // 1. Find the opening { of the function body
      const funcMatch = content.match(/export default function \w+\(\)\s*\{/);
      if (!funcMatch) { console.log(`  ⚠️  ${file} — cannot find function`); continue; }

      const funcStart = funcMatch.index + funcMatch[0].length; // position after the opening {
      const beforeFunc = content.substring(0, funcMatch.index); // anything before export default (unused)
      const afterBrace = content.substring(funcStart); // function body + closing

      // 2. Find the `return (` statement within the function body
      const returnMatch = afterBrace.match(/\n\s*return\s*\(/);
      if (!returnMatch) { console.log(`  ⚠️  ${file} — no return (}`); continue; }

      const returnIdx = afterBrace.indexOf(returnMatch[0]);
      const jsxPart = afterBrace.substring(returnIdx); // from return ( to end

      const transformedJsx = transformReturnJsx(jsxPart, info);
      const newTop = buildNewPage(file, content, moduleFolder, info);

      // The newTop already includes the function signature up to the body
      // The transformedJsx starts with return ( and includes the closing };
      const result = newTop + '\n' + transformedJsx;

      writeFileSync(filePath, result);
      console.log(`  ✓ ${file} — (${info.resource}, ${info.varName})`);
    } catch (err) {
      console.error(`  ❌ ${file} — ${err.message}`);
      writeFileSync(filePath, content);
    }
  }
}

console.log('\n✅ Done.');
