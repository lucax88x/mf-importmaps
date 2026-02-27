import { createLazyComponent } from "./createLazyComponent";

export const LazySlowButton = createLazyComponent(
	() =>
		import("@mf/components/SlowButton").then((m) => ({
			default: m.SlowButton,
		})),
	{ loading: "takes some time to load" },
);
