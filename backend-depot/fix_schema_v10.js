const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Ajouter isArchived et updatedAt au modèle Depot
content = content.replace(/model Depot \{/, 'model Depot {\n  isArchived Boolean  @default(false)\n  updatedAt  DateTime @updatedAt');

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Added isArchived and updatedAt to Depot model.');
