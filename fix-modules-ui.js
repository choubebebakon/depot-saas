import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.resolve(__dirname, 'frontend-depot', 'src', 'modules');

function repairRoutesSyntax(filePath) {
  if (!filePath.endsWith('routes.jsx')) return;

  let content = fs.readFileSync(filePath, 'utf-8').trim();
  const originalContent = content;

  // On sépare par ligne pour analyser la toute fin du fichier
  let lines = content.split('\n');
  
  // Si le fichier se termine par des jetons orphelins comme ); ou } ou ]; suite au nettoyage forcé
  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim();
    if (lastLine === ');' || lastLine === ')' || lastLine === '];' || lastLine === '}' || lastLine === ';') {
      console.log(`🔧 Suppression du token orphelin "${lastLine}" à la fin de : ${path.relative(modulesDir, filePath)}`);
      lines.pop(); // On retire la ligne cassée
    } else {
      break;
    }
  }

  content = lines.join('\n').trim() + '\n';

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

function scanAndRepair(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanAndRepair(fullPath);
    } else {
      repairRoutesSyntax(fullPath);
    }
  }
}

console.log('⚡ Analyse et réparation syntaxique des fichiers routes.jsx...');
scanAndRepair(modulesDir);
console.log('✨ Réparation syntaxique terminée !');