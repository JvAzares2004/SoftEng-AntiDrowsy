// Simple script to help generate PWA icons
// You can use online tools like https://realfavicongenerator.net/ 
// or https://www.pwabuilder.com/imageGenerator

console.log(`
PWA Icon Generation Instructions:
==================================

You need to create the following icon files in the public/ folder:

1. pwa-192x192.png (192x192 pixels)
2. pwa-512x512.png (512x512 pixels)
3. apple-touch-icon.png (180x180 pixels)
4. favicon.ico (optional, for browser tab)

Options to generate icons:
---------------------------

Option 1: Use an online tool (Recommended)
- Go to: https://www.pwabuilder.com/imageGenerator
- Upload your logo (Drowsiness-Logo.png from src/component/img/)
- Download the generated icons
- Place them in the public/ folder

Option 2: Manual creation
- Use an image editor (Photoshop, GIMP, etc.)
- Resize your logo to the required dimensions
- Export as PNG files
- Place them in the public/ folder

Option 3: Use sharp (Node.js image processing)
- Install: npm install -D sharp
- Create a script to resize the logo
- Generate all required sizes

Current logo location:
src/component/img/Drowsiness-Logo.png
`);
