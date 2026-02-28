import { expect, test } from "@playwright/test";

const SHELL_URL = "http://localhost:5250";

test.describe("@mf/shell", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(SHELL_URL);
	});

	test("renders the shell heading", async ({ page }) => {
		await expect(page.locator("h1")).toHaveText("Microfrontend Shell");
	});

	test("import map is injected in the HTML", async ({ page }) => {
		const importMap = page.locator('script[type="importmap"]');
		await expect(importMap).toBeAttached();

		const content = await importMap.textContent();
		const parsed = JSON.parse(content!);
		expect(parsed.imports).toHaveProperty("react");
		expect(parsed.imports).toHaveProperty("@mf/components");
		expect(parsed.imports).toHaveProperty("@mf/ui");
	});

	test("React component from @mf/components renders and is interactive", async ({
		page,
	}) => {
		const button = page.getByRole("button", { name: "Clicked 0 times" });
		await expect(button).toBeVisible();
		await button.click();
		await expect(
			page.getByRole("button", { name: "Clicked 1 times" }),
		).toBeVisible();
	});

	test("Web Component <mf-button> renders", async ({ page }) => {
		const section = page.locator("section", { hasText: "Web Component" });
		await expect(
			section.getByRole("button", { name: "I'm a Web Component!" }),
		).toBeVisible();
	});

	test("calculate() utility function works", async ({ page }) => {
		await page.getByRole("button", { name: "Calculate 6 x 7" }).click();
		await expect(page.getByText("Result: 42")).toBeVisible();
	});

	test("PostList from @mf/components loads posts via React Query", async ({
		page,
	}) => {
		const section = page.locator("section", {
			hasText: "React Query — Remote Component",
		});
		await expect(section.locator("li").first()).toBeVisible({
			timeout: 10_000,
		});
		const items = section.locator("li");
		expect(await items.count()).toBeGreaterThanOrEqual(1);
	});

	test("ShellUserList loads users via React Query (shared QueryClient)", async ({
		page,
	}) => {
		const section = page.locator("section", {
			hasText: "React Query — Shell Local",
		});
		await expect(section.locator("li").first()).toBeVisible({
			timeout: 10_000,
		});
	});

	test("YellowButton from @mf/ui renders", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: "Direct from @mf/ui in shell!" }),
		).toBeVisible();
	});

	test("MUI Select from @mf/ui renders", async ({ page }) => {
		const section = page.locator("section", { hasText: "MUI Select" });
		await expect(section.getByRole("combobox")).toBeVisible();
	});

	test("Base Select from @mf/ui renders", async ({ page }) => {
		const section = page.locator("section", { hasText: "Base Select" });
		await expect(section.getByText("Select apple")).toBeVisible();
	});

	test("lazy-loaded SlowButton eventually renders", async ({ page }) => {
		await expect(page.getByText("takes some time to load")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Slow Button/ }),
		).toBeVisible({ timeout: 10_000 });
	});

	test("no error boundary is triggered", async ({ page }) => {
		await expect(page.locator("text=Shell Error")).not.toBeVisible();
	});
});
