import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
	createExportsPlugin,
	createImportMap,
} from "../../infra/vite/import-maps";

const importMaps = createImportMap({
	imports: {
		react: "https://esm.sh/react@^19",
		"react/jsx-runtime": "https://esm.sh/react@^19/jsx-runtime",
		"react/jsx-dev-runtime": "https://esm.sh/react@^19/jsx-dev-runtime",
		"react-dom/client": "https://esm.sh/react-dom@^19/client?external=react",
		"@tanstack/react-query":
			"https://esm.sh/@tanstack/react-query@^5?external=react",
	},
	external: [/^react(-dom)?(\/|$)/, /^@tanstack\/react-query(\/|$)/],
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
