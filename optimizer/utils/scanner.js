const fs = require('fs');
const path = require('path');

const getFilesRecursively = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const name = path.join(dir, file);
        // Safety: Skip massive directories
        if (file === 'node_modules' || file === '.git' || file === 'actions-runner') return;

        if (fs.statSync(name).isDirectory()) {
            getFilesRecursively(name, fileList);
        } else {
            fileList.push(name);
        }
    });
    return fileList;
};

module.exports = getFilesRecursively;
