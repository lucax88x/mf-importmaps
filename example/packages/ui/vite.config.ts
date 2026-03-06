import { cdnUrl, mf } from "@mf/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const importMap = mf.importMap({
	imports: {
		react: cdnUrl("react"),
		"react-dom": cdnUrl("react-dom", { externals: ["react"] }),
		"react/jsx-runtime": cdnUrl("react/jsx-runtime"),
		"react/jsx-dev-runtime": cdnUrl("react/jsx-dev-runtime"),
		"react-dom/client": cdnUrl("react-dom/client", { externals: ["react"] }),
	},
	esmRequireExternals: ["react", "react-dom"],
});

const libraryEntries = mf.libraryEntries({
	index: "src/exports/index.ts",
	YellowButton: "src/exports/YellowButton.tsx",
	MuiSelect: "src/exports/MuiSelect.tsx",
	BaseSelect: "src/exports/BaseSelect.tsx",
});

export default defineConfig({
	base: "/ui",
	plugins: [tailwindcss(), react(), importMap.plugin(), libraryEntries],
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
	optimizeDeps: { ...importMap.optimizeDeps },
	build: mf.buildDefaults,
});
