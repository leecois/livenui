import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const appRequire = createRequire(new URL('../apps/docs/package.json', import.meta.url))
const nextRequire = createRequire(appRequire.resolve('next/package.json'))
const sharp: typeof import('sharp').default = nextRequire('sharp')
const publicDirectory = new URL('../apps/docs/public/', import.meta.url)
const source = await readFile(new URL('logo.svg', publicDirectory), 'utf8')
const fills = [...source.matchAll(/\.mark\s*\{\s*fill:\s*([^;]+);/g)].map((match) => match[1])
if (fills.length !== 2 || !source.includes('<g class="mark">'))
  throw new Error('The brand mark must define light and dark fills')
const rasterSource = source
  .replace(/<style>[\s\S]*?<\/style>/, '')
  .replace('<g class="mark">', '<g fill="' + fills[1] + '">')

const sizes = [16, 32, 48]
const images = await Promise.all(
  sizes.map((size) =>
    sharp(Buffer.from(rasterSource))
      .resize(size, size)
      .flatten({ background: '#191919' })
      .png()
      .toBuffer()
  )
)
const header = Buffer.alloc(6 + sizes.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
for (const [index, image] of images.entries()) {
  const entry = 6 + index * 16
  header[entry] = sizes[index]
  header[entry + 1] = sizes[index]
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(image.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += image.length
}
await writeFile(new URL('favicon.ico', publicDirectory), Buffer.concat([header, ...images]))

const mark = await sharp(Buffer.from(rasterSource)).resize(144, 144).png().toBuffer()
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#191919' } })
  .composite([{ input: mark, left: 18, top: 18 }])
  .png()
  .toFile(new URL('apple-touch-icon.png', publicDirectory).pathname)
console.log('Generated monochrome 16/32/48px favicon and 180px touch icon')
