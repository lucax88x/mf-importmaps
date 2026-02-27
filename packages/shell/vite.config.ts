import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createImportMap } from "../../infra/vite/import-maps";

const importMaps = createImportMap({
	imports: {
		"@mf/components": "${MF_COMPONENTS_URL}/index.js",
		"@mf/components/button": "${MF_COMPONENTS_URL}/button.js",
		"@mf/components/mf-button": "${MF_COMPONENTS_URL}/mf-button.js",
		"@mf/components/calculate": "${MF_COMPONENTS_URL}/calculate.js",
		"@mf/components/post-list": "${MF_COMPONENTS_URL}/post-list.js",

		react: "https://esm.sh/react@^19",
		"react/jsx-runtime": "https://esm.sh/react@^19/jsx-runtime",
		"react/jsx-dev-runtime": "https://esm.sh/react@^19/jsx-dev-runtime",
		"react-dom/client": "https://esm.sh/react-dom@^19/client?external=react",
		"@tanstack/react-query":
			"https://esm.sh/@tanstack/react-query@^5?external=react",
	},
	devBaseReplace: {
		"${MF_COMPONENTS_URL}": "http://localhost:5251",
	},
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
