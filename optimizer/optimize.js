const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Hardcoding paths for local testing (we will make these dynamic later for CI/CD)
const inputDir = path.join(__dirname, '../sample-assets');
const outputDir = path.join(__dirname, '../sample-assets/optimized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function processImages() {
    console.log('🚀 Starting Media Optimization Pipeline...\n');
    let totalOriginalSize = 0;
    let totalNewSize = 0;

    const files = fs.readdirSync(inputDir);

    for (const file of files) {
        // Only process .jpg, .jpeg, and .png files
        if (file.match(/\.(jpg|jpeg|png)$/i)) {
            const inputPath = path.join(inputDir, file);
            const outputPath = path.join(outputDir, file.replace(/\.[^/.]+$/, ".webp"));

            const stats = fs.statSync(inputPath);
            const originalSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            totalOriginalSize += stats.size;

            try {
                // The actual optimization process
                await sharp(inputPath)
                    .resize({ width: 1920, withoutEnlargement: true }) // Max width 1920px
                    .webp({ quality: 80 }) // Convert to WebP at 80% quality
                    .toFile(outputPath);

                const newStats = fs.statSync(outputPath);
                const newSizeMB = (newStats.size / (1024 * 1024)).toFixed(2);
                totalNewSize += newStats.size;

                console.log(`✅ Processed: ${file}`);
                console.log(`   - Original: ${originalSizeMB} MB`);
                console.log(`   - Optimized: ${newSizeMB} MB`);
                console.log(`   - Saved: ${((1 - (newStats.size / stats.size)) * 100).toFixed(1)}%\n`);

            } catch (error) {
                console.error(`❌ Failed to process ${file}:`, error.message);
            }
        }
    }

    // Final Report
    const savedMB = ((totalOriginalSize - totalNewSize) / (1024 * 1024)).toFixed(2);
    console.log('📊 --- PIPELINE SUMMARY ---');
    console.log(`Total Space Saved: ${savedMB} MB`);
    console.log('---------------------------\n');
}

processImages();