import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createImportMap } from "../../infra/vite/import-maps";

// TODO: compute external from imports?
const importMaps = createImportMap({
	imports: {
		"@mf/components": "http://localhost:5251/index.js",
		"@mf/components/button": "http://localhost:5251/button.js",
		"@mf/components/mf-button": "http://localhost:5251/mf-button.js",
		"@mf/components/calculate": "http://localhost:5251/calculate.js",
		"@mf/components/post-list": "http://localhost:5251/post-list.js",

		react: "https://esm.sh/react@^19",
		"react/jsx-runtime": "https://esm.sh/react@^19/jsx-runtime",
		"react/jsx-dev-runtime": "https://esm.sh/react@^19/jsx-dev-runtime",
		"react-dom/client": "https://esm.sh/react-dom@^19/client?external=react",
		"@tanstack/react-query":
			"https://esm.sh/@tanstack/react-query@^5?external=react",
	},
	external: [
		/^@mf\/components(\/|$)/,
		/^react(-dom)?(\/|$)/,
		/^@tanstack\/react-query(\/|$)/,
	],
});

export default defineConfig({
	plugins: [react(), importMaps.plugin()],
	server: {
		port: 5250,
		strictPort: true,
		host: true,
	},
	preview: {
		port: 5250,
		strictPort: true,
		host: true,
	},
	optimizeDeps: { ...importMaps.optimizeDeps },
});
