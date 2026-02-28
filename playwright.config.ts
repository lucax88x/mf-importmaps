import { defineConfig } from "@playwright/test";

const mode = process.env.MODE || "dev";

const servers =
	mode === "preview"
		? [
				{
					command: "pnpm turbo preview --filter=@mf/ui",
					port: 5252,
					reuseExistingServer: true,
				},
				{
					command: "pnpm turbo preview --filter=@mf/components",
					port: 5251,
					reuseExistingServer: true,
				},
				{
					command: "pnpm turbo preview --filter=@mf/shell",
					port: 5250,
					reuseExistingServer: true,
				},
			]
		: [
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
			];

export default defineConfig({
	testDir: "tests/integration",
	timeout: 30_000,
	retries: 0,
	webServer: servers,
});
