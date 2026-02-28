import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "tests/integration",
	webServer: [
		{
			command: "pnpm turbo dev --filter=@mf/ui",
			port: 5252,
			reuseExistingServer: true,
		},
		{
			command: "pnpm turbo dev --filter=@mf/components",
			port: 5251,
			reuseExistingServer: true,
		},
		{
			command: "pnpm turbo dev --filter=@mf/shell",
			port: 5250,
			reuseExistingServer: true,
		},
	],
});
