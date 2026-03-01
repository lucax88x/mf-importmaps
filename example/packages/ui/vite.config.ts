import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { build, external, importMaps } from "vite-plugin-mf-import-maps";

const importMapsPlugin = importMaps.importMap({
	imports: {
		react: external("react"),
		"react-dom": external("react-dom", { externals: ["react"] }),
		"react/jsx-runtime": external("react/jsx-runtime"),
		"react/jsx-dev-runtime": external("react/jsx-dev-runtime"),
		"react-dom/client": external("react-dom/client", { externals: ["react"] }),
	},
	esmRequireExternals: ["react", "react-dom"],
});

const exportsPlugin = importMaps.exports({
	index: "src/exports/index.ts",
	YellowButton: "src/exports/YellowButton.tsx",
	MuiSelect: "src/exports/MuiSelect.tsx",
	BaseSelect: "src/exports/BaseSelect.tsx",
});

export default defineConfig({
	plugins: [tailwindcss(), react(), importMapsPlugin.plugin(), exportsPlugin],
	server: {
		port: 5252,
		strictPort: true,
		host: true,
	},
	preview: {
		port: 5252,
		strictPort: true,
		host: true,
	},
	optimizeDeps: { ...importMapsPlugin.optimizeDeps },
	build: build,
});
