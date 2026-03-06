import { cdnUrl, mf } from "@mf/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const importMap = mf.importMap({
	imports: {
		"@mf/example-ui": "${MF_UI_URL}/index.js",
		"@mf/example-ui/YellowButton": "${MF_UI_URL}/YellowButton.js",

		react: cdnUrl("react"),
		"react-dom": cdnUrl("react-dom", { externals: ["react"] }),
		"react/jsx-runtime": cdnUrl("react/jsx-runtime"),
		"react/jsx-dev-runtime": cdnUrl("react/jsx-dev-runtime"),
		"react-dom/client": cdnUrl("react-dom/client", { externals: ["react"] }),
		"@tanstack/react-query": cdnUrl("@tanstack/react-query", {
			externals: ["react"],
		}),
	},
	devBaseReplace: {
		"${MF_UI_URL}": "http://localhost:5252/ui",
	},
});

const libraryEntries = mf.libraryEntries({
	index: "src/exports/index.ts",
	button: "src/exports/Button.tsx",
	"mf-button": "src/exports/MfButton.ts",
	calculate: "src/exports/calculate.ts",
	PostList: "src/exports/PostList.tsx",
	SlowButton: "src/exports/SlowButton.tsx",
});

export default defineConfig({
	plugins: [tailwindcss(), react(), importMap.plugin(), libraryEntries],
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
	optimizeDeps: { ...importMap.optimizeDeps },
	build: mf.buildDefaults,
});
