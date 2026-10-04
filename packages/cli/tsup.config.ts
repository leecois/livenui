import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts', './src/build/index.ts'],
  format: 'esm',
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
  target: 'node20',
})
