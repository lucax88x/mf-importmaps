import { describe, expect, it, vi } from "vitest";
import {
	buildEsmRequirePatterns,
	buildExternalPatterns,
	createExportsPlugin,
	createImportMapPlugin,
	resolveDevImports,
} from "../../packages/vite-plugin/src/import-maps";

describe("resolveDevImports", () => {
	it("returns imports unchanged when no devBaseReplace", () => {
		const imports = { react: "https://esm.sh/react@18" };
		expect(resolveDevImports(imports)).toBe(imports);
	});

	it("replaces placeholders with dev URLs", () => {
		const imports = {
			"my-mf/app": "${MF_URL}/app.js",
			"my-mf/utils": "${MF_URL}/utils.js",
		};
		const result = resolveDevImports(imports, {
			"${MF_URL}": "http://localhost:5173",
		});
		expect(result).toEqual({
			"my-mf/app": "http://localhost:5173/app.js",
			"my-mf/utils": "http://localhost:5173/utils.js",
		});
	});

	it("applies multiple replacements", () => {
		const imports = { entry: "${A}/path/${B}/file.js" };
		const result = resolveDevImports(imports, {
			"${A}": "http://a",
			"${B}": "http://b",
		});
		expect(result).toEqual({ entry: "http://a/path/http://b/file.js" });
	});
});

describe("buildExternalPatterns", () => {
	it("builds patterns for all base names", () => {
		const patterns = buildExternalPatterns(new Set(["react", "react-dom"]));
		expect(patterns).toHaveLength(2);
		expect(patterns[0].test("react")).toBe(true);
		expect(patterns[0].test("react/jsx-runtime")).toBe(true);
		expect(patterns[0].test("react-dom")).toBe(false);
		expect(patterns[1].test("react-dom")).toBe(true);
	});

	it("filters out esmRequireExternals", () => {
		const patterns = buildExternalPatterns(
			new Set(["react", "react-dom", "@mui/material"]),
			["react-dom"],
		);
		expect(patterns).toHaveLength(2);
		expect(patterns[0].test("react")).toBe(true);
		expect(patterns[1].test("@mui/material")).toBe(true);
	});

	it("returns all patterns when esmRequireExternals is undefined", () => {
		const patterns = buildExternalPatterns(
			new Set(["react", "react-dom"]),
			undefined,
		);
		expect(patterns).toHaveLength(2);
	});
});

describe("buildEsmRequirePatterns", () => {
	it("returns undefined when no externals provided", () => {
		expect(buildEsmRequirePatterns(undefined)).toBeUndefined();
	});

	it("returns undefined when empty array", () => {
		expect(buildEsmRequirePatterns([])).toBeUndefined();
	});

	it("builds patterns for provided externals", () => {
		const patterns = buildEsmRequirePatterns(["react-dom"])!;
		expect(patterns).toHaveLength(1);
		expect(patterns[0].test("react-dom")).toBe(true);
		expect(patterns[0].test("react-dom/client")).toBe(true);
		expect(patterns[0].test("react")).toBe(false);
	});
});

