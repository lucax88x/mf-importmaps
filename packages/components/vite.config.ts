import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
	createExportsPlugin,
	createImportMap,
	external,
} from "../../infra/vite/import-maps";

const importMaps = createImportMap({
	imports: {
		react: external("react"),
		"react/jsx-runtime": external("react/jsx-runtime"),
		"react/jsx-dev-runtime": external("react/jsx-dev-runtime"),
		"react-dom/client": external("react-dom/client", { externals: ["react"] }),
		"@tanstack/react-query": external("@tanstack/react-query", {
			externals: ["react"],
		}),
	},
});

const exportsPlugin = createExportsPlugin({
	index: "src/exports/index.ts",
	button: "src/exports/Button.tsx",
	"mf-button": "src/exports/MfButton.ts",
	calculate: "src/exports/calculate.ts",
	"post-list": "src/exports/PostList.tsx",
});

export default defineConfig({
	plugins: [react(), importMaps.plugin(), exportsPlugin],
	server: {
		port: 5251,
		strictPort: true,
		host: true,
	},
	preview: {
		port: 5251,
		strictPort: true,
		host: true,
	},
	optimizeDeps: { ...importMaps.optimizeDeps },
});
