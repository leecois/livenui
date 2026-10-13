export const orbDensityLimit = 10

const conservativeCountBounds: Record<string, number> = {
  latRings: 17,
  rings: 15,
  lonDensity: 44,
  lanes: 5,
  segs: 88,
  orbitN: 12,
  ghostN: 150,
  nodeN: 41,
  strandN: 52,
  signals: 7,
  particles: 3,
  moveCount: 14,
}
const pairedCounts = new Set(['latRings', 'rings', 'lonDensity', 'lanes', 'segs'])
const fixedCounts = new Set(['particles', 'moveCount'])

export function orbRenderCost(props: Record<string, unknown>) {
  const state = String(props.state ?? 'working')
  const density = Number(props.dots ?? 1)
  const opts = (props.opts ?? {}) as Record<string, number>
  const count = (name: string) => {
    if (opts[name] !== undefined) return opts[name]
    const base = name === 'ghostN' && state === 'working' ? 40 : conservativeCountBounds[name]
    return fixedCounts.has(name)
      ? base
      : Math.max(
          pairedCounts.has(name) ? 2 : 1,
          Math.round(base * (pairedCounts.has(name) ? Math.sqrt(density) : density))
        )
  }
  let marks = 0
  let pairs = 0
  let iterations = 0
  switch (state) {
    case 'connecting': {
      const nodes = count('nodeN')
      pairs = (nodes * (nodes - 1)) / 2
      marks = nodes + count('signals') + pairs
      break
    }
    case 'searching':
    case 'solving':
    case 'listening': {
      const rings = count(state === 'listening' ? 'rings' : 'latRings') + 1
      marks = rings * Math.max(1, count('lonDensity'))
      iterations = rings + (state === 'solving' ? marks * count('moveCount') : 0)
      break
    }
    case 'weaving':
      marks = count('ghostN') + 3 * count('strandN')
      break
    case 'composing':
    case 'breathing': {
      const lanes = Math.max(1, Math.round(count('lanes') * (opts.bandMul ?? 5)))
      marks = count('ghostN') + lanes * count('segs')
      iterations = lanes
      break
    }
    case 'shaping':
      marks = Math.max(6, Math.round(34 * (opts.iconD ?? density)))
      break
    default:
      marks = count('orbitN') * (count('ghostN') + count('particles'))
      iterations = count('orbitN')
  }
  return { marks, pairs, iterations: iterations + marks + pairs }
}

export function validateOrbConfiguration(props: Record<string, unknown>) {
  if (props.state === 'shaping' && typeof props.speed === 'number' && props.speed < 0)
    throw new Error('Shaping orbs require a non-negative speed in the playground.')
  const density = props.dots ?? 1
  if (
    typeof density !== 'number' ||
    !Number.isFinite(density) ||
    density < 0.1 ||
    density > orbDensityLimit
  )
    throw new Error(`dots must be between 0.1 and ${orbDensityLimit} in the playground.`)
  const opts = (props.opts ?? {}) as Record<string, number>
  for (const key of Object.keys(conservativeCountBounds)) {
    const value = opts[key]
    if (value === undefined) continue
    if (!Number.isInteger(value) || value < 0 || value > 10000)
      throw new Error(`opts.${key} must be a non-negative whole number no greater than 10000.`)
    if ((key === 'latRings' || key === 'rings') && value === 0)
      throw new Error(`opts.${key} must be greater than zero.`)
  }
  for (const key of ['bandMul', 'iconD']) {
    const value = opts[key]
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 10000))
      throw new Error(`opts.${key} must be between 0 and 10000.`)
  }
  const { marks, pairs, iterations } = orbRenderCost(props)
  if (marks > 10000 || pairs > 20000 || iterations > 200000)
    throw new Error(
      'Orb configuration exceeds the playground render budget. Reduce dots or count overrides in opts.'
    )
}
