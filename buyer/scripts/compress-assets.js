const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

// Directories to scan for images
const ASSET_DIRS = [
  './assets',
  './app/assets'
];

// Image extensions to compress
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// Compression options
const COMPRESSION_OPTIONS = {
  jpg: {
    quality: 80,
    progressive: true,
  },
  png: {
    quality: 80,
    compressionLevel: 9,
  }
};

async function compressImage(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const image = sharp(filePath);
    
    let options = {};
    
    if (ext === '.jpg' || ext === '.jpeg') {
      options = COMPRESSION_OPTIONS.jpg;
      await image.jpeg(options).toBuffer().then(data => {
        fs.writeFileSync(filePath, data);
      });
    } else if (ext === '.png') {
      options = COMPRESSION_OPTIONS.png;
      await image.png(options).toBuffer().then(data => {
        fs.writeFileSync(filePath, data);
      });
    }
    
    const stats = fs.statSync(filePath);
    console.log(`Compressed: ${filePath} (${Math.round(stats.size / 1024)}KB)`);
  } catch (error) {
    console.error(`Error compressing ${filePath}:`, error);
  }
}

async function main() {
  console.log('Starting asset compression...');
  
  for (const dir of ASSET_DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`Directory ${dir} does not exist, skipping.`);
      continue;
    }
    
    const pattern = path.join(dir, '**/*@(jpg|jpeg|png)');
    const files = glob.sync(pattern);
    
    console.log(`Found ${files.length} images in ${dir}`);
    
    for (const file of files) {
      await compressImage(file);
    }
  }
  
  console.log('Asset compression complete!');
}

main().catch(error => {
  console.error('Error during compression:', error);
  process.exit(1);
}); 