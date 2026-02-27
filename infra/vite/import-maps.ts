import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

type ImportMapConfig = {
	imports: Record<string, string>;
	verbose?: boolean;
	/** Map placeholders to dev URLs (e.g., "${MF_COMPONENTS_URL}" -> "http://localhost:5251").
	 *  Build output keeps placeholders (for nginx envsubst), dev/preview replaces them with local URLs. */
	devBaseReplace?: Record<string, string>;
};

function getBasePackageName(specifier: string): string {
	if (specifier.startsWith("@")) {
		const parts = specifier.split("/");
		return parts.slice(0, 2).join("/");
	}
	return specifier.split("/")[0];
}

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const createImportMap = (config: ImportMapConfig) => {
	const { imports, verbose = false, devBaseReplace } = config;

	const baseNames = new Set(Object.keys(imports).map(getBasePackageName));

	const externalPatterns = [...baseNames].map(
		(name) => new RegExp(`^${escapeRegExp(name)}(\\/|$)`),
	);

	const exclude = [...baseNames];

	const devImports = devBaseReplace
		? Object.fromEntries(
				Object.entries(imports).map(([key, url]) => {
					let resolved = url;
					for (const [from, to] of Object.entries(devBaseReplace)) {
						resolved = resolved.replace(from, to);
					}
					return [key, resolved];
				}),
			)
		: imports;

	const plugin = (): Plugin => {
		let isBuild = false;

		return {
			name: "import-map",
			enforce: "pre",

			config(_, { command }) {
				isBuild = command === "build";

				if (!isBuild) {
					return undefined;
				}

				return {
					build: {
						rolldownOptions: {
							external: externalPatterns,
							output: {
								format: "es" as const,
							},
						},
					},
				};
			},

			resolveId(source) {
				if (isBuild) {
					return undefined;
				}

				if (source in devImports) {
					const resolved = devImports[source];
					if (verbose) {
						console.log(`[import-map] EXTERNAL ${source} -> ${resolved}`);
					}
					return { id: resolved, external: true };
				}

				return undefined;
			},

			transformIndexHtml: {
				order: "post",
				handler() {
					const resolvedImports = isBuild ? imports : devImports;
					return [
						{
							tag: "script",
							attrs: { type: "importmap" },
							children: JSON.stringify({ imports: resolvedImports }, null, 2),
							injectTo: "head-prepend" as const,
						},
					];
				},
			},

			configurePreviewServer(server) {
				if (!devBaseReplace) return;

				const replaceEntries = Object.entries(devBaseReplace);

				server.middlewares.use((req, res, next) => {
					const url = req.url || "/";
					if (url !== "/" && !url.endsWith(".html")) {
						next();
						return;
					}

					const htmlPath = url === "/" ? "index.html" : url.slice(1);
					const fullPath = resolve(
						server.config.root,
						server.config.build.outDir,
						htmlPath,
					);

					try {
						let html = readFileSync(fullPath, "utf-8");
						for (const [placeholder, devUrl] of replaceEntries) {
							html = html.replaceAll(placeholder, devUrl);
						}
						res.setHeader("Content-Type", "text/html");
						res.end(html);
					} catch {
						next();
					}
				});
			},
		};
	};

	return {
		plugin,
		optimizeDeps: { exclude },
	};
};

export const createExportsPlugin = (
	exports: Record<string, string>,
	htmlEntry = "index.html",
): Plugin => {
	const entryNames = new Set(Object.keys(exports));
	const rewrites = new Map(
		Object.entries(exports).map(([name, src]) => [`/${name}.js`, `/${src}`]),
	);

	return {
		name: "exports",
		enforce: "pre",

		config(_, { command }) {
			const isBuild = command === "build";

			if (!isBuild) {
				return;
			}

			return {
				build: {
					rolldownOptions: {
						preserveEntrySignatures: "exports-only",
						input: {
							...exports,
							app: htmlEntry,
						},
						output: {
							entryFileNames: (chunk) =>
								entryNames.has(chunk.name)
									? "[name].js"
									: "assets/[name]-[hash].js",
							chunkFileNames: "assets/[name]-[hash].js",
							assetFileNames: "assets/[name]-[hash][extname]",
						},
					},
				},
			};
		},

		configureServer(server) {
			server.middlewares.use((req, _res, next) => {
				if (!req.url) {
					next();
					return;
				}

				const rewrite = rewrites.get(req.url);
				if (rewrite) {
					req.url = rewrite;
				}

				next();
			});
		},
	};
};
