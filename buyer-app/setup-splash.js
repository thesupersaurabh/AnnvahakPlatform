const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
    mdpi: 160,
    hdpi: 240,
    xhdpi: 320,
    xxhdpi: 480,
    xxxhdpi: 640
};

const sourceIcon = path.join(__dirname, 'assets', 'images', 'icon.png');

async function generateSplashScreenLogos() {
    for (const [density, size] of Object.entries(sizes)) {
        const targetDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', `drawable-${density}`);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Generate splash screen logo
        await sharp(sourceIcon)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .toFile(path.join(targetDir, 'splashscreen_logo.png'));
        
        console.log(`Generated ${density} splash screen logo: ${targetDir}`);
    }
}

generateSplashScreenLogos().catch(console.error); 