const fs = require('fs');

if (!fs.existsSync('build_errors_final_2.txt')) {
    console.error('Error file missing.');
    process.exit(1);
}

const errors = fs.readFileSync('build_errors_final_2.txt', 'utf8');
const ts2564Matches = [...errors.matchAll(/(src\/[^\s:]+\.ts):(\d+):(\d+) - error TS2564/g)];

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
        if (!fs.existsSync(file)) continue;
        let content = fs.readFileSync(file, 'utf8');
        let contentLines = content.split(/\r?\n/);
        
        const sortedLines = Array.from(lines).sort((a, b) => b - a);
        
        for (const lineNum of sortedLines) {
            const index = lineNum - 1;
            if (contentLines[index]) {
                // Ensure we ONLY match property declarations: "name: string" or "name?: string"
                // and NOT object literals or other stuff.
                // Property declarations in classes usually have decorators on the line above or match this pattern.
                if (contentLines[index].includes(':') && !contentLines[index].includes('!:')) {
                    // Check if the line ends with ; or has no assignment
                    if (!contentLines[index].includes('=') && (contentLines[index].trim().endsWith(';') || !contentLines[index].trim().endsWith(','))) {
                        contentLines[index] = contentLines[index].replace(':', '!:');
                    }
                }
            }
        }
        
        fs.writeFileSync(file, contentLines.join('\n'), 'utf8');
        console.log(`Fixed ${lines.size} lines in ${file}`);
    } catch (e) {
        console.error(`Failed to fix ${file}: ${e.message}`);
    }
}
