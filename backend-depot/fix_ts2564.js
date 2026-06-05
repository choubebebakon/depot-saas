const fs = require('fs');

const errors = fs.readFileSync('build_errors_full.txt', 'utf8');
const ts2564Matches = [...errors.matchAll(/(\w+.*\.ts):(\d+):(\d+) - error TS2564/g)];

console.log(`Found ${ts2564Matches.length} TS2564 errors.`);

const filesToFix = {};
for (const match of ts2564Matches) {
    const file = match[1];
    const line = parseInt(match[2]);
    if (!filesToFix[file]) filesToFix[file] = new Set();
    filesToFix[file].add(line);
}

for (const [file, lines] of Object.entries(filesToFix)) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let contentLines = content.split('\n');
        
        for (const lineNum of lines) {
            const index = lineNum - 1;
            if (contentLines[index] && contentLines[index].includes(':') && !contentLines[index].includes('!:')) {
                contentLines[index] = contentLines[index].replace(':', '!:');
            }
        }
        
        fs.writeFileSync(file, contentLines.join('\n'), 'utf8');
        console.log(`Fixed ${lines.size} lines in ${file}`);
    } catch (e) {
        console.error(`Failed to fix ${file}: ${e.message}`);
    }
}
