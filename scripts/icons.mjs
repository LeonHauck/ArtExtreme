/**
 * Gera favicon e ícones do app (PWA/iOS) a partir do logo do estúdio.
 * Uso: npm run icons
 *
 * O logo é horizontal, então ele vai centralizado sobre um fundo escuro
 * com um brilho roxo, mantendo a margem de segurança dos ícones "maskable".
 */
import sharp from 'sharp'

const LOGO = 'public/brand/logo.webp'
const BG = '#08070b'

/** Fundo quadrado com brilho radial roxo/laranja. */
function background(size, rounded) {
  const r = rounded ? Math.round(size * 0.22) : 0
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <radialGradient id="g" cx="50%" cy="38%" r="70%">
          <stop offset="0" stop-color="#be38f3" stop-opacity="0.55"/>
          <stop offset="0.55" stop-color="#5e1a7e" stop-opacity="0.25"/>
          <stop offset="1" stop-color="${BG}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${r}" fill="${BG}"/>
      <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
    </svg>`)
}

/** Compõe o logo ocupando `fill` da largura do ícone. */
async function icon(size, fill, out, { rounded = false } = {}) {
  const logo = await sharp(LOGO).resize({ width: Math.round(size * fill) }).toBuffer()
  await sharp(background(size, rounded))
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log('✓', out)
}

await icon(64, 0.94, 'public/favicon-64x64.png', { rounded: true })
await icon(192, 0.86, 'public/pwa-192x192.png')
await icon(512, 0.86, 'public/pwa-512x512.png')
// maskable: o sistema recorta até 20% das bordas, então o logo fica menor
await icon(512, 0.7, 'public/maskable-icon-512x512.png')
await icon(180, 0.84, 'public/apple-touch-icon-180x180.png')
