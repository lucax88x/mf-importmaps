# mf-importmaps

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Microfrontend demo using native ES Module Import Maps to share dependencies and components between microfrontends. A shared component library (`@mf/components`) is consumed by a shell application via browser import maps instead of bundler-based module federation.

## Commands

```bash
# Install dependencies
pnpm install

# Development (all packages in watch mode)
pnpm dev

# Build all packages (components first, then shell via Turbo dependency graph)
pnpm build

# Build and preview the production shell app
pnpm preview
```

Package-specific commands run from their directory or via `pnpm --filter @mf/<package>`.

## Monorepo Structure

- **pnpm workspaces** + **Turborepo** for orchestration
- **Node v24** / **pnpm v10** (managed via mise.toml)

| Package | Path | Purpose |
|---|---|---|
| `@mf/components` | `packages/components/` | Shared library exporting React components, Web Components, and utilities |
| `@mf/shell` | `packages/shell/` | Host app consuming the components library via import maps |

## Architecture

### Import Maps Strategy

- **Dev mode**: Vite resolves `@mf/components` via normal workspace dependency resolution
- **Production build**: The shell's Vite plugin injects an import map into HTML, mapping `@mf/components` to a local path and React/React-DOM to `esm.sh` CDN
- Both packages externalize React at build time so it's shared via the import map

### Dual Export Pattern (components)

The components library exports:
- **React components** (`Button`) — for React consumers
- **Web Components** (`MfButton`, registered as `<mf-button>`) — for framework-agnostic usage
- **Utilities** (`calculate`) — plain functions

### Build Pipeline

1. `@mf/components` builds to a single ES module (`dist/mf-components.js`) via Vite library mode
2. `@mf/shell` builds its app bundle, then a `closeBundle` hook copies the components dist into `shell/dist/mf-components/` for the preview server

### Custom Vite Plugins

- **Shell** (`packages/shell/vite.config.ts`): Externalizes `@mf/components` and React in production, injects import map script tag, copies component artifacts post-build
- **Components** (`packages/components/vite.config.ts`): Library mode build with React externalized

### Web Component Typing

`packages/shell/src/vite-env.d.ts` extends React's JSX `IntrinsicElements` to type the `<mf-button>` custom element.

## Tech Stack

Vite 6, React 19, TypeScript 5, ES Modules throughout. No linting or test framework configured.
