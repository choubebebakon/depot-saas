const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Reconstruire les Enums avec TOUTES les valeurs attendues par le code
const legacyEnums = `
enum Role {
  PATRON
  GERANT
  CAISSIER
  MAGASINIER
  COMMERCIAL
  COMPTABLE
  ADMIN
}

enum RoleUser {
  PATRON
  GERANT
  CAISSIER
  MAGASINIER
  COMMERCIAL
  COMPTABLE
  ADMIN
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
  SOLO
  PME
  TRIAL
  UNLIMITED
}

enum PlanAbonnement {
  MENSUEL
  ANNUEL
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

enum NotifType {
  EXPIRY_WARNING
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  SYSTEM
}

enum PaymentStatus {
  PENDING
  SUCCESS
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CASH
  ORANGE_MONEY
  MTN_MOMO
  STRIPE
  VISA_CARD
  MASTERCARD
}
`;

// Remplacer les enums existants
const lines = content.split('\n');
let newLines = [];
let skip = false;
for (let line of lines) {
    if (line.match(/^enum (Role|RoleUser|TenantStatus|StatutAbonnement|PlanType|PlanAbonnement|BillingCycle|NotifType|PaymentStatus|PaymentMethod)\b/)) skip = true;
    if (!skip) newLines.push(line);
    if (line.includes('}') && skip) skip = false;
}

let newContent = newLines.join('\n') + legacyEnums;

// Ajouter les modèles manquants : Notification
if (!newContent.includes('model Notification')) {
    newContent += `
model Notification {
  id        String    @id @default(uuid())
  type      NotifType
  title     String
  message   String
  isRead    Boolean   @default(false)
  createdAt DateTime  @default(now())

  tenantId  String
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}
`;
}

// Mettre à jour Tenant pour inclure Notification et les champs manquants
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
  dateEssaiFin     DateTime?         // Legacy (requis par tenants.service.ts)
  
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

  depots        Depot[]
  users         User[]
  payments      Payment[]
  ventes        Vente[]
  notifications Notification[]
  
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
console.log('Schema final synchronisé avec tous les enums et modèles SaaS.');
