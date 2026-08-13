'use strict';

/**
 * Transforme emoji-report.jsonl (généré par replace-emojis.cjs) en un résumé
 * lisible, groupé par fichier, avec l'icône suggérée pour chaque emoji.
 *
 * Usage :
 *   node scripts/emoji-codemod/summarize-report.js
 *   node scripts/emoji-codemod/summarize-report.js chemin/vers/emoji-report.jsonl
 *
 * Écrit aussi scripts/emoji-codemod/emoji-report-summary.md (même dossier que
 * le rapport source) pour consultation hors terminal.
 */

const fs = require('fs');
const path = require('path');

const reportPath = process.argv[2] || path.join(process.cwd(), 'emoji-report.jsonl');

if (!fs.existsSync(reportPath)) {
  console.error(`Introuvable : ${reportPath}`);
  console.error('Lance d\'abord le codemod (voir README.md) pour générer ce fichier.');
  process.exit(1);
}

const lines = fs
  .readFileSync(reportPath, 'utf-8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const byFile = new Map();
const byCategory = { 'jsx-attribute': 0, 'config-string': 0, other: 0 };
const byEmoji = new Map();

for (const entry of lines) {
  byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
  if (!byFile.has(entry.file)) byFile.set(entry.file, []);
  byFile.get(entry.file).push(entry);
  entry.emojis.forEach((e, i) => {
    const key = `${e} -> ${entry.suggested[i]}`;
    byEmoji.set(key, (byEmoji.get(key) || 0) + 1);
  });
}

const sortedFiles = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);

const CATEGORY_LABELS = {
  'jsx-attribute': 'Attribut JSX (title=, aria-label=, placeholder=... — impossible d\'y mettre un composant)',
  'config-string': 'Chaîne dans un objet de config (icon: \'...\', label: \'...\')',
  other: 'Autre (argument de fonction, toast/log, variable...)',
};

let md = '# Rapport emoji -> icône lucide-react — occurrences à traiter manuellement\n\n';
md += `Total : **${lines.length} occurrences** dans **${byFile.size} fichiers**.\n\n`;
md += 'Ces occurrences n\'ont volontairement PAS été modifiées automatiquement : les mettre\n';
md += 'dans un attribut, un objet de config, ou un argument de fonction casserait la syntaxe\n';
md += '(une chaîne de caractères JS ne peut pas contenir un composant React). Chaque ligne\n';
md += 'ci-dessous indique l\'icône suggérée — le remplacement demande d\'adapter le code\n';
md += 'consommateur au cas par cas (ex. transformer `icon: \'💊\'` + `{item.icon}` en\n';
md += '`icon: Pill` + `<item.icon />`).\n\n';
md += '## Répartition par catégorie\n\n';
for (const [cat, n] of Object.entries(byCategory)) {
  md += `- **${n}** — ${CATEGORY_LABELS[cat] || cat}\n`;
}
md += '\n## Détail par fichier (du plus impacté au moins impacté)\n\n';

for (const [file, entries] of sortedFiles) {
  md += `### ${file} (${entries.length})\n\n`;
  md += '| Ligne | Emoji | Icône suggérée | Catégorie | Extrait |\n';
  md += '|---|---|---|---|---|\n';
  for (const e of entries.sort((a, b) => (a.line || 0) - (b.line || 0))) {
    md += `| ${e.line ?? '?'} | ${e.emojis.join(' ')} | ${e.suggested.join(', ')} | ${e.category} | \`${e.excerpt.replace(/\|/g, '\\|').replace(/\n/g, ' ')}\` |\n`;
  }
  md += '\n';
}

const outPath = path.join(path.dirname(reportPath), 'emoji-report-summary.md');
fs.writeFileSync(outPath, md, 'utf-8');

// Résumé console
console.log(`Total : ${lines.length} occurrences dans ${byFile.size} fichiers\n`);
console.log('Par catégorie :');
for (const [cat, n] of Object.entries(byCategory)) {
  console.log(`  ${String(n).padStart(4)}  ${CATEGORY_LABELS[cat] || cat}`);
}
console.log('\nTop 15 fichiers les plus impactés :');
for (const [file, entries] of sortedFiles.slice(0, 15)) {
  console.log(`  ${String(entries.length).padStart(4)}  ${file}`);
}
console.log('\nTop 15 paires emoji -> icône les plus fréquentes :');
const sortedEmojis = [...byEmoji.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [pair, n] of sortedEmojis) {
  console.log(`  ${String(n).padStart(4)}  ${pair}`);
}
console.log(`\nRésumé détaillé écrit dans : ${outPath}`);
