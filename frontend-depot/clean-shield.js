import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Le dossier cible où se trouvent tous tes modules métiers
const TARGET_DIR = path.join(__dirname, 'src', 'modules');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Le pattern exact qui fait planter le build (avec les sauts de ligne potentiels)
  const patternToFind = `}\n  });\n}\n\n\n);\n}`;
  const alternativePattern = `}\n\t});\n}\n\n\n);\n}`;
  const simplePattern = `\n);\n}`;

  let modified = false;

  // On cible spécifiquement le ); } parasite qui suit immédiatement le premier bloc window
  if (content.includes(patternToFind)) {
    content = content.replace(`}\n  });\n}\n\n\n);\n}`, `}\n  });\n}`);
    modified = true;
  } else if (content.includes(alternativePattern)) {
    content = content.replace(`}\n\t});\n}\n\n\n);\n}`, `}\n\t});\n}`);
    modified = true;
  } else {
    // Nettoyage de secours plus large si le bloc window est juste au-dessus
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === ');' && lines[i+1]?.trim() === '}') {
        // On vérifie que c'est bien le parasite du début (autour des lignes 15-25)
        if (i < 30) {
          lines.splice(i, 2);
          content = lines.join('\n');
          modified = true;
          break;
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Nettoyé : ${path.relative(TARGET_DIR, filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      cleanFile(fullPath);
    }
  }
}

console.log('🚀 Début du nettoyage chirurgical dans src/modules...');
if (fs.existsSync(TARGET_DIR)) {
  walkDir(TARGET_DIR);
  console.log('\n🎉 Nettoyage terminé ! Relance ton build pour voir.');
} else {
  console.error(`❌ Impossible de trouver le dossier : ${TARGET_DIR}`);
}