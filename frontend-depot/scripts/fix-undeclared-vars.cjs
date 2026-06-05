const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.resolve(__dirname, '../src/modules');

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else if (entry.isFile() && entry.name.endsWith('.jsx')) files.push(full);
  }
  return files;
}

// ---------------------------------------------------------------------------
// Check if a variable is already declared in the component
// ---------------------------------------------------------------------------

function isDeclared(source, varName) {
  // Check various declaration patterns ONLY (not JSX usage)
  const patterns = [
    new RegExp(`const\\s+\\[\\s*${varName}\\s*,`),             // const [var, setVar] = useState
    new RegExp(`const\\s+\\[\\s*,\\s*${varName}\\s*\\]`),      // const [, var] = useXxx
    new RegExp(`const\\s+${varName}\\s*=`),                      // const var =
    new RegExp(`let\\s+${varName}\\s*=`),                        // let var =
    new RegExp(`var\\s+${varName}\\s*=`),                        // var var =
    new RegExp(`function\\s+${varName}\\s*\\(`),                 // function var(
    new RegExp(`\\bimport\\s+\\{[^}]*\\b${varName}\\b`),        // import { var }
    new RegExp(`\\bimport\\s+${varName}\\b`),                    // import var
  ];
  if (patterns.some(p => p.test(source))) return true;

  // Check destructured function parameter: function Xxx({ ..., varName, ... })
  // Must match param destructuring specifically, not JSX {varName}
  const paramPattern = new RegExp(
    `export\\s+default\\s+function\\s+\\w+\\s*\\(\\s*\\{[^}]*\\b${varName}\\b[^}]*\\}\\s*\\)`
  );
  if (paramPattern.test(source)) return true;

  // Check hook destructuring: const { ... varName ... } = useXxx(
  const hookPattern = new RegExp(
    `const\\s+\\{[^}]*\\b${varName}\\b[^}]*\\}\\s*=\\s*use(?:State|Data|Pagination|Notif|Auth|Permission)\\s*\\(`
  );
  if (hookPattern.test(source)) return true;

  return false;
}

function hasPropGuard(source, varName) {
  // Check if var is a destructured prop: function Xxx({ ..., varName, ... })
  // Also check if it appears in a function parameter list that looks like props
  const propPattern = new RegExp(`\\(\\s*\\{[^}]*\\b${varName}\\b[^}]*\\}\\s*\\)`);
  return propPattern.test(source);
}

function has(source, pattern) {
  return pattern.test(source);
}

// ---------------------------------------------------------------------------
// Safe variable usage checks - make sure var is used as bare identifier
// not as object property or in other contexts
// ---------------------------------------------------------------------------

function isUsedAsBareVar(source, varName) {
  // Check that varName appears as a standalone identifier, not as obj.varName
  // Positive: {total && ...}  {setFiltreStatut(e...)}  onClick={openCreate}
  // NOT positive: item.total  item.type  data.totalItems
  const barePattern = new RegExp(
    `(?:` +
    `\\{[\\s,]*${varName}\\b|` +                         // {varName or {varName, 
    `[=(,:!]\\s*${varName}\\s*[=})\\],&|]|` +            // =varName / (varName) / ,varName
    `\\b${varName}\\s*\\(|` +                             // varName(
    `\\[\\s*${varName}\\s*\\]|` +                          // [varName]
    `\\b${varName}\\s*[.][a-z]` +                          // varName.prop (is used, not defined)
    `\\b(?:set)?${varName}\\s*[=+]` +                      // varName = / varName +=
    `)` 
  );
  return barePattern.test(source);
}

// ---------------------------------------------------------------------------
// Collect all variable names already used in the file
// ---------------------------------------------------------------------------

