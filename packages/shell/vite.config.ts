import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cpSync, existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const IMPORT_MAP = {
  imports: {
    '@mf/components': '/mf-components/mf-components.js',
    'react': 'https://esm.sh/react@^19',
    'react/jsx-runtime': 'https://esm.sh/react@^19/jsx-runtime',
    'react-dom/client': 'https://esm.sh/react-dom@^19/client?external=react',
  },
}

function importMapPlugin(): Plugin {
  let isBuild = false

  return {
    name: 'import-map',

    config(_, { command }) {
      isBuild = command === 'build'
      if (isBuild) {
        return {
          build: {
            rollupOptions: {
              external: (id: string) =>
                id === '@mf/components' || /^react(-dom)?(\/|$)/.test(id),
              output: {
                format: 'es' as const,
              },
            },
          },
        }
      }
    },

    transformIndexHtml: {
      order: 'post',
      handler() {
        if (!isBuild) return []
        return [
          {
            tag: 'script',
            attrs: { type: 'importmap' },
            children: JSON.stringify(IMPORT_MAP, null, 2),
            injectTo: 'head-prepend' as const,
          },
        ]
      },
    },

    closeBundle() {
      if (!isBuild) return
      // Copy components dist into shell dist so preview server can serve them
      const src = resolve(__dirname, '../components/dist')
      const dest = resolve(__dirname, 'dist/mf-components')
      if (existsSync(src)) {
        cpSync(src, dest, { recursive: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), importMapPlugin()],
})
