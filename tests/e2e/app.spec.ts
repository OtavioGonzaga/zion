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

test("supports reversible progress and persists the selected theme", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo final").selectOption("22");
	await page.getByRole("button", { name: "Criar plano" }).click();

	const chapter = page.getByRole("checkbox", { name: "Jeremias 6" });
	await chapter.check();
	await expect(page.getByText("1 de 17 capítulos")).toBeVisible();
	await chapter.uncheck();
	await expect(page.getByText("0 de 17 capítulos")).toBeVisible();

	await page.getByLabel("Tema").selectOption("light");
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	await page.reload();
	await expect(page.getByLabel("Tema")).toHaveValue("light");
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("shows an expired-plan state and permits extending the target date", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo final").selectOption("22");
	const now = new Date();
	const localDate = (date: Date) =>
		`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
	const tenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10);
	await page.getByLabel("Data inicial").fill(localDate(tenDaysAgo));
	await page.getByLabel("Data final").fill(localDate(yesterday));
	await page.getByRole("button", { name: "Criar plano" }).click();
	await expect(page.getByText("Seu prazo terminou com capítulos pendentes.")).toBeVisible();

	await page.getByRole("button", { name: "Alterar data final" }).click();
	await page.getByLabel("Data final").fill(localDate(now));
	await page.getByRole("button", { name: "Salvar alterações" }).click();
	await expect(page.getByText("Seu prazo terminou com capítulos pendentes.")).toHaveCount(0);
});

test("keeps the complete schedule within common viewport widths", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo final").selectOption("22");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Ver plano completo" }).click();

	for (const width of [360, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		const dimensions = await page.evaluate(() => ({
			viewport: document.documentElement.clientWidth,
			content: document.documentElement.scrollWidth,
		}));
		expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
	}
});

test("prepares the full schedule with branded styling before printing", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.evaluate(() => {
		window.print = () => undefined;
	});
	await page.getByRole("button", { name: "Imprimir / Salvar em PDF" }).click();

	await expect(page.getByRole("heading", { name: "Próximas leituras" })).toBeVisible();
	await page.emulateMedia({ media: "print" });
	await expect(page.getByLabel("Resumo para impressão")).toBeVisible();
	await expect(
		page.getByLabel("Resumo para impressão").getByRole("img", { name: "Zion" }),
	).toBeVisible();
});
