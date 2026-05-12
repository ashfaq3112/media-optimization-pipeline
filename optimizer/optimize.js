const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Import your modular utilities
const connectDB = require('./db');
const PRLog = require('./models/PRLogs'); // Matches the 's' in your folder structure
const getFilesRecursively = require('./utils/scanner');
const updateReferences = require('./utils/replacer');

// CONFIGURATION
// Added common frontend paths in case you move your images inside 'src' later
const ASSET_DIRS = ['public', 'static', 'frontend/public', 'frontend/src/assets']; 
const PROJECT_ROOT = '/app'; // Mounted path in Kubernetes

async function runOptimization() {
    const start = Date.now();
    await connectDB();
    
    let optimizedMap = []; 
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    console.log("🚀 Starting Targeted Media Optimization...");

    // 1. SCAN & OPTIMIZE SPECIFIC ASSET DIRECTORIES
    for (const dirName of ASSET_DIRS) {
        const fullDirPath = path.join(PROJECT_ROOT, dirName);
        
        if (fs.existsSync(fullDirPath)) {
            const files = getFilesRecursively(fullDirPath);
            
            // FIX: Using 'for...of' ensures the script waits for Sharp to finish processing
            for (const filePath of files) {
                const ext = path.extname(filePath).toLowerCase();
                
                if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                    const originalSize = fs.statSync(filePath).size;
                    const newFileName = path.basename(filePath).replace(ext, '.webp');
                    const newPath = filePath.replace(ext, '.webp');

                    try {
                        // Wait for image compression to finish
                        await sharp(filePath)
                            .webp({ quality: 80 })
                            .toFile(newPath);

                        const optimizedSize = fs.statSync(newPath).size;
                        totalOriginalSize += originalSize;
                        totalOptimizedSize += optimizedSize;

                        // Track exactly what changed for the replacer tool
                        optimizedMap.push({
                            oldBase: path.basename(filePath),
                            newBase: newFileName
                        });

                        // Delete the bulky original file
                        fs.unlinkSync(filePath);
                        console.log(`✅ Processed & Replaced: ${path.basename(filePath)}`);
                    } catch (error) {
                        console.error(`❌ Failed to process image ${filePath}:`, error.message);
                    }
                }
            }
        }
    }

    // 2. GLOBAL SEARCH & REPLACE IN CODE
    console.log("📝 Updating references in source code...");
    const CODE_EXTENSIONS = ['.html', '.css', '.js', '.jsx', '.tsx', '.vue'];
    
    // Get all files, filter for code files, and pass them to your utility
    const allProjectFiles = getFilesRecursively(PROJECT_ROOT);
    const sourceFiles = allProjectFiles.filter(f => CODE_EXTENSIONS.includes(path.extname(f)));
    
    // Call the logic from your replacer.js utility
    updateReferences(sourceFiles, optimizedMap);

    // 3. LOG RECEIPT TO MONGODB
    const savedMB = (totalOriginalSize - totalOptimizedSize) / 1024 / 1024;
    
    // Fallback PR number if not running in GitHub Actions
    const prNumber = process.env.PR_NUMBER || 'Local-Test';

    await PRLog.create({
        prNumber: prNumber,
        status: 'completed',
        savedMB: savedMB.toFixed(2),
        optimizedImages: optimizedMap.length,
        processingTime: (Date.now() - start) / 1000
    });

    console.log(`\n🎉 Pipeline Complete. Saved ${savedMB.toFixed(2)} MB.`);
    process.exit(0);
}

runOptimization().catch(err => {
    console.error(`❌ Fatal Pipeline Error:`, err);
    process.exit(1);
});