function getDeclaredVarNames(source) {
  const names = new Set();
  // useState destructuring: const [varName, setVarName] = useState(
  const useStateMatches = source.matchAll(/const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*useState/g);
  for (const m of useStateMatches) {
    names.add(m[1]);
    names.add(m[2]);
  }
  // useRef, useMemo, etc. returning destructured: const { varName } = useXxx(
  const destructureMatches = source.matchAll(/const\s+\{\s*([^}]+)\s*\}\s*=\s*(?:use|import)/g);
  for (const m of destructureMatches) {
    const inner = m[1].split(',');
    for (const v of inner) {
      const trimmed = v.trim().split(':')[0].trim(); // handle aliases: { x: y }
      if (trimmed) names.add(trimmed);
    }
  }
  // Simple const declarations
  const constMatches = source.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g);
  for (const m of constMatches) {
    names.add(m[1]);
  }
  // Function parameters (component props)
  const paramMatches = source.matchAll(/export\s+default\s+function\s+\w+\s*\(\s*\{([^}]+)\}\s*\)/g);
  for (const m of paramMatches) {
    const inner = m[1].split(',');
    for (const v of inner) {
      const trimmed = v.trim().split(':')[0].trim().split('=')[0].trim();
      if (trimmed) names.add(trimmed);
    }
  }
  // Also match implicit React hook returns (usePagination, useData, etc.)
  // These return objects that are destructured, already handled above
  return names;
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

