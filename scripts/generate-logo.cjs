const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Precise vector paths matching the user's uploaded brand logo
const logoSvgBase = (fillBg = null) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <linearGradient id="brandGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#081c3b" />
      <stop offset="30%" stop-color="#113e73" />
      <stop offset="65%" stop-color="#1d6e9d" />
      <stop offset="100%" stop-color="#3fa8d4" />
    </linearGradient>
  </defs>

  ${fillBg ? `<rect width="1000" height="1000" fill="${fillBg}" rx="180"/>` : ''}

  <!-- Scaled down to 0.82 for clean, comfortable margins -->
  <g transform="translate(500, 500) scale(0.82) translate(-612.5, -485)">
    <!-- Main Upper Wing Swoosh -->
    <path d="M 315 730 
             L 480 360 
             C 515 285, 580 250, 680 250 
             C 770 250, 850 255, 895 272 
             C 910 278, 910 295, 890 302 
             C 810 320, 720 345, 640 390 
             C 550 440, 490 530, 440 650 
             L 405 730 
             Z" 
          fill="url(#brandGradient)" />

    <!-- Lower Secondary Wing Swoosh -->
    <path d="M 425 730 
             L 490 580 
             C 525 500, 580 445, 670 430 
             C 740 418, 800 420, 835 430 
             C 848 434, 846 448, 830 454 
             C 750 475, 670 515, 610 565 
             C 560 605, 525 645, 515 675 
             L 515 730 
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

  const whiteSvg = logoSvgBase('#ffffff');
  const transparentSvg = logoSvgBase(null);

  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), transparentSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), whiteSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.svg'), whiteSvg);
  fs.writeFileSync(path.join(publicDir, 'badge.svg'), transparentSvg);

  // Buffers
  const whiteBuffer = Buffer.from(whiteSvg);
  const transparentBuffer = Buffer.from(transparentSvg);

  const logoPng = await sharp(whiteBuffer).resize(512, 512).png().toBuffer();
  const icon192Png = await sharp(whiteBuffer).resize(192, 192).png().toBuffer();
  const icon512Png = await sharp(whiteBuffer).resize(512, 512).png().toBuffer();
  const badgePng = await sharp(transparentBuffer).resize(96, 96).png().toBuffer();

  const dirs = [publicDir, assetsDir, distDir, distAssetsDir];
  for (const d of dirs) {
    if (fs.existsSync(d)) {
      fs.writeFileSync(path.join(d, 'logo.png'), logoPng);
      fs.writeFileSync(path.join(d, 'icon-192x192.png'), icon192Png);
      fs.writeFileSync(path.join(d, 'icon-512x512.png'), icon512Png);
      fs.writeFileSync(path.join(d, 'badge.png'), badgePng);
    }
  }

  console.log('Scaled down brand logos generated successfully!');
}

generate().catch(console.error);
