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

test("keeps navigation destinations exclusive and supports browser history", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
	await page.getByRole("link", { name: "Plano" }).click();
	await expect(page.getByRole("heading", { name: "Plano" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Configurações" })).toHaveCount(0);
	await page.getByRole("link", { name: "Concluídos" }).click();
	await page.goBack();
	await expect(page.getByRole("heading", { name: "Plano" })).toBeVisible();
	await page.goBack();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
	await page.goBack();
	await expect(page.getByRole("link", { name: "Hoje" })).toHaveAttribute("aria-current", "page");
	await page.goForward();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
	await page.goForward();
	await expect(page.getByRole("heading", { name: "Plano" })).toBeVisible();
});

test("deep-links to a protected view only when a plan exists", async ({ page }) => {
	await page.goto("/#completed");
	await expect(page.getByRole("heading", { name: "Crie seu plano de leitura" })).toBeVisible();
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.goto("/#completed");
	await expect(page.getByRole("heading", { name: "Concluídos" })).toBeVisible();
});

test("shows completed readings and lets the user undo a future completion", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption("JER");
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption("JER");
	await page.getByLabel("Capítulo final").selectOption("15");
	const now = new Date();
	const dateValue = (date: Date) =>
		`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4);
	await page.getByLabel("Data inicial").fill(dateValue(now));
	await page.getByLabel("Data final").fill(dateValue(targetDate));
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("link", { name: "Plano" }).click();
	const futureChapter = page.getByRole("checkbox", { name: "Jeremias 7" });
	await futureChapter.evaluate((element) => (element as HTMLInputElement).click());
	await expect(page.getByRole("status").filter({ hasText: "marcado como lido" })).toBeVisible();
	await page.getByRole("button", { name: "Desfazer" }).click();
	await expect(futureChapter).toBeVisible();
	await expect(futureChapter).not.toBeChecked();
	await futureChapter.evaluate((element) => (element as HTMLInputElement).click());
	await page.getByRole("link", { name: "Concluídos" }).click();
	const completedChapter = page.getByRole("checkbox", { name: "Jeremias 7" });
	await expect(completedChapter).toBeChecked();
	await completedChapter.evaluate((element) => (element as HTMLInputElement).click());
	await expect(completedChapter).toHaveCount(0);
	await page.getByRole("link", { name: "Plano" }).click();
	await expect(page.getByRole("checkbox", { name: "Jeremias 7" })).toBeVisible();
});

test("protects dirty plan edits and keeps settings accessible while editing", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.getByRole("button", { name: "Editar plano" }).click();
	await expect(page.getByRole("heading", { name: "Editar plano" })).toBeVisible();
	await page.getByRole("button", { name: "Configurações" }).click();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
	await page.getByRole("button", { name: "Editar plano" }).click();
	await page.getByLabel("Capítulo inicial").selectOption("2");
	await page.getByRole("link", { name: "Plano" }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("heading", { name: "Editar plano" })).toBeVisible();
	await page.getByRole("link", { name: "Plano" }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Descartar alterações" }).click();
	await expect(page.getByRole("heading", { name: "Plano" })).toBeVisible();
});

test("returns from plan editing to its origin and protects browser Back when dirty", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.getByRole("button", { name: "Editar plano" }).click();
	await page.getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
	await page.getByRole("button", { name: "Editar plano" }).click();
	await page.getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
	await page.getByRole("button", { name: "Editar plano" }).click();
	await page.getByLabel("Capítulo inicial").selectOption("2");
	await page.goBack();
	await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("heading", { name: "Editar plano" })).toBeVisible();
});

test("preserves browser history when discarding dirty edits through Back", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.getByRole("button", { name: "Editar plano" }).click();
	await page.getByLabel("Capítulo inicial").selectOption("2");
	await page.goBack();
	await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("heading", { name: "Editar plano" })).toBeVisible();
	await page.goBack();
	await page.getByRole("dialog").getByRole("button", { name: "Descartar alterações" }).click();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
	await page.goBack();
	await expect(page.getByRole("link", { name: "Hoje" })).toHaveAttribute("aria-current", "page");
	await page.goForward();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
});

test("filters completed chapters to a selected book", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption("JER");
	await page.getByLabel("Capítulo inicial").selectOption("1");
	await page.getByLabel("Livro final").selectOption("MAT");
	await page.getByLabel("Capítulo final").selectOption("2");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.locator("#progress-start-chapter").selectOption("JER.1");
	await page.locator("#progress-end-book").selectOption("MAT");
	await page.locator("#progress-end-chapter").selectOption("MAT.2");
	await page.getByRole("button", { name: /Marcar .* capítulos como lidos/ }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Marcar como lidos" }).click();
	await page.getByRole("link", { name: "Concluídos" }).click();
	await page.getByLabel("Filtrar por livro").selectOption("JER");
	await expect(
		page.locator(".completed-row span").getByText("Jeremias 1", { exact: true }),
	).toBeVisible();
	await expect(
		page.locator(".completed-row span").getByText("Mateus 1", { exact: true }),
	).toHaveCount(0);
});

test("creates a plan with chapters already read through a selected point", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption("JER");
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption("JER");
	await page.getByLabel("Capítulo final").selectOption("15");
	await page.locator("#read-through-book").selectOption("JER");
	await page.locator("#read-through-chapter").selectOption("JER.10");
	await page.getByRole("button", { name: "Criar plano" }).click();

	await expect(page.getByRole("checkbox", { name: "Jeremias 11" })).toBeVisible();
	await expect(page.getByRole("checkbox", { name: "Jeremias 6" })).toHaveCount(0);
});

test("marks a selected chapter range as read in settings", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption("JER");
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption("JER");
	await page.getByLabel("Capítulo final").selectOption("15");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();

	await page.locator("#progress-end-chapter").selectOption("JER.10");
	await expect(page.getByText("5 capítulos no intervalo; 0 já concluídos.")).toBeVisible();
	await page.getByRole("button", { name: "Marcar 5 capítulos como lidos" }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Marcar como lidos" }).click();
	await expect(page.getByText("5 capítulos no intervalo; 5 já concluídos.")).toBeVisible();
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

test("keeps today's assignment stable while recalculating future progress", async ({ page }) => {
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
	const todayRows = page.locator(".today-card .reading-row span");
	const originalToday = await todayRows.allTextContents();
	await todayChapter.click();
	await expect(todayChapter).toBeChecked();
	await expect(page.getByText("1 de 17 capítulos")).toBeVisible();
	await page.getByRole("link", { name: "Plano" }).click();
	const futureChapter = page.getByRole("checkbox", { name: "Jeremias 10" });
	await expect(futureChapter).toBeVisible();
	await futureChapter.click();
	await expect(page.getByText("2 de 17 capítulos")).toBeVisible();
	await expect(futureChapter).toHaveCount(0);
	await expect(page.getByRole("checkbox", { name: "Jeremias 7" })).toBeVisible();
	await page.getByRole("link", { name: "Hoje" }).click();
	await expect(page.getByRole("link", { name: "Hoje" })).toHaveAttribute("aria-current", "page");
	await expect(page.locator(".today-card")).toBeVisible();
	await expect(todayChapter).toBeChecked();
	expect(await todayRows.allTextContents()).toEqual(originalToday);
	await expect(page.getByRole("heading", { name: "Jeremias 6–22" })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("checkbox", { name: "Jeremias 6" })).toBeChecked();
	expect(await page.locator(".today-card .reading-row span").allTextContents()).toEqual(
		originalToday,
	);
});

test("does not infer new completed chapters when editing the plan start", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption("JER");
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption("JER");
	await page.getByLabel("Capítulo final").selectOption("15");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.locator("#progress-end-chapter").selectOption("JER.10");
	await page.getByRole("button", { name: "Marcar 5 capítulos como lidos" }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Marcar como lidos" }).click();
	await page.getByRole("button", { name: "Editar plano" }).click();
	await page.getByLabel("Capítulo inicial").selectOption("4");
	await page.getByRole("button", { name: "Salvar alterações" }).click();
	const progress = await page.evaluate(() =>
		JSON.parse(localStorage.getItem("zion:v1") ?? "{}").progress.map(
			(item: { chapter: string }) => item.chapter,
		),
	);
	expect(progress).toContain("JER.6");
	expect(progress).toContain("JER.10");
	expect(progress).not.toContain("JER.4");
	expect(progress).not.toContain("JER.5");
});

test("allows reversing chapter progress individually and by range", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption("JER");
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption("JER");
	await page.getByLabel("Capítulo final").selectOption("10");
	await page.getByRole("button", { name: "Criar plano" }).click();
	const chapter = page.getByRole("checkbox", { name: "Jeremias 6" });
	await chapter.click();
	await expect(chapter).toBeChecked();
	await chapter.click();
	await expect(chapter).not.toBeChecked();
	await page.reload();
	await expect(page.getByRole("checkbox", { name: "Jeremias 6" })).not.toBeChecked();

	await page.getByRole("button", { name: "Configurações" }).click();
	await page.locator("#progress-start-chapter").selectOption("JER.6");
	await page.locator("#progress-end-chapter").selectOption("JER.7");
	await page.getByRole("button", { name: "Marcar 2 capítulos como lidos" }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Marcar como lidos" }).click();
	await expect(page.getByText("2 capítulos no intervalo; 2 já concluídos.")).toBeVisible();
	await page.getByRole("button", { name: "Desmarcar 2 capítulos" }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Desmarcar capítulos" }).click();
	await expect(page.getByText("2 capítulos no intervalo; 0 já concluídos.")).toBeVisible();
});

test("does not overwrite corrupt local data until the user creates a plan", async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem("zion:v1", "not-json"));
	await page.goto("/");
	await expect(page.getByRole("status")).toContainText("não serão substituídos automaticamente");
	expect(await page.evaluate(() => localStorage.getItem("zion:v1"))).toBe("not-json");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await expect
		.poll(() => page.evaluate(() => localStorage.getItem("zion:v1")))
		.not.toBe("not-json");
	await expect(page.getByText(/Os dados locais estão indisponíveis/)).toHaveCount(0);
});

test("refreshes the local reading date across midnight without a reload", async ({ page }) => {
	await page.clock.install({ time: new Date("2026-10-05T23:59:00") });
	await page.goto("/");
	const dates = await page.evaluate(() => {
		const format = (date: Date) =>
			`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
		const today = new Date();
		const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
		const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
		return { today: format(today), tomorrow: format(tomorrow), target: format(target) };
	});
	await page.getByLabel("Livro inicial").selectOption("JER");
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption("JER");
	await page.getByLabel("Capítulo final").selectOption("10");
	await page.getByLabel("Data inicial").fill(dates.today);
	await page.getByLabel("Data final").fill(dates.target);
	await page.getByRole("button", { name: "Criar plano" }).click();
	await expect
		.poll(() =>
			page.evaluate(
				() => JSON.parse(localStorage.getItem("zion:v1") ?? "{}").dailyAssignment?.date,
			),
		)
		.toBe(dates.today);
	await page.clock.fastForward(120_000);
	await expect
		.poll(() =>
			page.evaluate(
				() => JSON.parse(localStorage.getItem("zion:v1") ?? "{}").dailyAssignment?.date,
			),
		)
		.toBe(dates.tomorrow);
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

	await page.getByRole("button", { name: "Remover plano" }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Remover plano" }).click();
	await expect(page.getByRole("heading", { name: "Crie seu plano de leitura" })).toBeVisible();
	await page.getByLabel("Selecionar backup JSON").setInputFiles({
		name: backupFile.suggestedFilename(),
		mimeType: "application/json",
		buffer: await readFile(backupPath),
	});
	await page.getByRole("dialog").getByRole("button", { name: "Restaurar backup" }).click();
	await expect(page.getByRole("heading", { name: "Jeremias 6–22" })).toBeVisible();

	await page.getByRole("button", { name: "Configurações" }).click();
	const csvDownload = page.waitForEvent("download");
	await page.getByRole("button", { name: "Exportar cronograma CSV" }).click();
	const csvFile = await csvDownload;
	const csvPath = await csvFile.path();
	if (!csvPath) throw new Error("CSV download was not saved");
	expect(await readFile(csvPath, "utf8")).toContain("date,reading,status");
});

