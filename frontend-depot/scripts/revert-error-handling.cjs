const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');

function findJsxFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'depot-boissons' && e.name !== 'node_modules') {
        results = results.concat(findJsxFiles(full));
      }
    } else if (e.name.endsWith('.jsx') && dir.includes('pages')) {
      results.push(full);
    }
  }
  return results;
}

const files = findJsxFiles(SRC);
let reverted = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  // Remove the error message div block added by the script
  // This matches: \n<indent>if (error) return <div className="flex items-center justify-center p-8 text-red-400">Erreur: {error?.message || 'Impossible de charger les données'}</div>;
  const errorDivBlock = /[\r\n]+\s*if\s*\(\s*error\s*\)\s*return\s*<div\s+className="flex\s+items-center\s+justify-center\s+p-8\s+text-red-400">Erreur:\s*\{error\?\.message\s*\|\|\s*'Impossible\s+de\s+charger\s+les\s+données'\}<\/div>;?/g;
  content = content.replace(errorDivBlock, '');

  // Remove `error` from destructuring patterns added by script
  // Pattern 1: { loading, error, ... } → { loading, ... }
  content = content.replace(/const\s*\{\s*(loading(?::\s*\w+)?),\s*error,\s*/g, 'const { $1, ');
  // Pattern 2: { error, loading, ... } → { loading, ... }
  content = content.replace(/const\s*\{\s*error,\s*(loading(?::\s*\w+)?),\s*/g, 'const { $1, ');
  // Pattern 3: { ..., error } at end → { ... }
  content = content.replace(/,\s*error\s*\}/g, ' }');
  // Pattern 4: { error, data: ... } (no loading) → { data: ... }
  content = content.replace(/const\s*\{\s*error,\s*/g, 'const { ');

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    reverted++;
    console.log(`Reverted: ${file}`);
  }
}

console.log(`\nDone: ${reverted} files reverted`);
