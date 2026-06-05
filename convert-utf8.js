import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Chemin vers vos modules frontend (Ajustez si nécessaire)
const targetDir = path.join(__dirname, 'frontend-depot', 'src'); 

function convertFileToUtf8(filePath) {
    if (!['.tsx', '.ts', '.jsx', '.js'].includes(path.extname(filePath))) return;

    const contentBuffer = fs.readFileSync(filePath);
    // On décode le fichier en supposant qu'il a été corrompu en ISO-8859-1 / Windows-1252
    const contentStr = contentBuffer.toString('binary');
    
    // Si le fichier contient les patterns de corruption classiques
    if (contentStr.includes('ï¿½') || contentStr.includes('Ã©') || contentStr.includes('Â½')) {
        let fixedContent = contentBuffer.toString('utf-8');
        
        // Nettoyage manuel des résidus tenaces
        fixedContent = fixedContent.replace(/ï¿½/g, '')
                                   .replace(/Catï¿½gorie/g, 'Catégorie')
                                   .replace(/Toutes catï¿½gories/g, 'Toutes catégories')
                                   .replace(/QUANTITï¿½/g, 'QUANTITÉ')
                                   .replace(/trouvï¿½/g, 'trouvé');

        fs.writeFileSync(filePath, fixedContent, 'utf-8');
        console.log(`✅ Encodage corrigé et forcé en UTF-8 : ${path.relative(targetDir, filePath)}`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            convertFileToUtf8(fullPath);
        }
    }
}

console.log('🚀 Analyse et conversion des fichiers en UTF-8 actif...');
walkDir(targetDir);
console.log('✨ Conversion terminée !');