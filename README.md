# mf-importmaps

Microfrontend architecture demo using native browser [Import Maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) to share dependencies across independently deployed microfrontends — no module federation plugin required.

Each microfrontend is a separately built and served ES module bundle. The browser's native `<script type="importmap">` resolves shared dependencies (React, React Query) to a single CDN instance, so all microfrontends share one React runtime and hooks work correctly across module boundaries.

## Quick Start

**Prerequisites:** Node 24, pnpm 10 (managed via [mise](https://mise.jdx.dev/) — see `mise.toml`)

```bash
pnpm install
pnpm dev        # starts all packages in parallel (shell :5250, components :5251, ui :5252)
```

Open http://localhost:5250 to see the shell app.

## Commands

```bash
pnpm install          # install dependencies
pnpm dev              # dev servers for all packages (watch mode)
pnpm build            # production build (respects Turborepo dependency graph)
pnpm preview          # preview production builds locally
pnpm typecheck        # type-check all packages (uses tsgo)
pnpm publish:local    # pack libraries to .local-packages/*.tgz
pnpm docker:up        # build and start Docker containers with nginx proxy
```

Package-specific commands: `pnpm --filter @mf/<package> <script>`

## Monorepo Structure

Orchestrated with **pnpm workspaces** + **Turborepo**.

```
mf-importmaps/
├── infra/vite/              # @mf/infra-vite — shared Vite plugins
├── packages/
│   ├── components/          # @mf/components — shared component library
│   ├── shell/               # @mf/shell — host application
│   └── ui/                  # @mf/ui — UI primitives (MUI, Base UI)
├── proxy/                   # nginx reverse proxy config for Docker
├── docker-compose.yml
├── pnpm-workspace.yaml      # workspace definition + version catalogs
└── turbo.json               # task pipeline
```

### Packages

| Package | Path | Port | Description |
|---|---|---|---|
| `@mf/shell` | `packages/shell/` | 5250 | Host app that consumes components and UI via import maps |
| `@mf/components` | `packages/components/` | 5251 | Shared library: React components, Web Components, utilities |
| `@mf/ui` | `packages/ui/` | 5252 | UI primitives built on MUI v7 and Base UI |
| `@mf/infra-vite` | `infra/vite/` | — | Shared Vite plugins for import maps and multi-entry builds |

### Build Order (Turborepo)

```
@mf/ui → @mf/components → @mf/shell
```

Each library depends on the previous one's build output for type declarations.

## Architecture

### How Import Maps Work Here

The core problem: if each microfrontend bundles its own React, the browser loads multiple copies and React hooks break. Import maps solve this by telling the browser to resolve all `react` imports to a single URL.

```
Browser loads shell (localhost:5250)
  ├── <script type="importmap"> maps:
  │     "react"            → https://esm.sh/react@^19.0.0
  │     "@mf/components"   → http://localhost:5251/index.js
  │     "@mf/ui"           → http://localhost:5252/index.js
  │     "@tanstack/react-query" → https://esm.sh/...?external=react
  │
  ├── Shell bundle imports { Button } from "@mf/components"
  │     → browser fetches from components dev server
  │     → components bundle imports "react"
  │     → browser resolves to same esm.sh URL
  │
  └── Result: single React instance shared across all microfrontends
```

### Dev vs Production

**Dev mode:** Vite dev servers run for each package. The import map plugin (`@mf/infra-vite`) intercepts `resolveId` and marks mapped specifiers as external, pointing to the other dev servers' URLs.

**Production build:** Rolldown externalizes all import-mapped packages. The built HTML contains placeholder URLs (`${MF_COMPONENTS_URL}/index.js`) that get replaced at deploy time via `envsubst`.

**Preview mode:** A Vite preview server middleware replaces the placeholders in-memory with localhost URLs, so you can test the production build without Docker.

### Shared Vite Plugins (`@mf/infra-vite`)

**`createImportMap(config)`** — The core plugin that:
- Reads package versions from `pnpm-workspace.yaml` catalogs
- Generates `esm.sh` CDN URLs via the `external()` helper
- Injects `<script type="importmap">` into HTML
- Externalizes mapped packages during build (via Rolldown)
- Handles placeholder URL replacement in preview mode

**`createExportsPlugin(exports)`** — Multi-entry build plugin that:
- Configures Rolldown to emit named entry files (`button.js`, `PostList.js`, etc.) alongside the main HTML entry
- Rewrites dev server requests (`/button.js` → `/src/exports/Button.tsx`)

### Local Package Distribution

Cross-package type consumption uses a **local tarball workflow** instead of workspace symlinks:

1. `pnpm --filter @mf/ui publish:local` → packs to `.local-packages/mf-ui-0.0.1.tgz`
2. Consumers reference the tarball: `"@mf/ui": "file:../../.local-packages/mf-ui-0.0.1.tgz"`

This simulates real-world package consumption (types come from the tarball's `types/` directory) while keeping everything local and avoiding symlink issues with module resolution.

### Web Components

`@mf/components` exports both React components and Web Components (e.g., `<mf-button>`) for framework-agnostic usage. The Web Components wrap the React components using `customElements.define`.

## Docker Deployment

Three services orchestrated via `docker-compose.yml`:

| Service | Role |
|---|---|
| `components` | Serves `@mf/components` dist via nginx (with CORS headers) |
| `shell` | Serves `@mf/shell` dist via nginx; `envsubst` replaces `${MF_COMPONENTS_URL}` at startup |
| `proxy` | nginx reverse proxy routing `shell.local` and `components.local` |

### Running with Docker

```bash
# Add to /etc/hosts:
# 127.0.0.1 components.local
# 127.0.0.1 shell.local

pnpm docker:up
```

Then open http://shell.local.

## Tech Stack

- **Vite 8 beta** (uses Rolldown bundler + Oxc minifier)
- **React 19** + **TypeScript 5**
- **tsgo** (`@typescript/native-preview`) for type checking
- **Tailwind CSS v4**
- **MUI v7** + **Base UI** (in `@mf/ui`)
- **TanStack React Query v5** (in `@mf/components`)
- **esm.sh** CDN for shared runtime dependencies
- **Turborepo** for monorepo orchestration
- **pnpm 10** with workspace catalogs for version management
