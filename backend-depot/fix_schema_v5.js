const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Ajouter le modèle RefreshToken
if (!content.includes('model RefreshToken')) {
    content += `
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
`;
    // Ajouter la relation dans User
    content = content.replace(/model User \{/, 'model User {\n  refreshTokens RefreshToken[]');
}

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Added RefreshToken model.');
