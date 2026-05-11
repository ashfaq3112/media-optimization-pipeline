const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Root of your project (current directory)
const projectRoot = path.join(__dirname, '../'); 
const extensionsToOptimize = ['.jpg', '.jpeg', '.png'];
const codeExtensions = ['.html', '.css', '.js', '.jsx', '.tsx', '.vue'];

// Helper: Find all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        // Skip node_modules and .git folders
        if (file === 'node_modules' || file === '.git' || file === 'actions-runner') return;

        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

async function runGlobalOptimization() {
    console.log('🚀 Scanning entire project for media assets...\n');
    
    const allFiles = getAllFiles(projectRoot);
    const images = allFiles.filter(file => extensionsToOptimize.includes(path.extname(file).toLowerCase()));
    const sourceFiles = allFiles.filter(file => codeExtensions.includes(path.extname(file).toLowerCase()));

    let totalSaved = 0;

    // 1. PROCESS AND DELETE IMAGES
    for (const imagePath of images) {
        const ext = path.extname(imagePath);
        const outputPath = imagePath.replace(ext, '.webp');

        try {
            const originalStats = fs.statSync(imagePath);
            
            await sharp(imagePath)
                .resize({ width: 1920, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(outputPath);

            const optimizedStats = fs.statSync(outputPath);
            totalSaved += (originalStats.size - optimizedStats.size);

            // DELETE the original image
            fs.unlinkSync(imagePath);
            
            console.log(`✅ Optimized & Replaced: ${path.basename(imagePath)} -> .webp`);
        } catch (err) {
            console.error(`❌ Error processing ${imagePath}:`, err.message);
        }
    }

    // 2. UPDATE CODE REFERENCES
    console.log('\n📝 Updating image references in source code...');
    for (const sourceFile of sourceFiles) {
        let content = fs.readFileSync(sourceFile, 'utf8');
        let updated = false;

        extensionsToOptimize.forEach(ext => {
            // Regex to find "filename.png" and change to "filename.webp"
            const regex = new RegExp(ext.replace('.', '\\.'), 'gi');
            if (regex.test(content)) {
                content = content.replace(regex, '.webp');
                updated = true;
            }
        });

        if (updated) {
            fs.writeFileSync(sourceFile, content);
            console.log(`   ✨ Updated refs in: ${path.relative(projectRoot, sourceFile)}`);
        }
    }

    console.log('\n📊 --- FINAL REPORT ---');
    console.log(`Total Storage Saved: ${(totalSaved / (1024 * 1024)).toFixed(2)} MB`);
    console.log('Pipeline complete. All code references updated.\n');
}

runGlobalOptimization();