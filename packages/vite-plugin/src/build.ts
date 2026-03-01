import type { BuildOptions } from "vite";

export const build: BuildOptions = {
	target: "esnext",
	minify: "oxc",
	modulePreload: false,
	rolldownOptions: {
		treeshake: true,
		output: {
			format: "es",
		},
	},
};
