const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Exact Brand Wing Logo SVG with perfect geometry, centering and padding
const logoSvgBase = (fillBg = null) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <linearGradient id="brandGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0b2545" />
      <stop offset="35%" stop-color="#134074" />
      <stop offset="70%" stop-color="#1d6a96" />
      <stop offset="100%" stop-color="#3fa8d4" />
    </linearGradient>
    <linearGradient id="brandGradientLight" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#60c5ef" />
    </linearGradient>
  </defs>

  ${fillBg ? `<rect width="1000" height="1000" fill="${fillBg}" rx="180"/>` : ''}

  <g transform="translate(500, 500) scale(0.72) translate(-602.5, -490)">
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
          fill="${fillBg === '#051b42' ? 'url(#brandGradientLight)' : 'url(#brandGradient)'}" />

    <!-- Lower Secondary Wing Swoosh -->
    <path d="M 410 730 
             L 485 580 
             C 520 500, 580 450, 680 435 
             C 750 425, 800 425, 840 435 
             C 850 438, 848 452, 835 455 
             C 760 470, 700 500, 640 550 
             C 580 600, 530 660, 505 730 
             Z" 
          fill="${fillBg === '#051b42' ? 'url(#brandGradientLight)' : 'url(#brandGradient)'}" />
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
  const darkSvg = logoSvgBase('#ffffff'); // White background ensures clean squircle icon on Android notification & home screen
  const transparentSvg = logoSvgBase(null);

  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), transparentSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), darkSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.svg'), darkSvg);
  fs.writeFileSync(path.join(publicDir, 'badge.svg'), transparentSvg);

  // Buffers
  const whiteBuffer = Buffer.from(whiteSvg);
  const darkBuffer = Buffer.from(darkSvg);
  const transparentBuffer = Buffer.from(transparentSvg);

  const logoPng = await sharp(whiteBuffer).resize(512, 512).png().toBuffer();
  const icon192Png = await sharp(darkBuffer).resize(192, 192).png().toBuffer();
  const icon512Png = await sharp(darkBuffer).resize(512, 512).png().toBuffer();
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

  console.log('Centered & proportioned brand logos generated successfully!');
}

generate().catch(console.error);
