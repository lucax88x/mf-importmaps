import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { esmExternalRequirePlugin, type Plugin } from "vite";
import { escapeRegExp, getBasePackageName } from "./utils";
import { getWorkspacePackages } from "./workspace";

export type ManifestV1 = {
	version: 1;
	imports: Record<string, string>;
	devBaseReplace: Record<string, string>;
};

export type RemoteConfig = {
	/** Placeholder URL base used in imports, e.g. "${MF_COMPONENTS_URL}" */
	url: string;
	/** Dev server base URL, e.g. "http://localhost:5251" */
	devUrl: string;
};

export type ImportMapConfig = {
	imports: Record<string, string>;
	verbose?: boolean;
	/** Map placeholders to dev URLs (e.g., "${MF_COMPONENTS_URL}" -> "http://localhost:5251").
	 *  Build output keeps placeholders (for nginx envsubst), dev/preview replaces them with local URLs. */
	devBaseReplace?: Record<string, string>;
	/** Base package names whose `require()` calls should be converted to ESM imports via esmExternalRequirePlugin. */
	esmRequireExternals?: string[];
	/** Remote microfrontend dependencies whose transitive import map entries should be auto-merged. */
	remotes?: RemoteConfig[];
};

const PLACEHOLDER_RE = /\$\{[^}]+\}/;

function extractMfImports(
	imports: Record<string, string>,
): Record<string, string> {
	return Object.fromEntries(
		Object.entries(imports).filter(([, url]) => PLACEHOLDER_RE.test(url)),
	);
}

function extractMfDevBaseReplace(
	devBaseReplace: Record<string, string> | undefined,
	mfImports: Record<string, string>,
): Record<string, string> {
	if (!devBaseReplace) return {};
	const usedPlaceholders = new Set(
		Object.values(mfImports)
			.map((url) => url.match(/\$\{[^}]+\}/)?.[0])
			.filter(Boolean) as string[],
	);
	return Object.fromEntries(
		Object.entries(devBaseReplace).filter(([key]) =>
			usedPlaceholders.has(key),
		),
	);
}

function readManifestFromDisk(manifestPath: string): ManifestV1 | null {
	try {
		const content = readFileSync(manifestPath, "utf-8");
		return JSON.parse(content) as ManifestV1;
	} catch {
		return null;
	}
}

function findPackageDir(packageName: string, root: string): string | null {
	// Prefer workspace package directories (works even with file: tarball installs).
	const workspacePackages = getWorkspacePackages(root);
	const wsDir = workspacePackages.get(packageName);
	if (wsDir) return wsDir;

	// Fall back to walking up node_modules (works for regular npm installs).
	let dir = root;
	while (true) {
		const candidate = resolve(dir, "node_modules", packageName);
		if (existsSync(candidate)) return candidate;
		const parent = resolve(dir, "..");
		if (parent === dir) return null;
		dir = parent;
	}
}

function findRemoteManifestPath(
	remote: RemoteConfig,
	imports: Record<string, string>,
	root: string,
): string | null {
	let packageName: string | null = null;
	for (const [specifier, url] of Object.entries(imports)) {
		if (url.startsWith(remote.url)) {
			packageName = getBasePackageName(specifier);
			break;
		}
	}
	if (!packageName) return null;
	const pkgDir = findPackageDir(packageName, root);
	if (!pkgDir) return null;
	return resolve(pkgDir, "dist", "importmap-manifest.json");
}

function loadTransitiveManifests(
	remotes: RemoteConfig[] | undefined,
	imports: Record<string, string>,
	root: string,
): ManifestV1[] {
	if (!remotes?.length) return [];
	const manifests: ManifestV1[] = [];
	for (const remote of remotes) {
		const manifestPath = findRemoteManifestPath(remote, imports, root);
		if (!manifestPath) {
			console.warn(
				`[import-map] Could not find package for remote ${remote.url}`,
			);
			continue;
		}
		const manifest = readManifestFromDisk(manifestPath);
		if (!manifest) {
			console.warn(
				`[import-map] Could not read manifest for remote ${remote.url} at ${manifestPath}`,
			);
			continue;
		}
		manifests.push(manifest);
	}
	return manifests;
}

function mergeManifests(
	ownImports: Record<string, string>,
	ownDevBaseReplace: Record<string, string> | undefined,
	transitiveManifests: ManifestV1[],
): { imports: Record<string, string>; devBaseReplace: Record<string, string> } {
	const mergedImports: Record<string, string> = {};
	const mergedDevBaseReplace: Record<string, string> = {};
	for (const manifest of transitiveManifests) {
		for (const [key, url] of Object.entries(manifest.imports)) {
			if (!(key in ownImports) && !(key in mergedImports)) {
				mergedImports[key] = url;
			}
		}
		for (const [key, url] of Object.entries(manifest.devBaseReplace)) {
			if (!(key in (ownDevBaseReplace ?? {})) && !(key in mergedDevBaseReplace)) {
				mergedDevBaseReplace[key] = url;
			}
		}
	}
	return { imports: mergedImports, devBaseReplace: mergedDevBaseReplace };
}

export function resolveDevImports(
	imports: Record<string, string>,
	devBaseReplace?: Record<string, string>,
): Record<string, string> {
	if (!devBaseReplace) {
		return imports;
	}
	return Object.fromEntries(
		Object.entries(imports).map(([key, url]) => {
			let resolved = url;
			for (const [from, to] of Object.entries(devBaseReplace)) {
				resolved = resolved.replace(from, to);
			}
			return [key, resolved];
		}),
	);
}

