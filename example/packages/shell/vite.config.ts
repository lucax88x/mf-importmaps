import { buildDefaults, cdnUrl, mf } from "@mf/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
	const isDev = mode === "development";

	const importMap = mf.importMap({
		imports: {
			"@mf/example-components": "${MF_COMPONENTS_URL}/index.js",
			"@mf/example-components/button": "${MF_COMPONENTS_URL}/button.js",
			"@mf/example-components/mf-button": "${MF_COMPONENTS_URL}/mf-button.js",
			"@mf/example-components/calculate": "${MF_COMPONENTS_URL}/calculate.js",
			"@mf/example-components/PostList": "${MF_COMPONENTS_URL}/PostList.js",
			"@mf/example-components/SlowButton": "${MF_COMPONENTS_URL}/SlowButton.js",

			react: cdnUrl("react", { dev: isDev }),
			"react-dom": cdnUrl("react-dom", { externals: ["react"], dev: isDev }),
			"react/jsx-runtime": cdnUrl("react/jsx-runtime", { dev: isDev }),
			"react/jsx-dev-runtime": cdnUrl("react/jsx-dev-runtime", { dev: isDev }),
			"react-dom/client": cdnUrl("react-dom/client", {
				externals: ["react"],
				dev: isDev,
			}),
			"@tanstack/react-query": cdnUrl("@tanstack/react-query", {
				externals: ["react"],
				dev: isDev,
			}),
		},
		esmRequireExternals: ["react", "react-dom"],
		remotes: [
			{
				url: "${MF_COMPONENTS_URL}",
				devUrl: "http://localhost:5251",
			},
		],
		devBaseReplace: {
			"${MF_COMPONENTS_URL}": "http://localhost:5251",
		},
	});

	return {
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
		build: buildDefaults,
	};
});