test("persists the selected theme", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo inicial").selectOption("6");
	await page.getByLabel("Livro final").selectOption({ label: "Jeremias" });
	await page.getByLabel("Capítulo final").selectOption("22");
	await page.getByRole("button", { name: "Criar plano" }).click();

	await page.getByRole("button", { name: "Tema: Sistema" }).click();
	await page.getByRole("button", { name: "Claro" }).click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	await page.reload();
	await expect(page.getByRole("button", { name: "Tema: Claro" })).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("uses the active application theme in confirmation modals and closes without fallback content", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Tema: Sistema" }).click();
	await page.getByRole("button", { name: "Escuro" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.getByRole("button", { name: "Resetar progresso" }).click();
	const modalPaper = page.getByRole("dialog");
	await expect(page.getByRole("dialog").getByRole("button", { name: "Cancelar" })).toBeFocused();
	const expectedSurface = await page.evaluate(() => {
		const probe = document.createElement("div");
		probe.style.backgroundColor = "var(--color-surface)";
		document.body.append(probe);
		const color = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return color;
	});
	await expect
		.poll(() => modalPaper.evaluate((node) => getComputedStyle(node).backgroundColor))
		.toBe(expectedSurface);
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(page.getByRole("heading", { name: "Confirmar ação" })).toHaveCount(0);
});

test("resets an invalid completed-book filter after its final result is removed", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByLabel("Livro inicial").selectOption("OBA");
	await page.getByLabel("Capítulo inicial").selectOption("1");
	await page.getByLabel("Livro final").selectOption("JON");
	await page.getByLabel("Capítulo final").selectOption("1");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.locator("#progress-end-book").selectOption("JON");
	await page.locator("#progress-end-chapter").selectOption("JON.1");
	await page.getByRole("button", { name: /Marcar .* capítulos como lidos/ }).click();
	await page.getByRole("dialog").getByRole("button", { name: "Marcar como lidos" }).click();
	await page.getByRole("link", { name: "Concluídos" }).click();
	await page.getByLabel("Filtrar por livro").selectOption("OBA");
	await page.locator(".completed-row").first().getByRole("checkbox").click();
	await expect(page.getByLabel("Filtrar por livro")).toHaveValue("");
	await expect(page.getByRole("checkbox", { name: "Jonas 1" })).toBeVisible();
});

test("returns to settings after printing", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Criar plano" }).click();
	await page.getByRole("button", { name: "Configurações" }).click();
	await page.evaluate(() => {
		window.print = () => window.dispatchEvent(new Event("afterprint"));
	});
	await page.getByRole("button", { name: "Imprimir / Salvar em PDF" }).click();
	await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
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
	await page.getByRole("link", { name: "Plano" }).click();

	for (const width of [320, 360, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		const dimensions = await page.evaluate(() => ({
			viewport: document.documentElement.clientWidth,
			content: document.documentElement.scrollWidth,
		}));
		expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
	}
	for (const width of [320, 360, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		for (const view of ["Concluídos", "Hoje", "Plano"]) {
			await page.getByRole("link", { name: view }).click();
			const dimensions = await page.evaluate(() => ({
				viewport: document.documentElement.clientWidth,
				content: document.documentElement.scrollWidth,
			}));
			expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
		}
		await page.getByRole("button", { name: "Configurações" }).click();
		let dimensions = await page.evaluate(() => ({
			viewport: document.documentElement.clientWidth,
			content: document.documentElement.scrollWidth,
		}));
		expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
		await page.getByRole("button", { name: "Editar plano" }).click();
		dimensions = await page.evaluate(() => ({
			viewport: document.documentElement.clientWidth,
			content: document.documentElement.scrollWidth,
		}));
		expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
		await page.getByRole("button", { name: "Cancelar" }).click();
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

	await expect(page.getByRole("heading", { name: "Plano" })).toBeVisible();
	await page.emulateMedia({ media: "print" });
	await expect(page.getByLabel("Resumo para impressão")).toBeVisible();
	await expect(
		page.getByLabel("Resumo para impressão").getByRole("img", { name: "Zion" }),
	).toBeVisible();
});
