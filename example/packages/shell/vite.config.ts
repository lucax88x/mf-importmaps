import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cdnUrl, mf } from "@mf/vite-plugin";

const importMap = mf.importMap({
	imports: {
		"@mf/example-ui": "${MF_UI_URL}/index.js",
		"@mf/example-ui/YellowButton": "${MF_UI_URL}/YellowButton.js",
		"@mf/example-ui/MuiSelect": "${MF_UI_URL}/MuiSelect.js",
		"@mf/example-ui/BaseSelect": "${MF_UI_URL}/BaseSelect.js",

		"@mf/example-components": "${MF_COMPONENTS_URL}/index.js",
		"@mf/example-components/button": "${MF_COMPONENTS_URL}/button.js",
		"@mf/example-components/mf-button": "${MF_COMPONENTS_URL}/mf-button.js",
		"@mf/example-components/calculate": "${MF_COMPONENTS_URL}/calculate.js",
		"@mf/example-components/PostList": "${MF_COMPONENTS_URL}/PostList.js",
		"@mf/example-components/SlowButton": "${MF_COMPONENTS_URL}/SlowButton.js",

		react: cdnUrl("react"),
		"react-dom": cdnUrl("react-dom", { externals: ["react"] }),
		"react/jsx-runtime": cdnUrl("react/jsx-runtime"),
		"react/jsx-dev-runtime": cdnUrl("react/jsx-dev-runtime"),
		"react-dom/client": cdnUrl("react-dom/client", { externals: ["react"] }),
		"@tanstack/react-query": cdnUrl("@tanstack/react-query", {
			externals: ["react"],
		}),
	},
	esmRequireExternals: ["react", "react-dom"],
	devBaseReplace: {
		"${MF_UI_URL}": "http://localhost:5252",
		"${MF_COMPONENTS_URL}": "http://localhost:5251",
	},
});

export default defineConfig({
	plugins: [tailwindcss(), react(), importMap.plugin()],
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
	optimizeDeps: { ...importMap.optimizeDeps },
	build: mf.buildDefaults,
});