const ALL_RULES = {
  // --- MODALS ---
  showModal: { type: 'bool', decl: "const [showModal, setShowModal] = useState(false);" },
  setShowModal: null, // skip, comes with showModal
  showForm: { type: 'bool', decl: "const [showForm, setShowForm] = useState(false);" },
  setShowForm: null,
  showConfirm: { type: 'bool', decl: "const [showConfirm, setShowConfirm] = useState(false);" },
  setShowConfirm: null,
  isOpen: { type: 'bool', decl: "const [isOpen, setIsOpen] = useState(false);" },
  setIsOpen: null,
  formOpen: { type: 'bool', decl: "const [formOpen, setFormOpen] = useState(false);" },
  setFormOpen: null,
  modalData: { type: 'nullable', decl: "const [modalData, setModalData] = useState(null);" },
  setModalData: null,
  openCreate: { type: 'fn', decl: "const openCreate = () => { setEditItem(null); setFormOpen(true); };" },
  openEdit: { type: 'fn', decl: "const openEdit = (item) => { setEditItem(item); setFormOpen(true); };" },

  // --- FORM ---
  formLoading: { type: 'bool', decl: "const [formLoading, setFormLoading] = useState(false);" },
  setFormLoading: null,
  formErrors: { type: 'obj', decl: "const [formErrors, setFormErrors] = useState({});" },
  setFormErrors: null,
  formData: { type: 'obj', decl: "const [formData, setFormData] = useState({});" },
  setFormData: null,
  formMotif: { type: 'str', decl: "const [formMotif, setFormMotif] = useState('');" },
  setFormMotif: null,
  setFormField: { type: 'fn', decl: "const setFormField = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));" },

  // --- EDIT / DELETE ---
  editItem: { type: 'nullable', decl: "const [editItem, setEditItem] = useState(null);" },
  setEditItem: null,
  edit: { type: 'nullable', decl: "const [edit, setEdit] = useState(null);" },
  setEdit: null,
  confirmDelete: { type: 'nullable', decl: "const [confirmDelete, setConfirmDelete] = useState(null);" },
  setConfirmDelete: null,
  confirmValidate: { type: 'nullable', decl: "const [confirmValidate, setConfirmValidate] = useState(null);" },
  setConfirmValidate: null,
  selectedId: { type: 'nullable', decl: "const [selectedId, setSelectedId] = useState(null);" },
  setSelectedId: null,
  selectedItem: { type: 'nullable', decl: "const [selectedItem, setSelectedItem] = useState(null);" },
  setSelectedItem: null,

  // --- MODULE-SPECIFIC MODALS ---
  checkInOpen: { type: 'bool', decl: "const [checkInOpen, setCheckInOpen] = useState(false);" },
  setCheckInOpen: null,
  checkInReservation: { type: 'nullable', decl: "const [checkInReservation, setCheckInReservation] = useState(null);" },
  setCheckInReservation: null,
  checkOutOpen: { type: 'bool', decl: "const [checkOutOpen, setCheckOutOpen] = useState(false);" },
  setCheckOutOpen: null,
  checkOutReservation: { type: 'nullable', decl: "const [checkOutReservation, setCheckOutReservation] = useState(null);" },
  setCheckOutReservation: null,
  typeChambreOpen: { type: 'bool', decl: "const [typeChambreOpen, setTypeChambreOpen] = useState(false);" },
  setTypeChambreOpen: null,
  consoOpen: { type: 'bool', decl: "const [consoOpen, setConsoOpen] = useState(false);" },
  setConsoOpen: null,
  consoReservation: { type: 'nullable', decl: "const [consoReservation, setConsoReservation] = useState(null);" },
  setConsoReservation: null,
  menuJourOpen: { type: 'bool', decl: "const [menuJourOpen, setMenuJourOpen] = useState(false);" },
  setMenuJourOpen: null,
  encaissementOpen: { type: 'bool', decl: "const [encaissementOpen, setEncaissementOpen] = useState(false);" },
  setEncaissementOpen: null,
  encaissementRDV: { type: 'nullable', decl: "const [encaissementRDV, setEncaissementRDV] = useState(null);" },
  setEncaissementRDV: null,
  deliveryOpen: { type: 'bool', decl: "const [deliveryOpen, setDeliveryOpen] = useState(false);" },
  setDeliveryOpen: null,
  deliveryLigne: { type: 'nullable', decl: "const [deliveryLigne, setDeliveryLigne] = useState(null);" },
  setDeliveryLigne: null,
  deliveryLignes: { type: 'arr', decl: "const [deliveryLignes, setDeliveryLignes] = useState([]);" },
  setDeliveryLignes: null,
  dossierOpen: { type: 'bool', decl: "const [dossierOpen, setDossierOpen] = useState(false);" },
  setDossierOpen: null,
  dossierPatient: { type: 'nullable', decl: "const [dossierPatient, setDossierPatient] = useState(null);" },
  setDossierPatient: null,
  retraitOpen: { type: 'bool', decl: "const [retraitOpen, setRetraitOpen] = useState(false);" },
  setRetraitOpen: null,
  retraitTicket: { type: 'nullable', decl: "const [retraitTicket, setRetraitTicket] = useState(null);" },
  setRetraitTicket: null,
  evenementElevageOpen: { type: 'bool', decl: "const [evenementElevageOpen, setEvenementElevageOpen] = useState(false);" },
  setEvenementElevageOpen: null,
  vaccinationOpen: { type: 'bool', decl: "const [vaccinationOpen, setVaccinationOpen] = useState(false);" },
  setVaccinationOpen: null,
  openDelivery: { type: 'bool', decl: "const [openDelivery, setOpenDelivery] = useState(false);" },
  setOpenDelivery: null,

  // --- SAVING / DELETING / SUBMITTING ---
  saving: { type: 'bool', decl: "const [saving, setSaving] = useState(false);" },
  setSaving: null,
  deleting: { type: 'bool', decl: "const [deleting, setDeleting] = useState(false);" },
  setDeleting: null,
  submitting: { type: 'bool', decl: "const [submitting, setSubmitting] = useState(false);" },
  setSubmitting: null,

  // --- SEARCH ---
  search: { type: 'str', decl: "const [search, setSearch] = useState('');" },
  setSearch: null,

  // --- PAGINATION (only if usePagination not used) ---
  page: { type: 'num', decl: "const [page, setPage] = useState(1);", guard: 'noPagination' },
  setPage: null,

  // --- NOTIFICATIONS ---
  notif: { type: 'nullable', decl: "const [notif, setNotif] = useState(null);" },
  setNotif: null,
  alertMsg: { type: 'nullable', decl: "const [alertMsg, setAlertMsg] = useState(null);" },
  setAlertMsg: null,
  toastMsg: { type: 'nullable', decl: "const [toastMsg, setToastMsg] = useState(null);" },
  setToastMsg: null,

  // --- CALENDAR ---
  selectedDate: { type: 'nullable', decl: "const [selectedDate, setSelectedDate] = useState(null);" },
  setSelectedDate: null,
  month: { type: 'num', decl: "const [month, setMonth] = useState(new Date().getMonth());" },
  setMonth: null,
  year: { type: 'num', decl: "const [year, setYear] = useState(new Date().getFullYear());" },
  setYear: null,
  today: { type: 'val', decl: "const today = new Date();" },

  // --- ACTIVE TAB / EXPANDED ---
  activeTab: { type: 'num', decl: "const [activeTab, setActiveTab] = useState(0);" },
  setActiveTab: null,
  expanded: { type: 'nullable', decl: "const [expanded, setExpanded] = useState(null);" },
  setExpanded: null,

  // --- STOCK SPECIFIC ---
  edits: { type: 'obj', decl: "const [edits, setEdits] = useState({});" },
  setEdits: null,
  dateInventaire: { type: 'str', decl: "const [dateInventaire, setDateInventaire] = useState('');" },
  setDateInventaire: null,

  // --- FILTERS ---
  catFiltre: { type: 'str', decl: "const [catFiltre, setCatFiltre] = useState('');" },
  setCatFiltre: null,
  filtreCat: { type: 'str', decl: "const [filtreCat, setFiltreCat] = useState('');" },
  setFiltreCat: null,
  filtreStatut: { type: 'str', decl: "const [filtreStatut, setFiltreStatut] = useState('');" },
  setFiltreStatut: null,
  filtreType: { type: 'str', decl: "const [filtreType, setFiltreType] = useState('');" },
  setFiltreType: null,
  filtreCategorie: { type: 'str', decl: "const [filtreCategorie, setFiltreCategorie] = useState('');" },
  setFiltreCategorie: null,
  filtreOperateur: { type: 'str', decl: "const [filtreOperateur, setFiltreOperateur] = useState('');" },
  setFiltreOperateur: null,
  filtreMarque: { type: 'str', decl: "const [filtreMarque, setFiltreMarque] = useState('');" },
  setFiltreMarque: null,
  filtreFonction: { type: 'str', decl: "const [filtreFonction, setFiltreFonction] = useState('');" },
  setFiltreFonction: null,
  filtreEspece: { type: 'str', decl: "const [filtreEspece, setFiltreEspece] = useState('');" },
  setFiltreEspece: null,
  filtreFamille: { type: 'str', decl: "const [filtreFamille, setFiltreFamille] = useState('');" },
  setFiltreFamille: null,
  filtreSpecialite: { type: 'str', decl: "const [filtreSpecialite, setFiltreSpecialite] = useState('');" },
  setFiltreSpecialite: null,
  filtreDate: { type: 'str', decl: "const [filtreDate, setFiltreDate] = useState('');" },
  setFiltreDate: null,
  dateDebut: { type: 'str', decl: "const [dateDebut, setDateDebut] = useState('');" },
  setDateDebut: null,
  dateFin: { type: 'str', decl: "const [dateFin, setDateFin] = useState('');" },
  setDateFin: null,
  rayonFiltre: { type: 'str', decl: "const [rayonFiltre, setRayonFiltre] = useState('');" },
  setRayonFiltre: null,
  familleFiltre: { type: 'str', decl: "const [familleFiltre, setFamilleFiltre] = useState('');" },
  setFamilleFiltre: null,
  ordonnanceFiltre: { type: 'str', decl: "const [ordonnanceFiltre, setOrdonnanceFiltre] = useState('');" },
  setOrdonnanceFiltre: null,
  filtre: { type: 'str', decl: "const [filtre, setFiltre] = useState('');" },
  setFiltre: null,

  // --- COMPUTED ---
  totalCA: { type: 'computed', decl: "const totalCA = items.reduce((acc, i) => acc + (i.montant || 0), 0);" },
  totalDepenses: { type: 'computed', decl: "const totalDepenses = items.reduce((acc, i) => acc + (i.montant || 0), 0);" },
  totalFacture: { type: 'computed', decl: "const totalFacture = items.reduce((acc, i) => acc + (i.total || i.montant || 0), 0);" },
  totalValeur: { type: 'computed', decl: "const totalValeur = items.reduce((acc, i) => acc + (i.valeurStock || i.valeur || i.quantite * i.prix || 0), 0);" },
  totalFiltre: { type: 'computed', decl: "const totalFiltre = filtres.reduce((acc, i) => acc + (i.montant || 0), 0);" },
  cards: { type: 'computed', decl: "const cards = [];" },
  valueStock: { type: 'computed', decl: "const valueStock = items.reduce((acc, i) => acc + (i.prixVente || i.prix || 0) * (i.quantite || 0), 0);" },
  ruptureCount: { type: 'computed', decl: "const ruptureCount = items.filter(i => (i.quantite || 0) === 0).length;" },
  faibleCount: { type: 'computed', decl: "const faibleCount = items.filter(i => (i.quantite || 0) > 0 && (i.quantite || 0) <= (i.seuil || 5)).length;" },
  expireCount: { type: 'computed', decl: "const expireCount = items.filter(i => i.datePeremption && new Date(i.datePeremption) < new Date()).length;" },
  expirees: { type: 'computed', decl: "const expirees = items.filter(i => i.datePeremption && new Date(i.datePeremption) < new Date());" },
  urgentes: { type: 'computed', decl: "const urgentes = items.filter(i => i.datePeremption && new Date(i.datePeremption) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && new Date(i.datePeremption) >= new Date());" },
  bientot: { type: 'computed', decl: "const bientot = items.filter(i => i.datePeremption && new Date(i.datePeremption) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(i.datePeremption) >= new Date());" },
  estAlerte: { type: 'computed', decl: "const estAlerte = (item) => item.quantite <= (item.seuil || 5);" },

  // --- CONSTANTS ---
  CATEGORIES: { type: 'constArr', decl: "const CATEGORIES = [];" },
  CATEGORIES_DEP: { type: 'constArr', decl: "const CATEGORIES_DEP = [];" },
  CATEGORIES_STOCK: { type: 'constArr', decl: "const CATEGORIES_STOCK = [];" },
  CAT_COLORS: { type: 'constObj', decl: "const CAT_COLORS = {};" },
  STATUS_COLOR: { type: 'constObj', decl: "const STATUS_COLOR = {};" },
  STATUS_MAP: { type: 'constObj', decl: "const STATUS_MAP = {};" },
  STATUT_COLOR: { type: 'constObj', decl: "const STATUT_COLOR = {};" },
  STATUT_MAP: { type: 'constObj', decl: "const STATUT_MAP = {};" },
  STATUTS: { type: 'constArr', decl: "const STATUTS = [];" },
  STATUTS_CHAMBRE: { type: 'constArr', decl: "const STATUTS_CHAMBRE = [];" },
  STATUTS_CHANTIER: { type: 'constArr', decl: "const STATUTS_CHANTIER = [];" },
  STATUTS_MENAGE: { type: 'constArr', decl: "const STATUTS_MENAGE = [];" },
  STATUTS_REP: { type: 'constArr', decl: "const STATUTS_REP = [];" },
  STATUTS_RESERVATION: { type: 'constArr', decl: "const STATUTS_RESERVATION = [];" },
  TYPES_ACCESSOIRE: { type: 'constArr', decl: "const TYPES_ACCESSOIRE = [];" },
  TYPES_ALIM: { type: 'constArr', decl: "const TYPES_ALIM = [];" },
  TYPES_CHAMBRE: { type: 'constArr', decl: "const TYPES_CHAMBRE = [];" },
  TYPES_EVT: { type: 'constArr', decl: "const TYPES_EVT = [];" },
  TYPES_SERVICE: { type: 'constArr', decl: "const TYPES_SERVICE = [];" },
  TYPES_VENTE: { type: 'constArr', decl: "const TYPES_VENTE = [];" },
  UNITES: { type: 'constArr', decl: "const UNITES = [];" },
  FAMILLES: { type: 'constArr', decl: "const FAMILLES = [];" },
  FAMILLES_MEDICAMENTS: { type: 'constArr', decl: "const FAMILLES_MEDICAMENTS = [];" },
  MARQUES: { type: 'constArr', decl: "const MARQUES = [];" },
  OPERATEURS: { type: 'constArr', decl: "const OPERATEURS = [];" },
  SPECIALITES: { type: 'constArr', decl: "const SPECIALITES = [];" },
  FONCTIONS: { type: 'constArr', decl: "const FONCTIONS = [];" },
  ESPECES: { type: 'constArr', decl: "const ESPECES = [];" },
  MOTIFS_RETOUR: { type: 'constArr', decl: "const MOTIFS_RETOUR = [];" },
  SERVICE_ICONS: { type: 'constObj', decl: "const SERVICE_ICONS = {};" },
  SERVICE_LABELS: { type: 'constObj', decl: "const SERVICE_LABELS = {};" },
  DAYS: { type: 'constArr', decl: "const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];" },
  MONTHS: { type: 'constArr', decl: "const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];" },

  // --- HELPERS ---
  inputClass: { type: 'fn', decl: "const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';" },
  handleStatut: { type: 'fn', decl: "const handleStatut = async (id, statut) => { try { await api.patch(`/${prefix}/reparations/${id}`, { statut }); refetch(); success('Statut mis à jour'); } catch { notifError('Erreur'); } };" },
  handleStockEdit: { type: 'fn', decl: "const handleStockEdit = (item) => { setEditItem(item); setFormOpen(true); };" },
  saveStock: { type: 'fn', decl: "const saveStock = async () => { setSaving(true); try { await api.post(`/${prefix}/stock/edits`, edits); refetch(); success('Stock mis à jour'); setEdits({}); } catch { notifError('Erreur'); } finally { setSaving(false); } };" },
  handleTraiter: { type: 'fn', decl: "const handleTraiter = async (item, action) => { try { await api.post(`/${prefix}/alertes/traiter`, { id: item.id, action }); refetch(); success('Action effectuée'); } catch { notifError('Erreur'); } };" },
  handleNewRetour: { type: 'fn', decl: "const handleNewRetour = () => { setFormMotif(''); setShowForm(true); };" },
  handleValider: { type: 'fn', decl: "const handleValider = async () => { try { await api.post(`/${prefix}/retours/${confirmValidate}/valider`); setConfirmValidate(null); refetch(); success('Retour validé'); } catch { notifError('Erreur'); } };" },
  handleRembourser: { type: 'fn', decl: "const handleRembourser = async () => { try { await api.post(`/${prefix}/retours/${confirmValidate}/rembourser`); setConfirmValidate(null); refetch(); success('Remboursement effectué'); } catch { notifError('Erreur'); } };" },
  prevMonth: { type: 'fn', decl: "const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else { setMonth(m => m - 1); } };" },
  nextMonth: { type: 'fn', decl: "const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else { setMonth(m => m + 1); } };" },
  daysInMonth: { type: 'computed', decl: "const daysInMonth = new Date(year, month + 1, 0).getDate();" },
  firstDay: { type: 'computed', decl: "const firstDay = new Date(year, month, 1).getDay();" },
  getDayEvents: { type: 'fn', decl: "const getDayEvents = (day) => events.filter(e => { const d = new Date(e.date); return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year; });" },
};

