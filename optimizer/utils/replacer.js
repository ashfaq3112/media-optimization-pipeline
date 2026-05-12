const fs = require('fs');
const path = require('path');

const updateReferences = (sourceFiles, optimizedMap) => {
    sourceFiles.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let isUpdated = false;

        optimizedMap.forEach(item => {
            // Regex to find 'image.png' and replace with 'image.webp'
            const regex = new RegExp(item.oldBase.replace('.', '\\.'), 'g');
            if (content.includes(item.oldBase)) {
                content = content.replace(regex, item.newBase);
                isUpdated = true;
            }
        });

        if (isUpdated) {
            fs.writeFileSync(file, content);
            console.log(`   ✨ Updated refs in: ${path.basename(file)}`);
        }
    });
};

module.exports = updateReferences;