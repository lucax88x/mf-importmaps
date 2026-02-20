import { defineConfig, type Plugin, type LibraryOptions, type BuildOptions } from 'vite'
import react from '@vitejs/plugin-react'
import * as vite from 'vite'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const libOptions: LibraryOptions = {
  entry: 'src/index.ts',
  formats: ['es'],
  fileName: 'mf-components',
}

const buildExternal: BuildOptions['rollupOptions'] = {
  external: (id: string) => /^react(-dom)?(\/|$)/.test(id),
}

function libraryDevPlugin(): Plugin {
  return {
    name: 'library-dev-server',
    apply: 'serve',

    configureServer(server) {
      const distPath = resolve(__dirname, 'dist/mf-components.js')

      async function build() {
        await vite.build({
          configFile: false,
          root: __dirname,
          plugins: [react()],
          build: {
            lib: libOptions,
            rollupOptions: buildExternal,
            emptyOutDir: true,
          },
          logLevel: 'warn',
        })
      }

      // Initial build
      build()

      // Rebuild on source changes
      server.watcher.on('change', (file) => {
        if (file.includes(resolve(__dirname, 'src'))) {
          build()
        }
      })

      // Serve the built library at /mf-components.js
      server.middlewares.use((req, res, next) => {
        if (req.url === '/mf-components.js') {
          try {
            const content = readFileSync(distPath, 'utf-8')
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
            res.end(content)
          } catch {
            res.statusCode = 404
            res.end('Not found — library not yet built')
          }
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), libraryDevPlugin()],
  server: {
    port: 5174,
    host: true,
    cors: true,
  },
  preview: {
    port: 5174,
    host: true,
    cors: true,
  },
  build: {
    lib: libOptions,
    rollupOptions: buildExternal,
  },
})
