import { createLazyComponent } from "@mf/runtime";

export const LazySlowButton = createLazyComponent(
	() =>
		import("@mf/example-components/SlowButton").then((m) => ({
			default: m.SlowButton,
		})),
	{ loading: "takes some time to load" },
);
