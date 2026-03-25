import { buildDefaults, cdnUrl, mf } from "@mf/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const libraryEntries = mf.libraryEntries({
	index: "src/exports/index.ts",
	YellowButton: "src/exports/YellowButton.tsx",
	MuiSelect: "src/exports/MuiSelect.tsx",
	BaseSelect: "src/exports/BaseSelect.tsx",
});

export default defineConfig(({ mode }) => {
	const isDev = mode === "development";

	const importMap = mf.importMap({
		imports: {
			react: cdnUrl("react", { dev: isDev }),
			"react-dom": cdnUrl("react-dom", { externals: ["react"], dev: isDev }),
			"react/jsx-runtime": cdnUrl("react/jsx-runtime", { dev: isDev }),
			"react/jsx-dev-runtime": cdnUrl("react/jsx-dev-runtime", { dev: isDev }),
			"react-dom/client": cdnUrl("react-dom/client", {
				externals: ["react"],
				dev: isDev,
			}),
		},
		esmRequireExternals: ["react", "react-dom"],
	});

	return {
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
		build: buildDefaults,
	};
});
