const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Nettoyage des doublons de champs dans Depot
content = content.replace(/model Depot \{[\s\S]*?id/g, (match) => {
    const lines = match.split('\n');
    const seen = new Set();
    const uniqueLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        const fieldName = trimmed.split(/\s+/)[0];
        if (['isArchived', 'updatedAt'].includes(fieldName)) {
            if (seen.has(fieldName)) return false;
            seen.add(fieldName);
        }
        return true;
    });
    return uniqueLines.join('\n');
});

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Schema cleaned.');
