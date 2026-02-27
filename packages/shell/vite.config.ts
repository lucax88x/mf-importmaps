import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createImportMap } from "../../infra/vite/import-maps";

const importMaps = createImportMap({
	imports: {
		"@mf/components": "/__MF_COMPONENTS__/index.js",
		"@mf/components/button": "/__MF_COMPONENTS__/button.js",
		"@mf/components/mf-button": "/__MF_COMPONENTS__/mf-button.js",
		"@mf/components/calculate": "/__MF_COMPONENTS__/calculate.js",
		"@mf/components/post-list": "/__MF_COMPONENTS__/post-list.js",

		react: "https://esm.sh/react@^19",
		"react/jsx-runtime": "https://esm.sh/react@^19/jsx-runtime",
		"react/jsx-dev-runtime": "https://esm.sh/react@^19/jsx-dev-runtime",
		"react-dom/client": "https://esm.sh/react-dom@^19/client?external=react",
		"@tanstack/react-query":
			"https://esm.sh/@tanstack/react-query@^5?external=react",
	},
	devBaseReplace: {
		"/__MF_COMPONENTS__": "http://localhost:5251",
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
