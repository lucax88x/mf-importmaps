import type { Plugin } from "vite";

type ImportMapConfig = {
	imports: Record<string, string>;
	verbose?: boolean;
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
	const { imports, verbose = false } = config;

	const baseNames = new Set(Object.keys(imports).map(getBasePackageName));

	const externalPatterns = [...baseNames].map(
		(name) => new RegExp(`^${escapeRegExp(name)}(\\/|$)`),
	);

	const exclude = [...baseNames];

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

				if (source in imports) {
					const resolved = imports[source];
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
					return [
						{
							tag: "script",
							attrs: { type: "importmap" },
							children: JSON.stringify({ imports }, null, 2),
							injectTo: "head-prepend" as const,
						},
					];
				},
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
