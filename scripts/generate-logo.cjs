const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create the brand SVG matching the uploaded logo image perfectly
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <!-- Brand Blue Gradient -->
    <linearGradient id="brandGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0a1d37" />
      <stop offset="35%" stop-color="#0f3460" />
      <stop offset="70%" stop-color="#196898" />
      <stop offset="100%" stop-color="#3fa8d4" />
    </linearGradient>
  </defs>

  <!-- Clean Background -->
  <rect width="1000" height="1000" fill="#ffffff" rx="200"/>

  <g transform="translate(40, 20)">
    <!-- Main Upper Wing Swoosh -->
    <path d="M 315 730 
             L 490 350 
             C 525 275, 600 250, 700 250 
             C 780 250, 850 260, 890 280 
             C 900 285, 895 298, 880 300 
             C 800 310, 720 330, 650 375 
             C 580 420, 520 490, 480 580 
             L 415 730 
             Z" 
          fill="url(#brandGradient)" />

    <!-- Lower Secondary Wing Swoosh -->
    <path d="M 410 730 
             L 485 580 
             C 520 500, 580 450, 680 435 
             C 750 425, 800 425, 840 435 
             C 850 438, 848 452, 835 455 
             C 760 470, 700 500, 640 550 
             C 580 600, 530 660, 505 730 
             Z" 
          fill="url(#brandGradient)" />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(__dirname, '../public');
  const assetsDir = path.join(publicDir, 'assets');
  const distDir = path.join(__dirname, '../dist');
  const distAssetsDir = path.join(distDir, 'assets');

  [publicDir, assetsDir, distDir, distAssetsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'badge.svg'), svgContent);

  // Render PNGs at target sizes
  const svgBuffer = Buffer.from(svgContent);

  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  const badgeBuffer = await sharp(svgBuffer).resize(96, 96).png().toBuffer();

  // Save to public
  fs.writeFileSync(path.join(publicDir, 'logo.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), png192);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'badge.png'), badgeBuffer);

  // Save to public/assets
  fs.writeFileSync(path.join(assetsDir, 'logo.png'), png512);
  fs.writeFileSync(path.join(assetsDir, 'icon-192x192.png'), png192);
  fs.writeFileSync(path.join(assetsDir, 'icon-512x512.png'), png512);
  fs.writeFileSync(path.join(assetsDir, 'badge.png'), badgeBuffer);

  // Save to dist if exists
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'logo.png'), png512);
    fs.writeFileSync(path.join(distDir, 'icon-192x192.png'), png192);
    fs.writeFileSync(path.join(distDir, 'icon-512x512.png'), png512);
    fs.writeFileSync(path.join(distDir, 'badge.png'), badgeBuffer);
  }
  if (fs.existsSync(distAssetsDir)) {
    fs.writeFileSync(path.join(distAssetsDir, 'logo.png'), png512);
    fs.writeFileSync(path.join(distAssetsDir, 'icon-192x192.png'), png192);
    fs.writeFileSync(path.join(distAssetsDir, 'icon-512x512.png'), png512);
    fs.writeFileSync(path.join(distAssetsDir, 'badge.png'), badgeBuffer);
  }

  console.log('Logo generated successfully!');
}

generate().catch(console.error);
