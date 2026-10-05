import { expect, test } from 'bun:test'
import { buildForm, PAD, reliefFor, SPAN } from '../packages/bot-avatars/src/plastic'
import { reliefContours } from '../packages/bot-avatars/src/relief-contours'

const N = 96
const unit = SPAN / N
const branches = [
  [7, 25],
  [43, 61],
  [79, 97],
]
const coverage = Uint8Array.from({ length: N * N }, (_, i) => {
  const x = ((i % N) + 0.5) * unit - PAD
  const y = (Math.floor(i / N) + 0.5) * unit - PAD
  return x >= 9 &&
    x <= 93 &&
    y >= 7 &&
    y <= 97 &&
    (x <= 47 || branches.some(([top, bottom]) => y >= top && y <= bottom))
    ? 255
    : 0
})

for (const depth of [3, 9.75, 30]) {
  test(`concave relief preserves arm openings and nested volume at depth ${depth}`, () => {
    const form = buildForm(coverage, N, depth)
    for (const round of [0.35, 1]) {
      const contours = reliefContours(form, reliefFor(form, 20, round), SPAN, PAD)
      let contained = true
      const areas = contours.map((loops) =>
        loops.reduce((sum, loop) => {
          let area = 0
          for (let i = 0; i < loop.length; i += 2) {
            const x = loop[i],
              y = loop[i + 1],
              j = (i + 2) % loop.length
            contained &&=
              Number.isFinite(x) &&
              Number.isFinite(y) &&
              (x <= 47 + unit ||
                branches.some(([top, bottom]) => y >= top - unit && y <= bottom + unit))
            area += x * loop[j + 1] - loop[j] * y
          }
          return sum + Math.abs(area / 2)
        }, 0)
      )
      expect(contained).toBe(true)
      expect(areas[0]).toBeGreaterThan(5000)
      expect(areas.every((area, i) => i === 0 || area <= areas[i - 1])).toBe(true)
      for (const [top, bottom] of branches)
        expect(
          contours[1].some((loop) =>
            loop.some(
              (x, i) => i % 2 === 0 && x >= 75 && loop[i + 1] >= top && loop[i + 1] <= bottom
            )
          )
        ).toBe(true)
    }
  })
}

test('empty relief produces no contour or non-finite geometry', () => {
  const form = buildForm(new Uint8Array(N * N), N, 9.75)
  expect(
    reliefContours(form, reliefFor(form, 20, 1), SPAN, PAD).every((loops) => loops.length === 0)
  ).toBe(true)
})
