const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192
};

const sourceIcon = path.join(__dirname, 'assets', 'images', 'icon.png');

async function generateIcons() {
    for (const [density, size] of Object.entries(sizes)) {
        const targetDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
        
        // Generate square icon
        await sharp(sourceIcon)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .toFile(path.join(targetDir, 'ic_launcher.png'));
        
        // Generate round icon
        await sharp(sourceIcon)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .toFile(path.join(targetDir, 'ic_launcher_round.png'));
        
        console.log(`Generated ${density} icons: ${targetDir}`);
    }

    // Generate foreground version with transparency
    for (const [density, size] of Object.entries(sizes)) {
        const targetDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
        
        await sharp(sourceIcon)
            .resize(Math.floor(size * 0.75), Math.floor(size * 0.75), {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
    }
}

generateIcons().catch(console.error); 