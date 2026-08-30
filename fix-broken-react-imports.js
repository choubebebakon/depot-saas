const fs = require('fs');
const path = require('path');
const glob = require('glob');

const baseDir = path.resolve('frontend-depot/src');

// Fix files that had their react import changed to usePermission
glob('**/*.{js,jsx}', { cwd: baseDir }, (err, files) => {
  if (err) throw err;
  
  let fixCount = 0;
  files.forEach(file => {
    const fullPath = path.join(baseDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Detect lines like: import { useState, useEffect, ... } from "...shared/hooks/usePermission"
    // These are wrong — react hooks should come from 'react'
    const reactHookRegex = /import\s*\{([^}]+)\}\s*from\s*(['"])([^'"]*usePermission[^'"]*)\2/g;
    
    let modified = false;
    content = content.replace(reactHookRegex, (match, named, quote, fromPath) => {
      const reactHooks = ['useState', 'useEffect', 'useCallback', 'useRef', 'useMemo', 'useContext', 'useReducer', 'useLayoutEffect'];
      const parts = named.split(',').map(s => s.trim()).filter(Boolean);
      
      const reactParts = parts.filter(p => reactHooks.includes(p));
      const permParts = parts.filter(p => !reactHooks.includes(p));
      
      if (reactParts.length === 0) return match; // nothing to fix
      
      let result = '';
      if (reactParts.length > 0) {
        result += `import { ${reactParts.join(', ')} } from 'react';\n`;
      }
      if (permParts.length > 0) {
        result += `import { ${permParts.join(', ')} } from ${quote}${fromPath}${quote}`;
      } else {
        // remove trailing newline we added
        result = result.trimEnd();
      }
      
      modified = true;
      return result;
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed ${file}`);
      fixCount++;
    }
  });
  
  console.log(`\nFixed ${fixCount} files.`);
});
