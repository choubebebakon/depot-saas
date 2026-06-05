const fs = require('fs');

const errors = fs.readFileSync('build_errors_v9.txt', 'utf8');
// Matches lines like: src/admin/admin.controller.ts:8:10 - error TS2564
// or with node.exe prefix: node.exe : src/admin/admin.controller.ts:8:10 - error TS2564
const ts2564Matches = [...errors.matchAll(/(?:node\.exe\s:\s)?(src\/[\w\/\.-]+\.ts):(\d+):(\d+) - error TS2564/g)];

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
        if (!fs.existsSync(file)) {
            console.warn(`File not found: ${file}`);
            continue;
        }
        let content = fs.readFileSync(file, 'utf8');
        let contentLines = content.split('\n');
        
        // Sort lines in descending order to avoid index issues if we were adding multiple characters, 
        // but here we just replace on the same line.
        const sortedLines = Array.from(lines).sort((a, b) => b - a);
        
        for (const lineNum of sortedLines) {
            const index = lineNum - 1;
            if (contentLines[index]) {
                // Only replace if it's a property definition (contains : and not already !:)
                // and it's not in an object literal (this is harder, but the TS error specifically targets properties)
                if (contentLines[index].includes(':') && !contentLines[index].includes('!:')) {
                    contentLines[index] = contentLines[index].replace(':', '!:');
                }
            }
        }
        
        fs.writeFileSync(file, contentLines.join('\n'), 'utf8');
        console.log(`Fixed ${lines.size} lines in ${file}`);
    } catch (e) {
        console.error(`Failed to fix ${file}: ${e.message}`);
    }
}
