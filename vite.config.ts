import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/fight-match-demo/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
