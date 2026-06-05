const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

const lines = content.split('\n');
const seenModels = new Set();
const seenEnums = new Set();
const finalLines = [];
let inModel = false;
let inEnum = false;
let currentBlockName = '';
let currentBlockLines = [];

for (let line of lines) {
    const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
    const enumMatch = line.match(/^enum\s+(\w+)\s+\{/);

    if (modelMatch) {
        inModel = true;
        currentBlockName = modelMatch[1];
        currentBlockLines = [line];
    } else if (enumMatch) {
        inEnum = true;
        currentBlockName = enumMatch[1];
        currentBlockLines = [line];
    } else if (inModel || inEnum) {
        currentBlockLines.push(line);
        if (line.includes('}')) {
            if (inModel) {
                if (!seenModels.has(currentBlockName)) {
                    finalLines.push(...currentBlockLines);
                    seenModels.add(currentBlockName);
                }
                inModel = false;
            } else {
                if (!seenEnums.has(currentBlockName)) {
                    finalLines.push(...currentBlockLines);
                    seenEnums.add(currentBlockName);
                }
                inEnum = false;
            }
            currentBlockLines = [];
            currentBlockName = '';
        }
    } else {
        finalLines.push(line);
    }
}

let newContent = finalLines.join('\n');

// Ajouter les Enums SaaS manquants
if (!seenEnums.has('TenantStatus')) {
    newContent += `
enum TenantStatus {
  TRIAL
  ACTIVE
  GRACE
  READ_ONLY
  EXPIRED
}
`;
}

if (!seenEnums.has('PlanType')) {
    newContent += `
enum PlanType {
  FREE
  BASIC
  PREMIUM
  ENTERPRISE
}
`;
}

if (!seenEnums.has('PaymentStatus')) {
    newContent += `
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
`;
}

if (!seenEnums.has('PaymentMethod')) {
    newContent += `
enum PaymentMethod {
  STRIPE
  CASH
  OM
  MOMO
}
`;
}

// Renommer RoleUser en Role
newContent = newContent.replace(/enum RoleUser/g, 'enum Role');
newContent = newContent.replace(/role      RoleUser/g, 'role      Role');

// Mettre à jour le modèle Tenant pour inclure les champs SaaS
newContent = newContent.replace(/model Tenant \{/g, `model Tenant {
  status        TenantStatus @default(TRIAL)
  planType      PlanType     @default(FREE)
  subscriptionEnd DateTime?
`);

// Ajouter le modèle Payment s'il manque
if (!seenModels.has('Payment')) {
    newContent += `
model Payment {
  id        String        @id @default(uuid())
  amount    Float
  currency  String        @default("FCFA")
  status    PaymentStatus @default(PENDING)
  method    PaymentMethod
  reference String?       @unique
  stripeId  String?       @unique
  metadata  Json?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  tenantId String
  tenant   Tenant @relation("TenantPayments", fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}
`;
    // Ajouter la relation dans Tenant
    newContent = newContent.replace(/model Tenant \{/, 'model Tenant {\n  paymentsSaaS  Payment[] @relation("TenantPayments")');
}

fs.writeFileSync('prisma/schema.prisma', newContent, 'utf8');
console.log('Schema deduplicated and updated with SaaS models.');
