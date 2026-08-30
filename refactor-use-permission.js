const fs = require('fs');
const path = require('path');
const glob = require('glob');

const baseDir = path.resolve('frontend-depot/src');

glob('**/*.{js,jsx}', { cwd: baseDir }, (err, files) => {
  if (err) throw err;
  
  files.forEach(file => {
    const fullPath = path.join(baseDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Replace usePermissions with usePermission
    if (content.includes('usePermissions')) {
      content = content.replace(/usePermissions/g, 'usePermission');
      modified = true;
    }

    // Replace import paths
    const importRegex = /(['"])(.*?)(hooks\/usePermission|shared\/permissions\/usePermission)(\.js)?\1/g;
    
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match, quote, prefix) => {
        // Calculate the relative path from the current file to shared/hooks/usePermission
        const fileDir = path.dirname(fullPath);
        const targetPath = path.resolve(baseDir, 'shared/hooks/usePermission');
        let relativePath = path.relative(fileDir, targetPath).replace(/\\/g, '/');
        
        if (!relativePath.startsWith('.')) {
          relativePath = './' + relativePath;
        }
        
        return `${quote}${relativePath}${quote}`;
      });
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${file}`);
    }
  });

  // Now delete the deprecated files if they exist
  const filesToDelete = [
    'hooks/usePermission.js',
    'hooks/usePermissions.js',
    'shared/permissions/usePermission.js'
  ];

  filesToDelete.forEach(f => {
    const fp = path.join(baseDir, f);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      console.log(`Deleted ${f}`);
    }
  });
});
