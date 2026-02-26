import type { Plugin } from "vite";

type ImportMapConfig = {
	imports: Record<string, string>;
	external: RegExp[];
};

function getBasePackageName(specifier: string): string {
	if (specifier.startsWith("@")) {
		// @scope/name/sub -> @scope/name
		const parts = specifier.split("/");
		return parts.slice(0, 2).join("/");
	}
	// name/sub -> name
	return specifier.split("/")[0];
}

export const createImportMap = (config: ImportMapConfig) => {
	const { imports, external } = config;

	const exclude = [
		...new Set(
			Object.keys(imports)
				.filter((key) => external.some((re) => re.test(key)))
				.map(getBasePackageName),
		),
	];

	const plugin = (): Plugin => {
		let isBuild = false;

		return {
			name: "import-map",
			enforce: "pre",

			config(_, { command }) {
				isBuild = command === "build";

				if (!isBuild) {
					return;
				}

				return {
					build: {
						rolldownOptions: {
							external: (id: string) => {
								const isExternal = external.some((re) => re.test(id));

								console.info(
									`[import-map] ${isExternal ? "EXTERNAL" : "BUNDLED "} ${id}`,
								);

								return isExternal;
							},
							output: {
								format: "es" as const,
							},
						},
					},
				};
			},

			resolveId(source) {
				if (isBuild) {
					return;
				}

				if (source in imports) {
					const resolved = imports[source as keyof typeof imports];

					console.log(
						`[import-map] resolveId EXTERNAL ${source} -> ${resolved}`,
					);
					return {
						id: resolved,
						external: true,
					};
				}
				console.log(`[import-map] resolveId BUNDLED ${source}`);
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
				const rewrite = rewrites.get(req.url!);
				if (rewrite) {
					req.url = rewrite;
				}
				next();
			});
		},
	};
};
