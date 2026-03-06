import { expect, test } from "@playwright/test";

const UI_URL = "http://localhost:5252/ui";

test.describe("@mf/example-ui", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(UI_URL);
	});

	test("renders the UI heading", async ({ page }) => {
		await expect(page.locator("h1")).toHaveText("Microfrontend UI");
	});

	test("import map is injected in the HTML", async ({ page }) => {
		const importMap = page.locator('script[type="importmap"]');
		await expect(importMap).toBeAttached();

		const content = await importMap.textContent();
		const parsed = JSON.parse(content!);
		expect(parsed.imports).toHaveProperty("react");
		expect(parsed.imports).toHaveProperty("react-dom");
	});

	test("YellowButton renders and is interactive", async ({ page }) => {
		const button = page.getByRole("button", { name: "Clicked 0 times" });
		await expect(button).toBeVisible();
		await button.click();
		await expect(
			page.getByRole("button", { name: "Clicked 1 times" }),
		).toBeVisible();
	});

	test("MUI Select renders with label", async ({ page }) => {
		const section = page.locator("section", { hasText: "MUI Select" });
		await expect(section.getByRole("combobox")).toBeVisible();
	});

	test("Base Select renders with placeholder", async ({ page }) => {
		const section = page.locator("section", { hasText: "Base Select" });
		await expect(section.getByText("Select apple")).toBeVisible();
	});

	test("no error boundary is triggered", async ({ page }) => {
		await expect(page.locator("text=UI Error")).not.toBeVisible();
	});
});
