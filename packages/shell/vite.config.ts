import { cpSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

const IMPORT_MAP_SPECIFIERS = [
	"@mf/components",
	"@mf/components/button",
	"@mf/components/mf-button",
	"@mf/components/calculate",
	"react",
	"react/jsx-runtime",
	"react-dom/client",
];

const DEV_IMPORT_MAP = {
	imports: {
		"@mf/components": "http://localhost:5174/index.js",
		"@mf/components/button": "http://localhost:5174/button.js",
		"@mf/components/mf-button": "http://localhost:5174/mf-button.js",
		"@mf/components/calculate": "http://localhost:5174/calculate.js",
		react: "https://esm.sh/react@^19",
		"react/jsx-runtime": "https://esm.sh/react@^19/jsx-runtime",
		"react-dom/client": "https://esm.sh/react-dom@^19/client?external=react",
	},
};

const BUILD_IMPORT_MAP = {
	imports: {
		"@mf/components": "/mf-components/index.js",
		"@mf/components/button": "/mf-components/button.js",
		"@mf/components/mf-button": "/mf-components/mf-button.js",
		"@mf/components/calculate": "/mf-components/calculate.js",
		react: "https://esm.sh/react@^19",
		"react/jsx-runtime": "https://esm.sh/react@^19/jsx-runtime",
		"react-dom/client": "https://esm.sh/react-dom@^19/client?external=react",
	},
};

function importMapPlugin(): Plugin {
	let isBuild = false;

	return {
		name: "import-map",

		config(_, { command }) {
			isBuild = command === "build";
			if (isBuild) {
				return {
					build: {
						rolldownOptions: {
							external: (id: string) =>
								/^@mf\/components(\/|$)/.test(id) || /^react(-dom)?(\/|$)/.test(id),
							output: {
								format: "es" as const,
							},
						},
					},
				};
			}
		},

		resolveId(source) {
			if (!isBuild && IMPORT_MAP_SPECIFIERS.includes(source)) {
				return { id: source, external: true };
			}
		},

		transformIndexHtml: {
			order: "post",
			handler() {
				const importMap = isBuild ? BUILD_IMPORT_MAP : DEV_IMPORT_MAP;
				return [
					{
						tag: "script",
						attrs: { type: "importmap" },
						children: JSON.stringify(importMap, null, 2),
						injectTo: "head-prepend" as const,
					},
				];
			},
		},

		closeBundle() {
			if (!isBuild) return;
			const src = resolve(__dirname, "../components/dist");
			const dest = resolve(__dirname, "dist/mf-components");
			if (existsSync(src)) {
				cpSync(src, dest, { recursive: true });
			}
		},
	};
}

export default defineConfig({
	server: {
		port: 5173,
    host: true,
	},
	preview: {
		port: 5173,
    host: true,
	},
	plugins: [react(), importMapPlugin()],
});
