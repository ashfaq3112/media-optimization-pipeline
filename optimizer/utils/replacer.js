const fs = require('fs');
const path = require('path');

// Safe replacement: only replace exact filename occurrences, not substrings
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

const updateReferences = (sourceFiles, optimizedMap) => {
    sourceFiles.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let isUpdated = false;

        for (const item of optimizedMap) {
            const name = path.basename(item.oldBase);
            const target = path.basename(item.newBase);
            const regex = new RegExp(`(?<=['\"\(\s=,:])${escapeRegExp(name)}(?=['\"\)\s,;])`, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, target);
                isUpdated = true;
            }
        }

        if (isUpdated) {
            fs.writeFileSync(file, content);
            console.log(`   ✨ Updated refs in: ${path.relative(process.cwd(), file)}`);
        }
    });
};

module.exports = updateReferences;