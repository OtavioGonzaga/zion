import { useEffect, useState } from "react";
import { appConfig } from "../config/app";
import { addDays, formatLocalDate, getCurrentLocalDate, listDates } from "../domain/bible/date";
import { formatReferenceRange, formatReferences } from "../domain/bible/references";
import type { ChapterRef, LocalDate } from "../domain/bible/types";
import { findAssignment, generateSchedule, getPlanProgress } from "../domain/plan/scheduler";
import type { DailyAssignment, ReadingPlan } from "../domain/plan/types";
import { PlanForm } from "../features/plan-editor/PlanForm";
import { BackupRestoreControl } from "../features/settings/BackupRestoreControl";
import { SettingsPanel } from "../features/settings/SettingsPanel";
import { readingTemplate } from "../data/reading-template";
import { loadAppState, saveAppState } from "../storage/state";
import type { AppState, ThemePreference } from "../storage/state";

function applyTheme(theme: ThemePreference) {
	document.documentElement.dataset.theme =
		theme === "system"
			? window.matchMedia("(prefers-color-scheme: light)").matches
				? "light"
				: "dark"
			: theme;
}

function describeDay(date: LocalDate, today: LocalDate) {
	if (date === today) return "Hoje";
	return formatLocalDate(date, { weekday: "short", day: "2-digit", month: "short" });
}

