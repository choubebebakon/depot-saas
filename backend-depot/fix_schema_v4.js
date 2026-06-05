const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Ajouter isActive au modèle User
content = content.replace(/model User \{/, 'model User {\n  isActive      Boolean  @default(true)');

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Added isActive to User model.');
