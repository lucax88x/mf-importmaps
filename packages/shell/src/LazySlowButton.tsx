import type { SlowButton } from "@mf/components/SlowButton";

import { createLazyComponent } from "./createLazyComponent";

export const LazySlowButton = createLazyComponent<typeof SlowButton>(
	() =>
		import("@mf/components/SlowButton").then((m) => ({
			default: m.SlowButton,
		})),
	{ loading: "takes some time to load" },
);
