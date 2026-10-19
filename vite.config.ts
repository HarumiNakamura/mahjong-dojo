import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // scripts/prerender.mjs が、ページごとに必要な CSS を調べるのに使う
  build: { manifest: true },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
