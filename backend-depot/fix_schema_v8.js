const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Ajouter isSent au modèle Notification
content = content.replace(/model Notification \{/, 'model Notification {\n  isSent    Boolean   @default(false)');

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Added isSent to Notification model.');
