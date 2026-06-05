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
let fixed = 0;
let skipped = 0;
let already = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  // Skip if error already handled
  if (/\bif\s*\(\s*error\b/.test(content)) {
    already++;
    continue;
  }

  // Find all useData calls and add `error` to destructuring
  // Pattern: const { ... } = useData(
  let changed = false;
  const re = /const\s*\{\s*([^}]+)\s*\}\s*=\s*useData\s*\(/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const vars = m[1];
    if (!/\berror\b/.test(vars)) {
      // Add error to the destructuring
      // Insert after `loading` if present, else at start
      let insertion;
      if (/\bloading\b/.test(vars)) {
        // Replace loading with loading, error (checking for aliased loading)
        insertion = vars.replace(/\bloading\b/, '$&, error');
      } else {
        // Add at beginning
        insertion = 'error, ' + vars.trimStart();
      }
      content = content.slice(0, m.index) +
        `const { ${insertion} } = useData(` +
        content.slice(m.index + m[0].length);
      changed = true;
      // Reset regex since content length changed
      re.lastIndex = 0;
    }
  }

  if (!changed) {
    skipped++;
    continue;
  }

  // Find loading check and add error check after it
  // Match: if (loading...) return <Component> (possibly multi-line)
  const loadCheck = /(\n\s*)(if\s*\(\s*loading[\s\S]*?\)\s*return\s*<[\s\S]*?>[\s\S]*?<\/[\w]+>)/;
  const lMatch = content.match(loadCheck);
  if (lMatch) {
    const indent = lMatch[1];
    const errorCheck = `${indent}if (error) return <div className="flex items-center justify-center p-8 text-red-400">Erreur: {error?.message || 'Impossible de charger les données'}</div>;\n`;
    content = content.slice(0, lMatch.index + lMatch[0].length) + '\n' + errorCheck + content.slice(lMatch.index + lMatch[0].length);
  }

  fs.writeFileSync(file, content, 'utf8');
  fixed++;
  console.log(`Fixed: ${file}`);
}

console.log(`\nDone: ${fixed} fixed, ${already} already had error handling, ${skipped} skipped (no useData or other reason)`);
