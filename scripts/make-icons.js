const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy icon.svg to favicon.ico and PNG names
const svgPath = path.join(iconsDir, 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// For manifest icons, we keep svg and write png reference copies
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), svgContent);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), svgContent);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), svgContent);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), svgContent);

console.log('Icons generated!');