export function buildExternalPatterns(
	baseNames: Set<string>,
	esmRequireExternals?: string[],
): RegExp[] {
	const allPatterns = [...baseNames].map(
		(name) => new RegExp(`^${escapeRegExp(name)}(\\/|$)`),
	);

	const esmRequireSet = new Set(esmRequireExternals);
	if (!esmRequireSet.size) {
		return allPatterns;
	}

	return allPatterns.filter((_, i) => !esmRequireSet.has([...baseNames][i]));
}

export function buildEsmRequirePatterns(
	esmRequireExternals?: string[],
): RegExp[] | undefined {
	if (!esmRequireExternals?.length) {
		return undefined;
	}
	return esmRequireExternals.map(
		(name) => new RegExp(`^${escapeRegExp(name)}(\\/|$)`),
	);
}

export const createImportMapPlugin = (config: ImportMapConfig) => {
	const {
		imports,
		verbose = false,
		devBaseReplace,
		esmRequireExternals,
		remotes,
	} = config;

	// Load transitive manifests synchronously at plugin-creation time so they are
	// available for externalization and resolveId without any async dance.
	const transitiveManifests = loadTransitiveManifests(
		remotes,
		imports,
		process.cwd(),
	);
	const { imports: transitiveImports, devBaseReplace: transitiveDevBaseReplace } =
		mergeManifests(imports, devBaseReplace, transitiveManifests);

	// Consumer's own entries win; transitive entries fill in the gaps.
	const allImports = { ...transitiveImports, ...imports };
	const allDevBaseReplace = { ...transitiveDevBaseReplace, ...(devBaseReplace ?? {}) };

	const baseNames = new Set(Object.keys(allImports).map(getBasePackageName));
	const exclude = [...baseNames];
	const devImports = resolveDevImports(allImports, allDevBaseReplace);

	// Pre-compute the manifest this producer will expose (own MF imports + flattened transitive).
	const ownMfImports = extractMfImports(imports);
	const ownMfDevBaseReplace = extractMfDevBaseReplace(devBaseReplace, ownMfImports);
	const producerManifest: ManifestV1 = {
		version: 1,
		imports: { ...transitiveImports, ...ownMfImports },
		devBaseReplace: { ...transitiveDevBaseReplace, ...ownMfDevBaseReplace },
	};

	const plugin = (): Plugin => {
		let isBuild = false;
		let outDir = "dist";

		return {
			name: "import-map",
			enforce: "pre",

			config(_, { command }) {
				isBuild = command === "build";

				if (!isBuild) {
					return undefined;
				}

				const filteredExternalPatterns = buildExternalPatterns(
					baseNames,
					esmRequireExternals,
				);
				const esmRequirePatterns = buildEsmRequirePatterns(esmRequireExternals);

				return {
					build: {
						rolldownOptions: {
							external: filteredExternalPatterns,
							output: {
								format: "es" as const,
							},
							...(esmRequirePatterns?.length && {
								plugins: [
									esmExternalRequirePlugin({
										external: esmRequirePatterns,
									}),
								],
							}),
						},
					},
				};
			},

			configResolved(resolvedConfig) {
				outDir = resolve(resolvedConfig.root, resolvedConfig.build.outDir);
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
					const resolvedImports = isBuild ? allImports : devImports;
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

			closeBundle() {
				if (!isBuild) return;
				const manifestPath = resolve(outDir, "importmap-manifest.json");
				writeFileSync(
					manifestPath,
					JSON.stringify(producerManifest, null, 2),
				);
			},

			configureServer(server) {
				const manifestJson = JSON.stringify(producerManifest, null, 2);
				server.middlewares.use((req, res, next) => {
					if (req.url === "/__importmap-manifest.json") {
						res.setHeader("Content-Type", "application/json");
						res.setHeader("Access-Control-Allow-Origin", "*");
						res.end(manifestJson);
						return;
					}
					next();
				});
			},

			configurePreviewServer(server) {
				if (!Object.keys(allDevBaseReplace).length) return;

				const replaceEntries = Object.entries(allDevBaseReplace);
				const base = (server.config.base || "/").replace(/\/$/, "");

				server.middlewares.use((req, res, next) => {
					const url = req.url || "/";

					// Strip base prefix to get the local path
					let path: string;
					if (base) {
						if (url === base || url.startsWith(`${base}/`)) {
							path = url.slice(base.length) || "/";
						} else {
							next();
							return;
						}
					} else {
						path = url;
					}

					// Skip static assets (have a file extension that isn't .html)
					const filename = path.split("/").pop() || "";

					if (filename.includes(".") && !filename.endsWith(".html")) {
						next();
						return;
					}

					// For .html files serve that file, for routes (no extension) serve index.html
					const htmlPath = filename.endsWith(".html")
						? path.slice(1)
						: "index.html";

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
			const base = (server?.config?.base || "/").replace(/\/$/, "");

			const rewrites = new Map(
				Object.entries(exports).map(([name, src]) => [
					`${base}/${name}.js`,
					`${base}/${src}`,
				]),
			);

			server.middlewares.use((req, _res, next) => {
				if (!req.url) {
					next();
					return;
				}

				const rewrite = rewrites.get(req.url);

				if (rewrite) {
					console.log(`[exports] rewrite ${req.url} -> ${rewrite}`);
					req.url = rewrite;
				}

				next();
			});
		},
	};
};
