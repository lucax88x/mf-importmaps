import type { BuildOptions } from "vite";

export const build: BuildOptions = {
	target: "esnext",
	minify: "oxc",
	rolldownOptions: {
		treeshake: true,
		output: {
			format: "es",
		},
	},
};
