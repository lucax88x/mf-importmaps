import { expect, test } from "@playwright/test";

const COMPONENTS_URL = "http://localhost:5251";

test.describe("@mf/example-components", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(COMPONENTS_URL);
	});

	test("renders the components heading", async ({ page }) => {
		await expect(page.locator("h1")).toHaveText("Microfrontend Components");
	});

	test("import map is injected in the HTML", async ({ page }) => {
		const importMap = page.locator('script[type="importmap"]');
		await expect(importMap).toBeAttached();

		const content = await importMap.textContent();
		const parsed = JSON.parse(content!);
		expect(parsed.imports).toHaveProperty("react");
		expect(parsed.imports).toHaveProperty("@mf/example-ui");
	});

	test("Button React component renders and is interactive", async ({
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

	test("YellowButton from @mf/example-ui renders (cross-microfrontend dependency)", async ({
		page,
	}) => {
		await expect(
			page.getByRole("button", { name: "I come from @mf/example-ui!" }),
		).toBeVisible();
	});

	test("PostList loads posts via React Query", async ({ page }) => {
		const section = page.locator("section", {
			hasText: "React Query Component",
		});
		await expect(section.locator("li").first()).toBeVisible({
			timeout: 10_000,
		});
		const items = section.locator("li");
		expect(await items.count()).toBeGreaterThanOrEqual(1);
	});

	test("no error boundary is triggered", async ({ page }) => {
		await expect(page.locator("text=Components Error")).not.toBeVisible();
	});
});