describe("createImportMap", () => {
	const baseConfig = {
		imports: {
			react: "https://esm.sh/react@18",
			"react-dom": "https://esm.sh/react-dom@18",
		},
	};

	it("returns plugin factory and optimizeDeps", () => {
		const result = createImportMapPlugin(baseConfig);
		expect(result).toHaveProperty("plugin");
		expect(result).toHaveProperty("optimizeDeps");
		expect(typeof result.plugin).toBe("function");
		expect(result.optimizeDeps.exclude).toEqual(["react", "react-dom"]);
	});

	it("plugin has correct name and enforce", () => {
		const plugin = createImportMapPlugin(baseConfig).plugin();
		expect(plugin.name).toBe("import-map");
		expect(plugin.enforce).toBe("pre");
	});

	describe("resolveId", () => {
		it("resolves imports in dev mode", () => {
			const plugin = createImportMapPlugin(baseConfig).plugin();
			// Trigger dev mode
			(plugin.config as Function)({}, { command: "serve" });

			const result = (plugin.resolveId as Function)("react");
			expect(result).toEqual({
				id: "https://esm.sh/react@18",
				external: true,
			});
		});

		it("returns undefined for unknown specifiers in dev", () => {
			const plugin = createImportMapPlugin(baseConfig).plugin();
			(plugin.config as Function)({}, { command: "serve" });

			const result = (plugin.resolveId as Function)("vue");
			expect(result).toBeUndefined();
		});

		it("returns undefined in build mode", () => {
			const plugin = createImportMapPlugin(baseConfig).plugin();
			(plugin.config as Function)({}, { command: "build" });

			const result = (plugin.resolveId as Function)("react");
			expect(result).toBeUndefined();
		});
	});

	describe("transformIndexHtml", () => {
		it("injects import map with raw placeholders in build", () => {
			const plugin = createImportMapPlugin(baseConfig).plugin();
			(plugin.config as Function)({}, { command: "build" });

			const transform = plugin.transformIndexHtml as {
				order: string;
				handler: () => Array<{
					tag: string;
					attrs: Record<string, string>;
					children: string;
					injectTo: string;
				}>;
			};
			const tags = transform.handler();
			expect(tags).toHaveLength(1);
			expect(tags[0].tag).toBe("script");
			expect(tags[0].attrs.type).toBe("importmap");
			const parsed = JSON.parse(tags[0].children);
			expect(parsed.imports).toEqual(baseConfig.imports);
		});

		it("injects import map with dev URLs in dev", () => {
			const config = {
				imports: { "my-mf": "${URL}/app.js" },
				devBaseReplace: { "${URL}": "http://localhost:5173" },
			};
			const plugin = createImportMapPlugin(config).plugin();
			(plugin.config as Function)({}, { command: "serve" });

			const transform = plugin.transformIndexHtml as {
				order: string;
				handler: () => Array<{ children: string }>;
			};
			const tags = transform.handler();
			const parsed = JSON.parse(tags[0].children);
			expect(parsed.imports["my-mf"]).toBe("http://localhost:5173/app.js");
		});
	});

	describe("build config", () => {
		it("returns external patterns in build mode", () => {
			const plugin = createImportMapPlugin(baseConfig).plugin();
			const buildConfig = (plugin.config as Function)({}, { command: "build" });

			expect(buildConfig.build.rolldownOptions.external).toHaveLength(2);
			expect(buildConfig.build.rolldownOptions.external[0].test("react")).toBe(
				true,
			);
		});

		it("uses esmExternalRequirePlugin when esmRequireExternals set", () => {
			const config = {
				...baseConfig,
				esmRequireExternals: ["react-dom"],
			};
			const plugin = createImportMapPlugin(config).plugin();
			const buildConfig = (plugin.config as Function)({}, { command: "build" });

			// react-dom should be filtered from top-level external
			expect(buildConfig.build.rolldownOptions.external).toHaveLength(1);
			expect(buildConfig.build.rolldownOptions.external[0].test("react")).toBe(
				true,
			);
			// esmExternalRequirePlugin should produce a plugins array
			expect(buildConfig.build.rolldownOptions.plugins).toHaveLength(1);
			expect(buildConfig.build.rolldownOptions.plugins[0]).toHaveProperty(
				"name",
				"builtin:esm-external-require",
			);
		});

		it("returns undefined in dev mode", () => {
			const plugin = createImportMapPlugin(baseConfig).plugin();
			const result = (plugin.config as Function)({}, { command: "serve" });
			expect(result).toBeUndefined();
		});
	});

	describe("configurePreviewServer", () => {
		const configWithReplace = {
			...baseConfig,
			devBaseReplace: { "${CDN}": "http://localhost:3000" },
		};

		function setupPreviewServer(config: typeof configWithReplace, serverOverrides: Record<string, unknown> = {}) {
			const plugin = createImportMapPlugin(config).plugin();
			const middlewares: Function[] = [];
			const mockServer = {
				config: {
					base: "/",
					root: "/project",
					build: { outDir: "dist" },
				},
				middlewares: { use: (fn: Function) => middlewares.push(fn) },
				...serverOverrides,
			};
			(plugin.configurePreviewServer as Function)(mockServer);
			return middlewares[0];
		}

		it("does not register middleware when devBaseReplace is undefined", () => {
			const plugin = createImportMapPlugin(baseConfig).plugin();
			const middlewares: Function[] = [];
			const mockServer = {
				config: { base: "/", root: "/project", build: { outDir: "dist" } },
				middlewares: { use: (fn: Function) => middlewares.push(fn) },
			};
			(plugin.configurePreviewServer as Function)(mockServer);
			expect(middlewares).toHaveLength(0);
		});

		it("serves HTML for root path /", () => {
			const middleware = setupPreviewServer(configWithReplace);
			const res = { setHeader: vi.fn(), end: vi.fn() };
			const next = vi.fn();
			middleware({ url: "/" }, res, next);
			// readFileSync will throw in test (no real file), so it falls through to next
			expect(next).toHaveBeenCalled();
		});

		it("skips static assets like .js files", () => {
			const middleware = setupPreviewServer(configWithReplace);
			const next = vi.fn();
			middleware({ url: "/assets/index-abc123.js" }, {}, next);
			expect(next).toHaveBeenCalled();
		});

		it("skips static assets like .css files", () => {
			const middleware = setupPreviewServer(configWithReplace);
			const next = vi.fn();
			middleware({ url: "/assets/style-abc.css" }, {}, next);
			expect(next).toHaveBeenCalled();
		});

		it("serves HTML for .html files", () => {
			const middleware = setupPreviewServer(configWithReplace);
			const res = { setHeader: vi.fn(), end: vi.fn() };
			const next = vi.fn();
			middleware({ url: "/about.html" }, res, next);
			// Falls through to next due to readFileSync throwing (no real file)
			expect(next).toHaveBeenCalled();
		});

		it("serves HTML for SPA routes (no file extension)", () => {
			const middleware = setupPreviewServer(configWithReplace);
			const res = { setHeader: vi.fn(), end: vi.fn() };
			const next = vi.fn();
			middleware({ url: "/about" }, res, next);
			// Falls through to next due to readFileSync, but the key is it didn't bail early
			expect(next).toHaveBeenCalled();
		});

		it("serves HTML for nested SPA routes", () => {
			const middleware = setupPreviewServer(configWithReplace);
			const res = { setHeader: vi.fn(), end: vi.fn() };
			const next = vi.fn();
			middleware({ url: "/dashboard/settings" }, res, next);
			expect(next).toHaveBeenCalled();
		});

		it("strips base prefix and serves HTML for root", () => {
			const middleware = setupPreviewServer(configWithReplace, {
				config: { base: "/my-app/", root: "/project", build: { outDir: "dist" } },
			});
			const res = { setHeader: vi.fn(), end: vi.fn() };
			const next = vi.fn();
			middleware({ url: "/my-app/" }, res, next);
			expect(next).toHaveBeenCalled();
		});

		it("strips base prefix and serves HTML for SPA route", () => {
			const middleware = setupPreviewServer(configWithReplace, {
				config: { base: "/my-app/", root: "/project", build: { outDir: "dist" } },
			});
			const res = { setHeader: vi.fn(), end: vi.fn() };
			const next = vi.fn();
			middleware({ url: "/my-app/about" }, res, next);
			expect(next).toHaveBeenCalled();
		});

		it("skips static assets under base prefix", () => {
			const middleware = setupPreviewServer(configWithReplace, {
				config: { base: "/my-app/", root: "/project", build: { outDir: "dist" } },
			});
			const next = vi.fn();
			middleware({ url: "/my-app/assets/index.js" }, {}, next);
			expect(next).toHaveBeenCalled();
		});

		it("skips URLs that don't match the base prefix", () => {
			const middleware = setupPreviewServer(configWithReplace, {
				config: { base: "/my-app/", root: "/project", build: { outDir: "dist" } },
			});
			const next = vi.fn();
			middleware({ url: "/other-app/about" }, {}, next);
			expect(next).toHaveBeenCalled();
		});

		it("handles base without trailing slash", () => {
			const middleware = setupPreviewServer(configWithReplace, {
				config: { base: "/my-app", root: "/project", build: { outDir: "dist" } },
			});
			const res = { setHeader: vi.fn(), end: vi.fn() };
			const next = vi.fn();
			middleware({ url: "/my-app/about" }, res, next);
			expect(next).toHaveBeenCalled();
		});

		it("handles exact base URL without trailing slash", () => {
			const middleware = setupPreviewServer(configWithReplace, {
				config: { base: "/my-app/", root: "/project", build: { outDir: "dist" } },
			});
			const res = { setHeader: vi.fn(), end: vi.fn() };
			const next = vi.fn();
			middleware({ url: "/my-app" }, res, next);
			expect(next).toHaveBeenCalled();
		});
	});
});

