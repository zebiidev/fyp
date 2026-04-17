import sharp from 'sharp';

async function resize() {
  try {
    await sharp('public/favicon.png')
      .resize(192, 192)
      .toFile('public/pwa-192x192.png');
    console.log('Created 192x192');

    await sharp('public/favicon.png')
      .resize(512, 512)
      .toFile('public/pwa-512x512.png');
    console.log('Created 512x512');
  } catch (err) {
    console.error('Error resizing:', err);
  }
}

resize();
