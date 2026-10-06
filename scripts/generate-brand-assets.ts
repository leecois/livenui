import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const appRequire = createRequire(new URL('../apps/docs/package.json', import.meta.url))
const nextRequire = createRequire(appRequire.resolve('next/package.json'))
const sharp: typeof import('sharp').default = nextRequire('sharp')
const publicDirectory = new URL('../apps/docs/public/', import.meta.url)
const tokenSource = await readFile(
  new URL('../packages/agent-ui/src/tokens.css', import.meta.url),
  'utf8'
)
const colors = ['start', 'end'].map((name) => {
  const value = tokenSource.match(new RegExp(`--livenui-accent-${name}:\\s*([^;]+);`))?.[1]
  if (!value) throw new Error(`Missing accent ${name} token`)
  return value
})
const logoPath = new URL('logo.svg', publicDirectory)
let source = await readFile(logoPath, 'utf8')
let stop = 0
source = source.replace(/stop-color="[^"]+"/g, () => `stop-color="${colors[stop++]}"`)
if (stop !== 2) throw new Error('The brand gradient must have two stops')
await writeFile(logoPath, source)

const sizes = [16, 32, 48]
const images = await Promise.all(
  sizes.map((size) => sharp(Buffer.from(source)).resize(size, size).png().toBuffer())
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

const mark = await sharp(Buffer.from(source)).resize(144, 144).png().toBuffer()
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#ffffff' } })
  .composite([{ input: mark, left: 18, top: 18 }])
  .png()
  .toFile(new URL('apple-touch-icon.png', publicDirectory).pathname)
console.log('Generated SVG gradient, 16/32/48px favicon and 180px touch icon')