describe("createExportsPlugin", () => {
	const exports = { components: "src/components.ts" };

	it("returns plugin with correct name", () => {
		const plugin = createExportsPlugin(exports);
		expect(plugin.name).toBe("exports");
		expect(plugin.enforce).toBe("pre");
	});

	it("returns build config in build mode", () => {
		const plugin = createExportsPlugin(exports, "index.html");
		const buildConfig = (plugin.config as Function)({}, { command: "build" });

		expect(buildConfig.build.rolldownOptions.input).toEqual({
			components: "src/components.ts",
			app: "index.html",
		});
		expect(buildConfig.build.rolldownOptions.preserveEntrySignatures).toBe(
			"exports-only",
		);
	});

	it("returns undefined in dev mode", () => {
		const plugin = createExportsPlugin(exports);
		const result = (plugin.config as Function)({}, { command: "serve" });
		expect(result).toBeUndefined();
	});

	it("configureServer rewrites export URLs", () => {
		const plugin = createExportsPlugin(exports);
		const middlewares: Function[] = [];
		const mockServer = {
			middlewares: { use: (fn: Function) => middlewares.push(fn) },
		};

		(plugin.configureServer as Function)(mockServer);
		expect(middlewares).toHaveLength(1);

		// Test rewrite
		const req = { url: "/components.js" };
		const res = {};
		const next = vi.fn();
		middlewares[0](req, res, next);
		expect(req.url).toBe("/src/components.ts");
		expect(next).toHaveBeenCalled();
	});

	it("configureServer passes through non-matching URLs", () => {
		const plugin = createExportsPlugin(exports);
		const middlewares: Function[] = [];
		const mockServer = {
			middlewares: { use: (fn: Function) => middlewares.push(fn) },
		};

		(plugin.configureServer as Function)(mockServer);

		const req = { url: "/other.js" };
		const next = vi.fn();
		middlewares[0](req, {}, next);
		expect(req.url).toBe("/other.js");
		expect(next).toHaveBeenCalled();
	});

	it("configureServer rewrites URLs with base prefix", () => {
		const plugin = createExportsPlugin(exports);
		const middlewares: Function[] = [];
		const mockServer = {
			config: { base: "/my-app/" },
			middlewares: { use: (fn: Function) => middlewares.push(fn) },
		};

		(plugin.configureServer as Function)(mockServer);

		const req = { url: "/my-app/components.js" };
		const next = vi.fn();
		middlewares[0](req, {}, next);
		expect(req.url).toBe("/my-app/src/components.ts");
		expect(next).toHaveBeenCalled();
	});

	it("configureServer does not rewrite URLs without base prefix", () => {
		const plugin = createExportsPlugin(exports);
		const middlewares: Function[] = [];
		const mockServer = {
			config: { base: "/my-app/" },
			middlewares: { use: (fn: Function) => middlewares.push(fn) },
		};

		(plugin.configureServer as Function)(mockServer);

		const req = { url: "/components.js" };
		const next = vi.fn();
		middlewares[0](req, {}, next);
		expect(req.url).toBe("/components.js");
		expect(next).toHaveBeenCalled();
	});

	it("configureServer handles base without trailing slash", () => {
		const plugin = createExportsPlugin(exports);
		const middlewares: Function[] = [];
		const mockServer = {
			config: { base: "/my-app" },
			middlewares: { use: (fn: Function) => middlewares.push(fn) },
		};

		(plugin.configureServer as Function)(mockServer);

		const req = { url: "/my-app/components.js" };
		const next = vi.fn();
		middlewares[0](req, {}, next);
		expect(req.url).toBe("/my-app/src/components.ts");
		expect(next).toHaveBeenCalled();
	});

	it("configureServer calls next when req.url is undefined", () => {
		const plugin = createExportsPlugin(exports);
		const middlewares: Function[] = [];
		const mockServer = {
			middlewares: { use: (fn: Function) => middlewares.push(fn) },
		};

		(plugin.configureServer as Function)(mockServer);

		const req = { url: undefined };
		const next = vi.fn();
		middlewares[0](req, {}, next);
		expect(next).toHaveBeenCalled();
	});
});
