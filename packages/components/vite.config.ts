import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'mf-components',
    },
    rollupOptions: {
      external: (id) => /^react(-dom)?(\/|$)/.test(id),
    },
  },
})