// Vars that should NEVER be auto-declared (too common / false positives)
const SKIP_VARS = new Set([
  'total', 'type', 'solde', 'espace', 'paginated', 'filtres', 'data', 'items',
  'current', 'badgeColor', 'badgeStatut', 'setF', 'set', 'p',
]);

// ---------------------------------------------------------------------------
// Determine what to inject for a file
// ---------------------------------------------------------------------------

function collectDeclarations(source, filePath) {
  const declaredNames = getDeclaredVarNames(source);
  const toAdd = [];
  const alreadyQueued = new Set();

  function queueDecl(decl) {
    if (!decl) return;
    const varName = decl.match(/const\s+(?:\[\s*(\w+)\s*,\s*\w+\s*\]|(\w+)\s*)/);
    const key = varName ? (varName[1] || varName[2]) : decl;
    if (alreadyQueued.has(key)) return;
    if (declaredNames.has(key)) return;
    alreadyQueued.add(key);
    toAdd.push(decl);
  }

  // 1. Check each rule
  for (const [varName, rule] of Object.entries(ALL_RULES)) {
    if (!rule) continue; // skip setter-only entries

    // Check if var is used in source (bare usage, not obj.prop)
    const included = has(source, new RegExp(`\\b${varName}\\b`));
    if (!included) continue;

    // Skip if it's a prop
    if (hasPropGuard(source, varName)) continue;

    // Skip vars in skip list
    if (SKIP_VARS.has(varName)) continue;

    // Specific guard for isOpen
    if (varName === 'isOpen') {
      // Only add to page files, NOT form files (which receive isOpen as prop)
      if (filePath.includes('\\forms\\')) continue;
      // Also check if it's used in FormModal-like context
      if (has(source, /\bisOpen=\{/) && has(source, /onClose=\{/)) continue;
    }

    // Check pagination guard
    if (rule.guard === 'noPagination') {
      if (has(source, /usePagination/)) continue;
    }

    // Check if already declared
    if (isDeclared(source, varName)) continue;

    queueDecl(rule.decl);
  }

  // 2. showNotif function (companion to notif)
  if (alreadyQueued.has('notif') || (has(source, /\bshowNotif\b/) && !isDeclared(source, 'showNotif'))) {
    queueDecl("const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };");
  }

  // 3. set/setF form field updaters
  if (has(source, /onChange=\{set\(/) && !isDeclared(source, 'set') && !has(source, /\bconst\s+set\s*=/)) {
    // Need form state too
    if (!isDeclared(source, 'form') && !isDeclared(source, 'setForm')) {
      queueDecl("const [form, setForm] = useState({});");
    }
    queueDecl("const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));");
  }
  if (has(source, /onChange=\{setF\(/) && !isDeclared(source, 'setF') && !has(source, /\bconst\s+setF\s*=/)) {
    if (!isDeclared(source, 'form') && !isDeclared(source, 'setForm')) {
      queueDecl("const [form, setForm] = useState({});");
    }
    queueDecl("const setF = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));");
  }

  // 4. p alias for page
  if (has(source, /\bsetPage\(p\b/) && !isDeclared(source, 'p')) {
    const inCallback = has(source, /=>\s*\{[^}]*\bconst\s+p\s*=/);
    if (!inCallback) {
      queueDecl("const p = page;");
    }
  }

  return toAdd;
}

// ---------------------------------------------------------------------------
// Find injection line
// ---------------------------------------------------------------------------

function findInjectionLine(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*useState\s*\(/);
    if (m) {
      for (let j = i; j < lines.length; j++) {
        if (/\);\s*$/.test(lines[j]) || /\),?\s*$/.test(lines[j])) {
          return j + 1;
        }
      }
      return i + 1;
    }
    const m2 = lines[i].match(/const\s+(\w+)\s*=\s*useState\s*\(/);
    if (m2) {
      for (let j = i; j < lines.length; j++) {
        if (/\);\s*$/.test(lines[j]) || /\),?\s*$/.test(lines[j])) {
          return j + 1;
        }
      }
      return i + 1;
    }
  }
  return -1;
}

function findReturnLine(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*return\s*[/(<]/.test(lines[i]) || /^\s*return\s*\(/.test(lines[i])) {
      return i;
    }
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const allFiles = walkDir(MODULES_DIR);
const report = {};
let totalFixed = 0;

for (const filePath of allFiles) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');

  const toAdd = collectDeclarations(source, filePath);
  if (toAdd.length === 0) continue;

  let injectLine = findInjectionLine(lines);
  if (injectLine < 0) {
    injectLine = findReturnLine(lines);
  }
  if (injectLine < 0) {
    console.warn(`  ⚠  ${path.relative(__dirname, filePath)} — no insertion point, skipping`);
    continue;
  }

  const indent = injectLine > 0 ? lines[injectLine - 1].match(/^\s*/)?.[0] || '  ' : '  ';

  // Final dedup against actual file content
  const uniqueToAdd = toAdd.filter(d => {
    const searchStr = d.replace(/ =.*$/, '').trim().replace(/\[/, '\\[').replace(/\]/, '\\]');
    const re = new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return !re.test(lines.join('\n'));
  });

  if (uniqueToAdd.length === 0) continue;

  const insertion = '\n' + uniqueToAdd.map(d => indent + d).join('\n');
  lines.splice(injectLine, 0, insertion);
  const newSource = lines.join('\n');

  fs.writeFileSync(filePath, newSource, 'utf-8');
  totalFixed++;
  report[path.relative(MODULES_DIR, filePath)] = uniqueToAdd.map(d => d.replace(/ =.*$/, '').trim());
}

// ---- Final report ----
console.log('\n══════════════════════════════════════════');
console.log('  CORRECTION GLOBALE — RAPPORT FINAL');
console.log('══════════════════════════════════════════');
console.log(`  Fichiers corrigés : ${totalFixed}`);
console.log(`  Fichiers scannés  : ${allFiles.length}`);
console.log('────────────────────────────────────────────');

if (totalFixed > 0) {
  for (const [file, vars] of Object.entries(report).sort()) {
    console.log(`\n  📄 ${file}`);
    for (const v of vars) {
      console.log(`     + ${v}`);
    }
  }
} else {
  console.log('  Aucune correction nécessaire.');
}

console.log('══════════════════════════════════════════\n');
