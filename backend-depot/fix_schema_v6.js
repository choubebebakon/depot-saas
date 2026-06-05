const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Reconstruire les Enums pour la compatibilité maximale
const legacyEnums = `
enum Role {
  PATRON
  GERANT
  CAISSIER
  MAGASINIER
  COMMERCIAL
  COMPTABLE
}

enum RoleUser {
  PATRON
  GERANT
  CAISSIER
  MAGASINIER
  COMMERCIAL
  COMPTABLE
}

enum TenantStatus {
  TRIAL
  ACTIVE
  GRACE
  GRACE_PERIOD
  EXPIRED
  READ_ONLY
}

enum StatutAbonnement {
  TRIAL
  ACTIVE
  GRACE
  EXPIRED
  READ_ONLY
}

enum PlanType {
  FREE
  BASIC
  PREMIUM
  ENTERPRISE
}

enum PlanAbonnement {
  MENSUEL
  ANNUEL
}
`;

// Remplacer les enums existants
const lines = content.split('\n');
let newLines = [];
let skip = false;
for (let line of lines) {
    if (line.match(/^enum (Role|RoleUser|TenantStatus|StatutAbonnement|PlanType|PlanAbonnement)\b/)) skip = true;
    if (!skip) newLines.push(line);
    if (line.includes('}') && skip) skip = false;
}

let newContent = newLines.join('\n') + legacyEnums;

// Mettre à jour Tenant pour la compatibilité maximale
newContent = newContent.replace(/model Tenant \{[\s\S]*?\}/, `model Tenant {
  id            String   @id @default(uuid())
  name          String?  // New
  nomEntreprise String?  // Legacy
  emailPatron   String?
  telephone     String?
  
  status           TenantStatus      @default(TRIAL)
  statutAbonnement StatutAbonnement  @default(TRIAL)
  
  plan             String?           // New (String)
  planAbonnement   PlanAbonnement?   // Legacy (Enum)
  planType         PlanType          @default(FREE)
  
  subscriptionEnd  DateTime?         // New
  dateExpiration   DateTime?         // Legacy
  
  maxDepots        Int               @default(5)
  lastPaymentId    String?
  estActif         Boolean           @default(true)
  graceUntil       DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  slogan      String?
  adresse     String?
  logo        String?   
  messageFin  String?   @default("Merci de votre fidélité !")

  depots     Depot[]
  users      User[]
  payments   Payment[]
  ventes     Vente[]
  
  // Relations métier
  articles   Article[]
  mouvements MouvementStock[]
  paiements  PaiementSouscription[]
  clients    Client[]
  familles   Famille[]
  lots       LotStock[]
  maintenances        MaintenanceTricycle[]
  carburants          ConsommationCarburant[]
  commissions         Commission[]
  conditionnements    Conditionnement[]
  parametresCommission ParametreCommission[]
  marques             Marque[]
  fournisseurs        Fournisseur[]
  receptions          ReceptionFournisseur[]
  commandes           CommandeFournisseur[]
  tournees            Tournee[]
  tricycles           Tricycle[]
  sessionsCaisse      SessionCaisse[]
  depenses            Depense[]
  typesConsigne       TypeConsigneConfig[]
  transferts          TransfertStock[]
}`);

fs.writeFileSync('prisma/schema.prisma', newContent, 'utf8');
console.log('Schema synchronized for maximum compatibility.');
