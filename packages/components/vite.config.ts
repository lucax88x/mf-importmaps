import react from "@vitejs/plugin-react";
import { type BuildOptions, defineConfig, type Plugin } from "vite";

const REACT_IMPORT_MAP = {
	imports: {
		react: "https://esm.sh/react@^19",
		"react/jsx-runtime": "https://esm.sh/react@^19/jsx-runtime",
		"react/jsx-dev-runtime": "https://esm.sh/react@^19/jsx-dev-runtime",
		"react-dom/client": "https://esm.sh/react-dom@^19/client?external=react",
		"@tanstack/react-query":
			"https://esm.sh/@tanstack/react-query@^5?external=react",
	},
};

const libEntries: Record<string, string> = {
	index: "src/exports/index.ts",
	button: "src/exports/Button.tsx",
	"mf-button": "src/exports/MfButton.ts",
	calculate: "src/exports/calculate.ts",
	"post-list": "src/exports/PostList.tsx",
};

const seenExternals = new Set<string>();
const seenBundled = new Set<string>();

const libEntryNames = new Set(Object.keys(libEntries));

const buildExternal: BuildOptions["rolldownOptions"] = {
	preserveEntrySignatures: "exports-only",
	input: {
		...libEntries,
		app: "index.html",
	},
	output: {
		entryFileNames: (chunk) =>
			libEntryNames.has(chunk.name) ? "[name].js" : "assets/[name]-[hash].js",
		chunkFileNames: "assets/[name]-[hash].js",
		assetFileNames: "assets/[name]-[hash][extname]",
	},
	external: (id: string) => {
		const isExternal =
			/^react(-dom)?(\/|$)/.test(id) ||
			/^@tanstack\/react-query(\/|$)/.test(id);

		if (isExternal) {
			if (!seenExternals.has(id)) {
				seenExternals.add(id);
				console.log(`  \x1b[33m[external]\x1b[0m ${id}`);
			}

			return true;
		}

		if (!id.startsWith(".") && !id.startsWith("/") && !seenBundled.has(id)) {
			seenBundled.add(id);
			console.log(`  \x1b[32m[bundled]\x1b[0m  ${id}`);
		}

		return false;
	},
};

function reactImportMapPlugin(): Plugin {
	return {
		name: "react-import-map",
		transformIndexHtml: {
			order: "post",
			handler() {
				return [
					{
						tag: "script",
						attrs: { type: "importmap" },
						children: JSON.stringify(REACT_IMPORT_MAP, null, 2),
						injectTo: "head-prepend" as const,
					},
				];
			},
		},
	};
}

function devEntryPlugin(): Plugin {
	const rewrites = new Map(
		Object.entries(libEntries).map(([name, src]) => [`/${name}.js`, `/${src}`]),
	);

	return {
		name: "dev-entry-rewrite",
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
}

export default defineConfig({
	plugins: [react(), reactImportMapPlugin(), devEntryPlugin()],
	server: {
		port: 5174,
		host: true,
	},
	preview: {
		port: 5174,
		host: true,
	},
	build: {
		rolldownOptions: buildExternal,
	},
});
