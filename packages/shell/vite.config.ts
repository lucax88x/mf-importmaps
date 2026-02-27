import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { build } from "../../infra/vite/build";
import { createImportMap, external } from "../../infra/vite/import-maps";

const importMaps = createImportMap({
	imports: {
		"@mf/ui": "${MF_UI_URL}/index.js",
		"@mf/ui/YellowButton": "${MF_UI_URL}/YellowButton.js",
		"@mf/ui/MuiSelect": "${MF_UI_URL}/MuiSelect.js",
		"@mf/ui/BaseSelect": "${MF_UI_URL}/BaseSelect.js",

		"@mf/components": "${MF_COMPONENTS_URL}/index.js",
		"@mf/components/button": "${MF_COMPONENTS_URL}/button.js",
		"@mf/components/mf-button": "${MF_COMPONENTS_URL}/mf-button.js",
		"@mf/components/calculate": "${MF_COMPONENTS_URL}/calculate.js",
		"@mf/components/PostList": "${MF_COMPONENTS_URL}/PostList.js",
		"@mf/components/SlowButton": "${MF_COMPONENTS_URL}/SlowButton.js",

		react: external("react"),
		"react-dom": external("react-dom", { externals: ["react"] }),
		"react/jsx-runtime": external("react/jsx-runtime"),
		"react/jsx-dev-runtime": external("react/jsx-dev-runtime"),
		"react-dom/client": external("react-dom/client", { externals: ["react"] }),
		"@tanstack/react-query": external("@tanstack/react-query", {
			externals: ["react"],
		}),
	},
	devBaseReplace: {
		"${MF_UI_URL}": "http://localhost:5252",
		"${MF_COMPONENTS_URL}": "http://localhost:5251",
	},
});

export default defineConfig({
	plugins: [tailwindcss(), react(), importMaps.plugin()],
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
	build: build,
});