export function App() {
	const [appState, setAppState] = useState<AppState>(() => loadAppState().state);
	const [storageIssue, setStorageIssue] = useState(() => loadAppState().issue);
	const [editing, setEditing] = useState(false);
	const [showSchedule, setShowSchedule] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const today = getCurrentLocalDate();
	const defaultTargetDate = addDays(today, 364);
	const computedSchedule = appState.plan
		? generateSchedule({
				template: readingTemplate,
				plan: appState.plan,
				progress: appState.progress,
				today,
			})
		: null;
	const projectedToday = computedSchedule ? findAssignment(computedSchedule, today) : undefined;
	const frozenToday: DailyAssignment | undefined =
		appState.dailyAssignment?.date === today
			? { ...appState.dailyAssignment, blocks: [], weight: 0 }
			: projectedToday;
	const summary = appState.plan ? getPlanProgress(appState.plan, appState.progress) : null;
	const completedSet = new Set(appState.progress.map((item) => item.chapter));

	useEffect(() => {
		if (!saveAppState(appState)) setStorageIssue("unavailable");
	}, [appState]);

	useEffect(() => {
		if (projectedToday && appState.dailyAssignment?.date !== today) {
			setAppState((state) => ({
				...state,
				dailyAssignment: { date: today, chapters: projectedToday.chapters, blocks: [], weight: 0 },
			}));
		}
	}, [projectedToday, appState.dailyAssignment?.date, today]);

	function savePlan(plan: ReadingPlan) {
		setAppState((state) => ({ ...state, plan, progress: [], dailyAssignment: null }));
		setEditing(false);
		setShowSchedule(false);
	}

	function setTheme(theme: ThemePreference) {
		applyTheme(theme);
		setAppState((state) => ({ ...state, preferences: { ...state.preferences, theme } }));
	}

	function printPlan() {
		setShowSchedule(true);
		requestAnimationFrame(() => window.print());
	}

	function toggleChapter(chapter: ChapterRef, checked: boolean) {
		setAppState((state) => ({
			...state,
			progress: checked
				? [
						...state.progress.filter((item) => item.chapter !== chapter),
						{ chapter, completedAt: new Date().toISOString() },
					]
				: state.progress.filter((item) => item.chapter !== chapter),
		}));
	}

	if (appState.plan === null || editing) {
		return (
			<div className="app-shell">
				<Header theme={appState.preferences.theme} onThemeChange={setTheme} />
				{storageIssue && <StorageNotice />}
				<main className="setup-layout">
					<section className="card setup-card">
						<p className="eyebrow">{editing ? "Configurações do plano" : "Primeiro acesso"}</p>
						<h1 className="plan-title">
							{editing ? "Edite seu plano" : "Crie seu plano de leitura"}
						</h1>
						<p className="muted setup-intro">
							Escolha o intervalo de capítulos e as datas para distribuir as leituras.
						</p>
						<PlanForm
							initialPlan={editing ? (appState.plan ?? undefined) : undefined}
							startDate={today}
							targetDate={defaultTargetDate}
							onSubmit={savePlan}
							onCancel={editing ? () => setEditing(false) : undefined}
						/>
						<div className="restore-from-backup">
							<p className="muted">Já tem um backup deste navegador ou de outro dispositivo?</p>
							<BackupRestoreControl
								onRestore={(state) => {
									setAppState(state);
									applyTheme(state.preferences.theme);
								}}
							/>
						</div>
					</section>
				</main>
			</div>
		);
	}

	return (
		<div className="app-shell">
			<Header
				theme={appState.preferences.theme}
				onThemeChange={setTheme}
				onSettings={() => setShowSettings((value) => !value)}
			/>
			{storageIssue && <StorageNotice />}
			<main className="dashboard">
				<section className="card summary-card" aria-labelledby="plan-heading">
					<p className="eyebrow">Seu plano de leitura</p>
					<h1 className="plan-title" id="plan-heading">
						{formatReferenceRange(appState.plan.startReference, appState.plan.endReference)}
					</h1>
					<div className="plan-range">
						<span>
							De <strong>{formatLocalDate(appState.plan.startDate)}</strong>
						</span>
						<span>
							até <strong>{formatLocalDate(appState.plan.targetDate)}</strong>
						</span>
					</div>
					<div className="progress-label">
						<strong>{summary?.percentage}% concluído</strong>
						<span className="muted">
							{summary?.completed} de {summary?.total} capítulos
						</span>
					</div>
					<div
						className="progress-track"
						role="progressbar"
						aria-label="Progresso do plano"
						aria-valuenow={summary?.percentage ?? 0}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<div className="progress-fill" style={{ width: `${summary?.percentage ?? 0}%` }} />
					</div>
					<div className="dashboard-actions">
						<button className="button" type="button" onClick={() => setEditing(true)}>
							Editar plano
						</button>
						<button
							className="button"
							type="button"
							onClick={() => setShowSchedule((value) => !value)}
						>
							{showSchedule ? "Ver hoje" : "Ver plano completo"}
						</button>
					</div>
				</section>

				{showSettings ? (
					<SettingsPanel
						state={appState}
						schedule={computedSchedule}
						todayAssignment={frozenToday}
						onRestore={(state) => {
							setAppState(state);
							applyTheme(state.preferences.theme);
							setShowSettings(false);
						}}
						onResetProgress={() => setAppState((state) => ({ ...state, progress: [] }))}
						onRemovePlan={() => {
							setAppState((state) => ({
								...state,
								plan: null,
								progress: [],
								dailyAssignment: null,
							}));
							setShowSettings(false);
							setEditing(false);
						}}
						onPrint={printPlan}
					/>
				) : computedSchedule?.status === "completed" ? (
					<section className="card state-card">
						<p className="eyebrow">Plano concluído</p>
						<h2>Parabéns! Você terminou sua leitura.</h2>
					</section>
				) : computedSchedule?.status === "expired" ? (
					<section className="card state-card" role="status">
						<p className="eyebrow">Prazo encerrado</p>
						<h2>Seu prazo terminou com capítulos pendentes.</h2>
						<p className="muted">Edite a data final para redistribuir as leituras restantes.</p>
						<button
							className="button button-primary"
							type="button"
							onClick={() => setEditing(true)}
						>
							Alterar data final
						</button>
					</section>
				) : computedSchedule?.status === "not-started" ? (
					<section className="card state-card">
						<p className="eyebrow">Sua leitura começa em</p>
						<h2>{formatLocalDate(appState.plan.startDate)}</h2>
						<ScheduleList
							assignments={computedSchedule.assignments}
							today={today}
							completed={completedSet}
							onToggle={toggleChapter}
						/>
					</section>
				) : showSchedule ? (
					<section className="card schedule-card" aria-labelledby="schedule-heading">
						<div className="section-heading">
							<div>
								<p className="eyebrow">Cronograma recalculado</p>
								<h2 id="schedule-heading">Próximas leituras</h2>
							</div>
							<span className="muted">
								{listDates(today, appState.plan.targetDate).length} dias restantes
							</span>
						</div>
						<ScheduleList
							assignments={computedSchedule?.assignments ?? []}
							today={today}
							completed={completedSet}
							onToggle={toggleChapter}
						/>
					</section>
				) : (
					<>
						<section className="card today-card" aria-labelledby="today-heading">
							<div className="section-heading">
								<div>
									<p className="eyebrow">Leitura de hoje</p>
									<h2 id="today-heading">
										{formatLocalDate(today, { weekday: "long", day: "2-digit", month: "long" })}
									</h2>
								</div>
								<span className="today-date">HOJE</span>
							</div>
							{frozenToday?.chapters.length ? (
								<ChapterList
									chapters={frozenToday.chapters}
									completed={completedSet}
									onToggle={toggleChapter}
								/>
							) : (
								<p className="muted">
									Não há leitura prevista para hoje. Seu próximo dia de leitura aparece abaixo.
								</p>
							)}
						</section>
						<section className="card upcoming-card" aria-labelledby="upcoming-heading">
							<div className="section-heading">
								<h2 id="upcoming-heading">Próximas leituras</h2>
								<button className="button" type="button" onClick={() => setShowSchedule(true)}>
									Ver plano
								</button>
							</div>
							<UpcomingList assignments={computedSchedule?.assignments ?? []} today={today} />
						</section>
					</>
				)}
			</main>
		</div>
	);
}

