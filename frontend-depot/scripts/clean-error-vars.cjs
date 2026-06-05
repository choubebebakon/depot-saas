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
let cleaned = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  // Remove `error` from multi-line destructuring inside useData blocks
  // Pattern: continuation lines like `    loading, error,` or `    error, loading,`
  // Only within `{ ... } = useData(` context
  // Replace `, error` on continuation lines (after newline + spaces)
  content = content.replace(/(\n\s*)(\w+(?::\s*\w+)?),\s*error,/g, '$1$2,');
  // Replace `error,` at start of continuation line  
  content = content.replace(/(\n\s*)error,\s*/g, '$1');

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    cleaned++;
  }
}

console.log(`Cleaned ${cleaned} files`);
