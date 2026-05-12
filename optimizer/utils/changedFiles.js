const { execSync } = require('child_process');

function getChangedFiles() {

    try {

        console.log('Detecting changed files from PR...');

        const output = execSync(
            'git diff --name-only HEAD~1 HEAD',
            {
                cwd: '/workspace',
                encoding: 'utf8'
            }
        );

        const files = output
            .split('\n')
            .map(file => file.trim())
            .filter(Boolean);

        console.log('Changed files:', files);

        const imageExtensions = ['.png', '.jpg', '.jpeg'];

        const imageFiles = files.filter(file => {

            return imageExtensions.some(ext =>
                file.toLowerCase().endsWith(ext)
            );
        });

        console.log('Detected image files:', imageFiles);

        return imageFiles.map(file => `/workspace/${file}`);

    } catch (err) {

        console.error('Failed to detect changed files:', err.message);

        return [];
    }
}

module.exports = getChangedFiles;