function Header({
	theme,
	onThemeChange,
	onSettings,
}: {
	theme: ThemePreference;
	onThemeChange: (theme: ThemePreference) => void;
	onSettings?: () => void;
}) {
	return (
		<header className="app-header">
			<span className="brand" aria-label={appConfig.name}>
				{appConfig.name.toUpperCase()}
			</span>
			<div className="header-actions">
				<label htmlFor="theme-select" className="sr-only">
					Tema
				</label>
				<select
					id="theme-select"
					className="icon-button"
					value={theme}
					onChange={(event) => onThemeChange(event.target.value as ThemePreference)}
				>
					<option value="system">Sistema</option>
					<option value="dark">Escuro</option>
					<option value="light">Claro</option>
				</select>
				{onSettings && (
					<button
						className="icon-button"
						type="button"
						onClick={onSettings}
						aria-label="Configurações"
					>
						⚙
					</button>
				)}
			</div>
		</header>
	);
}

function StorageNotice() {
	return (
		<p className="notice" role="status">
			Os dados locais não puderam ser lidos ou salvos. Você pode continuar, mas as alterações talvez
			não permaneçam após fechar esta página.
		</p>
	);
}

function ChapterList({
	chapters,
	completed,
	onToggle,
}: {
	chapters: ChapterRef[];
	completed: Set<ChapterRef>;
	onToggle: (chapter: ChapterRef, checked: boolean) => void;
}) {
	return (
		<div className="reading-list">
			{chapters.map((chapter) => (
				<label className="reading-row" key={chapter}>
					<input
						type="checkbox"
						checked={completed.has(chapter)}
						onChange={(event) => onToggle(chapter, event.target.checked)}
					/>
					<span>{formatReferences([chapter])}</span>
				</label>
			))}
		</div>
	);
}

function ScheduleList({
	assignments,
	today,
	completed,
	onToggle,
}: {
	assignments: DailyAssignment[];
	today: LocalDate;
	completed: Set<ChapterRef>;
	onToggle: (chapter: ChapterRef, checked: boolean) => void;
}) {
	return (
		<div className="schedule-list">
			{assignments.map((assignment) => (
				<article className="schedule-day" key={assignment.date}>
					<div className="schedule-day-heading">
						<time dateTime={assignment.date}>{describeDay(assignment.date, today)}</time>
						<strong>
							{assignment.chapters.length ? formatReferences(assignment.chapters) : "Dia livre"}
						</strong>
					</div>
					{assignment.chapters.length > 0 && (
						<ChapterList chapters={assignment.chapters} completed={completed} onToggle={onToggle} />
					)}
				</article>
			))}
		</div>
	);
}

function UpcomingList({
	assignments,
	today,
}: {
	assignments: DailyAssignment[];
	today: LocalDate;
}) {
	const upcoming = assignments
		.filter((assignment) => assignment.date > today && assignment.chapters.length > 0)
		.slice(0, 4);
	return upcoming.length ? (
		<div className="upcoming-list">
			{upcoming.map((assignment) => (
				<div className="upcoming-item" key={assignment.date}>
					<time dateTime={assignment.date}>{describeDay(assignment.date, today)}</time>
					<strong>{formatReferences(assignment.chapters)}</strong>
				</div>
			))}
		</div>
	) : (
		<p className="muted">Nenhuma leitura futura pendente.</p>
	);
}
