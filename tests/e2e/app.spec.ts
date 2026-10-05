import { expect, test } from "@playwright/test";

test("creates and persists a reading plan", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "Crie seu plano de leitura" })).toBeVisible();

	await page.getByLabel("Livro inicial").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption({ label: "Apocalipse" });
	await page.getByLabel("Capítulo final").selectOption("22");
	await page.getByRole("button", { name: "Criar plano" }).click();

	await expect(page.getByRole("heading", { name: "Jeremias 6, Apocalipse 22" })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("heading", { name: "Jeremias 6, Apocalipse 22" })).toBeVisible();
});

test("validates a reversed chapter range and remains usable on mobile", async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption({ label: "Apocalipse" });
	await page.getByLabel("Capítulo inicial").selectOption("22");
	await page.getByLabel("Livro final").selectOption({ label: "Gênesis" });
	await page.getByLabel("Capítulo final").selectOption("1");
	await page.getByRole("button", { name: "Criar plano" }).click();

	await expect(page.getByRole("alert")).toContainText("capítulo final");
	await expect(page.getByLabel("Livro inicial")).toBeVisible();
});
