import { expect, test } from "@playwright/test";

test("loads the application shell", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByText("ZION", { exact: true })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Uma jornada pela Palavra" })).toBeVisible();
	await expect(page.getByRole("checkbox")).toHaveCount(5);
});

test("keeps the reading view usable on a mobile viewport", async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await page.goto("/");

	await expect(page.getByText("Leitura de hoje", { exact: true })).toBeVisible();
	await expect(page.getByRole("checkbox").first()).toBeVisible();
});
