import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("creates and persists a reading plan", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "Crie seu plano de leitura" })).toBeVisible();

	await page.getByLabel("Livro inicial").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo final").selectOption("22");
	await page.getByRole("button", { name: "Criar plano" }).click();

	await expect(page.getByRole("heading", { name: "Jeremias 6–22" })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("heading", { name: "Jeremias 6–22" })).toBeVisible();
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

test("keeps today's assignment frozen while future progress adapts the schedule", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo final").selectOption("22");
	const now = new Date();
	const localDate = (date: Date) =>
		`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	const lastDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4);
	await page.getByLabel("Data inicial").fill(localDate(now));
	await page.getByLabel("Data final").fill(localDate(lastDay));
	await page.getByRole("button", { name: "Criar plano" }).click();

	const todayChapter = page.getByRole("checkbox", { name: "Jeremias 6" });
	await expect(todayChapter).toBeVisible();
	await todayChapter.check();
	await expect(todayChapter).toBeChecked();
	await page.getByRole("button", { name: "Ver plano completo" }).click();
	const futureChapter = page.getByRole("checkbox", { name: "Jeremias 7" });
	await expect(futureChapter).toBeVisible();
	await futureChapter.click();
	await expect(page.getByText("2 de 17 capítulos")).toBeVisible();
	await page.getByRole("button", { name: "Ver hoje" }).click();
	await expect(todayChapter).toBeChecked();
	await expect(page.getByRole("heading", { name: "Jeremias 6–22" })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("checkbox", { name: "Jeremias 6" })).toBeChecked();
});

test("exports and restores a backup after removing the local plan", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo final").selectOption("22");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();

	const jsonDownload = page.waitForEvent("download");
	await page.getByRole("button", { name: "Exportar backup JSON" }).click();
	const backupFile = await jsonDownload;
	const backupPath = await backupFile.path();
	if (!backupPath) throw new Error("Backup download was not saved");

	page.on("dialog", (dialog) => dialog.accept());
	await page.getByRole("button", { name: "Remover plano" }).click();
	await expect(page.getByRole("heading", { name: "Crie seu plano de leitura" })).toBeVisible();
	await page.getByLabel("Selecionar backup JSON").setInputFiles({
		name: backupFile.suggestedFilename(),
		mimeType: "application/json",
		buffer: await readFile(backupPath),
	});
	await expect(page.getByRole("heading", { name: "Jeremias 6–22" })).toBeVisible();

	await page.getByRole("button", { name: "Configurações" }).click();
	const csvDownload = page.waitForEvent("download");
	await page.getByRole("button", { name: "Exportar cronograma CSV" }).click();
	const csvFile = await csvDownload;
	const csvPath = await csvFile.path();
	if (!csvPath) throw new Error("CSV download was not saved");
	expect(await readFile(csvPath, "utf8")).toContain("date,reading,status");
});
