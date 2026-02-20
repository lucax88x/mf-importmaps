import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const IMPORT_MAP = {
	imports: {
		"@mf/components": "http://localhost:5174/index.js",
		"@mf/components/button": "http://localhost:5174/button.js",
		"@mf/components/mf-button": "http://localhost:5174/mf-button.js",
		"@mf/components/calculate": "http://localhost:5174/calculate.js",

		react: "https://esm.sh/react@^19",
		"react/jsx-runtime": "https://esm.sh/react@^19/jsx-runtime",
		"react/jsx-dev-runtime": "https://esm.sh/react@^19/jsx-dev-runtime",
		"react-dom/client": "https://esm.sh/react-dom@^19/client?external=react",
	},
};

function importMapPlugin(): Plugin {
	let isBuild = false;

	return {
		name: "import-map",
		enforce: "pre",

		config(_, { command }) {
			isBuild = command === "build";
			if (isBuild) {
				return {
					build: {
						rolldownOptions: {
							external: (id: string) =>
								/^@mf\/components(\/|$)/.test(id) ||
								/^react(-dom)?(\/|$)/.test(id),
							output: {
								format: "es" as const,
							},
						},
					},
				};
			}
		},

		resolveId(source) {
			if (!isBuild && source in IMPORT_MAP.imports) {
				const resolved =
					IMPORT_MAP.imports[source as keyof typeof IMPORT_MAP.imports];

				return {
					id: resolved,
					external: true,
				};
			}
		},

		transformIndexHtml: {
			order: "post",
			handler() {
				return [
					{
						tag: "script",
						attrs: { type: "importmap" },
						children: JSON.stringify(IMPORT_MAP, null, 2),
						injectTo: "head-prepend" as const,
					},
				];
			},
		},
	};
}

export default defineConfig({
	plugins: [react(), importMapPlugin()],
	server: {
		port: 5173,
		host: true,
	},
	preview: {
		port: 5173,
		host: true,
	},
	optimizeDeps: {
		exclude: ["@mf/components"],
	},
});
