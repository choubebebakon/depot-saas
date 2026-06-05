const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Supprimer le BOM s'il existe
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// 1. Nettoyer les enums
content = content.replace(/enum (\w+) \{([\s\S]*?)\}/g, (match, name, body) => {
    const lines = body.split('\n');
    const seen = new Set();
    const uniqueLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        if (seen.has(trimmed)) return false;
        seen.add(trimmed);
        return true;
    });
    return `enum ${name} {\n${uniqueLines.join('\n')}\n}`;
});

// 2. Nettoyer les modèles (champs en double)
content = content.replace(/model (\w+) \{([\s\S]*?)\}/g, (match, name, body) => {
    const lines = body.split('\n');
    const seen = new Set();
    const uniqueLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        const fieldName = trimmed.split(/\s+/)[0];
        if (fieldName.startsWith('//') || fieldName.startsWith('@@')) return true;
        if (seen.has(fieldName)) return false;
        seen.add(fieldName);
        return true;
    });
    return `model ${name} {\n${uniqueLines.join('\n')}\n}`;
});

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Schema super cleaned.');
