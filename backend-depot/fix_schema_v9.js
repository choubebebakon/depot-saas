const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Mettre à jour NotifType avec les valeurs J1, J3, J7
content = content.replace(/EXPIRY_WARNING/, 'EXPIRY_WARNING\n  EXPIRY_J7\n  EXPIRY_J3\n  EXPIRY_J1');

// Mettre à jour Notification model
content = content.replace(/model Notification \{[\s\S]*?\}/, `model Notification {
  id        String    @id @default(uuid())
  type      NotifType
  title     String?
  message   String?
  isRead    Boolean   @default(false)
  isSent    Boolean   @default(false)
  sentAt    DateTime?
  createdAt DateTime  @default(now())

  tenantId  String
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}`);

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Schema updated for TasksService compatibility.');
