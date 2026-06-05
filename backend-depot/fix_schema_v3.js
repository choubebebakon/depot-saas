const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Nettoyage radical : on va reconstruire les modèles de base Tenant, User, Payment, Depot
// pour qu'ils correspondent exactement aux attentes du code Admin et des services métier.

const lines = content.split('\n');
const finalLines = [];
let skipBlock = false;

for (let line of lines) {
    if (line.match(/^(model|enum)\s+(Tenant|User|Depot|Payment|Notification|TenantStatus|PaymentStatus|PaymentMethod|PlanType|Role|RoleUser)\b/)) {
        skipBlock = true;
    }
    
    if (!skipBlock) {
        finalLines.push(line);
    }
    
    if (line.includes('}') && skipBlock) {
        skipBlock = false;
    }
}

let newContent = finalLines.join('\n');

// Ajouter les Enums et Modèles de base unifiés
newContent += `
enum Role {
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

enum PlanType {
  FREE
  BASIC
  PREMIUM
  ENTERPRISE
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

model Tenant {
  id            String   @id @default(uuid())
  name          String   // Requis par AdminService
  nomEntreprise String?  // Ancien nom
  emailPatron   String?
  telephone     String?
  status        TenantStatus @default(TRIAL)
  plan          String?      // Requis par AdminService
  planType      PlanType     @default(FREE)
  maxDepots     Int          @default(5)
  subscriptionEnd DateTime?
  dateExpiration  DateTime?  // Ancien nom
  lastPaymentId   String?
  
  estActif      Boolean  @default(true)
  graceUntil    DateTime? 
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  depots     Depot[]
  users      User[]
  payments   Payment[]
  ventes     Vente[]
  
  // Relations métier (on garde les noms existants)
  articles   Article[]
  mouvements MouvementStock[]
  paiements  PaiementSouscription[] // Legacy
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
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role
  nom       String?  
  tenantId  String
  depotId   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  depot  Depot? @relation(fields: [depotId], references: [id])

  ventesCreees    Vente[]          @relation("VenteCreateur")
  commissions     Commission[]
  tourneesOuvertes Tournee[]
  sessionsCaisse  SessionCaisse[]
  commandesCreees CommandeFournisseur[]

  @@index([tenantId])
  @@index([depotId])
}

model Depot {
  id          String @id @default(uuid())
  nom         String
  adresse     String
  emplacement String
  codePrefix  String @default("DEP") 
  tenantId    String

  tenant     Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  stocks     Stock[]
  mouvements MouvementStock[]
  ventes     Vente[]
  users      User[]
  
  receptions     ReceptionFournisseur[]
  commandes      CommandeFournisseur[]
  lots           LotStock[]
  clients        Client[]
  dettesClients  DetteClient[]
  portefeuillesConsigne PortefeuilleConsigne[]
  mouvementsConsigne MouvementConsigne[]
  fournisseurs   Fournisseur[]
  tricycles      Tricycle[]
  tournees       Tournee[]
  sessionsCaisse SessionCaisse[]
  journauxAudit  JournalAudit[]
  maintenances   MaintenanceTricycle[]
  carburants     ConsommationCarburant[]
  commissions    Commission[]
  depenses       Depense[]
  transfertsSource TransfertStock[] @relation("TransfertSource")
  transfertsDest   TransfertStock[] @relation("TransfertDest")

  @@index([tenantId])
}

model Payment {
  id        String        @id @default(uuid())
  amount    Float
  tvaAmount Float         @default(0)
  totalAmount Float       @default(0)
  currency  String        @default("FCFA")
  status    PaymentStatus @default(PENDING)
  method    PaymentMethod
  
  planPurchased String?
  billingCycle  String?
  
  reference String?       @unique
  operatorTxId String?    @unique
  stripePaymentIntentId String? @unique
  
  periodStart DateTime?
  periodEnd   DateTime?
  
  metadata  Json?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}
`;

fs.writeFileSync('prisma/schema.prisma', newContent, 'utf8');
console.log('Schema unifié avec les modèles SaaS et métier.');
