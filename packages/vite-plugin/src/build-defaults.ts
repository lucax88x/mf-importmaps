import type { BuildOptions } from "vite";

export const buildDefaults: BuildOptions = {
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
