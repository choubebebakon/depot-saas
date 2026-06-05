const fs = require('fs');

let lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

// Supprimer le BOM s'il existe
if (lines[0] && lines[0].charCodeAt(0) === 0xFEFF) {
  lines[0] = lines[0].slice(1);
}

const newLines = lines.map(line => {
  if (line.includes('model Site {')) {
    return line.replace('model Site {', 'model Depot {');
  }
  
  // Remplacer les champs relationnels: `site Site` -> `depot Depot` ou `site  Site?` -> `depot Depot?`
  let newLine = line.replace(/\bsite\b(\s+)Site\b/g, 'depot$1Depot');
  newLine = newLine.replace(/\bsites\b(\s+)Site\b/g, 'depots$1Depot');
  
  // Remplacer siteId par depotId
  newLine = newLine.replace(/\bsiteId\b/g, 'depotId');
  
  // Remplacer sites par depots dans le bloc model
  if (newLine.includes('sites') && newLine.includes('Site[]')) {
      newLine = newLine.replace('sites', 'depots').replace('Site[]', 'Depot[]');
  }
  
  // Remplacer site par depot si ce n'est pas déjà fait
  if (newLine.includes(' site ') && newLine.includes('@relation')) {
      newLine = newLine.replace(' site ', ' depot ');
  }

  return newLine;
});

fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'), 'utf8');
