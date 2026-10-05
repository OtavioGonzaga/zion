import { useEffect, useState } from "react";
import { appConfig } from "../config/app";
import { addDays, formatLocalDate, listDates } from "../domain/bible/date";
import { formatReferenceRange } from "../domain/bible/references";
import type { ChapterRef } from "../domain/bible/types";
import {
	markChapterComplete,
	markChapterPending,
	markRangePending,
	mergeCompletedRange,
} from "../domain/plan/progress";
import {
	findAssignment,
	generateAdaptiveSchedule,
	generateSchedule,
	getPlanProgress,
} from "../domain/plan/scheduler";
import type { ReadingPlan } from "../domain/plan/types";
import { AppHeader } from "../components/AppHeader";
import { ScheduleList, UpcomingList } from "../features/schedule/ScheduleList";
import { ChapterList } from "../features/today/ChapterList";
import { PlanForm } from "../features/plan-editor/PlanForm";
import { BackupRestoreControl } from "../features/settings/BackupRestoreControl";
import { SettingsPanel } from "../features/settings/SettingsPanel";
import { readingTemplate } from "../data/reading-template";
import { saveAppState } from "../storage/state";
import type { AppState, ThemePreference } from "../storage/state";
import { useCurrentLocalDate } from "./useCurrentLocalDate";

function applyTheme(theme: ThemePreference) {
	document.documentElement.dataset.theme =
		theme === "system"
			? window.matchMedia("(prefers-color-scheme: light)").matches
				? "light"
				: "dark"
			: theme;
}

export function App({
	initialState,
	initialStorageIssue,
	canPersistInitially,
}: {
	initialState: AppState;
	initialStorageIssue: string | null;
	canPersistInitially: boolean;
}) {
	const [appState, setAppState] = useState<AppState>(initialState);
	const [storageIssue, setStorageIssue] = useState(initialStorageIssue);
	const [canPersist, setCanPersist] = useState(canPersistInitially);
	const [editing, setEditing] = useState(false);
	const [showSchedule, setShowSchedule] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [printRequested, setPrintRequested] = useState(false);
	const today = useCurrentLocalDate();
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
	const todayAssignment =
		appState.dailyAssignment?.date === today ? appState.dailyAssignment : projectedToday;
	const displaySchedule = appState.plan
		? generateAdaptiveSchedule({
				template: readingTemplate,
				plan: appState.plan,
				progress: appState.progress,
				today,
				todayAssignment,
			})
		: null;
	const summary = appState.plan ? getPlanProgress(appState.plan, appState.progress) : null;
	const completedSet = new Set(appState.progress.map((item) => item.chapter));

	useEffect(() => {
		if (!canPersist) return;
		if (saveAppState(appState)) setStorageIssue(null);
		else setStorageIssue("unavailable");
	}, [appState, canPersist]);

	useEffect(() => {
		if (
			computedSchedule?.status === "active" &&
			projectedToday &&
			appState.dailyAssignment?.date !== today
		) {
			setAppState((state) => ({ ...state, dailyAssignment: projectedToday }));
		}
	}, [appState.dailyAssignment?.date, computedSchedule?.status, projectedToday, today]);

	useEffect(() => {
		if (appState.preferences.theme !== "system") return;
		const media = window.matchMedia("(prefers-color-scheme: light)");
		const updateTheme = (event: MediaQueryListEvent) => {
			document.documentElement.dataset.theme = event.matches ? "light" : "dark";
		};
		media.addEventListener("change", updateTheme);
		return () => media.removeEventListener("change", updateTheme);
	}, [appState.preferences.theme]);

	useEffect(() => {
		if (!printRequested || !showSchedule) return;
		const frame = requestAnimationFrame(() => {
			window.print();
			setPrintRequested(false);
		});
		return () => cancelAnimationFrame(frame);
	}, [printRequested, showSchedule]);

	function savePlan(plan: ReadingPlan, completedThrough?: ChapterRef) {
		setCanPersist(true);
		setAppState((state) => {
			const progress = state.plan ? state.progress : [];
			return {
				...state,
				plan,
				progress: completedThrough
					? mergeCompletedRange(
							progress,
							plan.startReference,
							completedThrough,
							new Date().toISOString(),
						)
					: progress,
				dailyAssignment: null,
			};
		});
		setEditing(false);
		setShowSchedule(false);
	}

	function setTheme(theme: ThemePreference) {
		applyTheme(theme);
		setAppState((state) => ({ ...state, preferences: { ...state.preferences, theme } }));
	}

	function printPlan() {
		setShowSettings(false);
		setShowSchedule(true);
		setPrintRequested(true);
	}

	function toggleChapter(chapter: ChapterRef, checked: boolean) {
		setCanPersist(true);
		setAppState((state) => ({
			...state,
			progress: checked
				? markChapterComplete(state.progress, chapter, new Date().toISOString())
				: markChapterPending(state.progress, chapter),
		}));
	}

	if (appState.plan === null || editing) {
		return (
			<div className="app-shell">
				<AppHeader theme={appState.preferences.theme} onThemeChange={setTheme} />
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
									setCanPersist(true);
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
			<AppHeader
				theme={appState.preferences.theme}
				onThemeChange={setTheme}
				onSettings={() => setShowSettings((value) => !value)}
			/>
			{storageIssue && <StorageNotice />}
			<main className="dashboard">
				<section className="print-header" aria-label="Resumo para impressão">
					<img
						src={`${import.meta.env.BASE_URL}assets/zion-logo-horizontal.png`}
						alt={appConfig.name}
					/>
					<div>
						<p>Plano de leitura</p>
						<h1>
							{formatReferenceRange(appState.plan.startReference, appState.plan.endReference)}
						</h1>
					</div>
				</section>
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
						schedule={displaySchedule}
						todayAssignment={todayAssignment}
						onRestore={(state) => {
							setCanPersist(true);
							setAppState(state);
							applyTheme(state.preferences.theme);
							setShowSettings(false);
						}}
						onResetProgress={() => {
							setCanPersist(true);
							setAppState((state) => ({ ...state, progress: [] }));
						}}
						onMarkRange={(start, end) => {
							setCanPersist(true);
							setAppState((state) => ({
								...state,
								progress: mergeCompletedRange(state.progress, start, end, new Date().toISOString()),
							}));
						}}
						onUnmarkRange={(start, end) => {
							setCanPersist(true);
							setAppState((state) => ({
								...state,
								progress: markRangePending(state.progress, start, end),
							}));
						}}
						onRemovePlan={() => {
							setCanPersist(true);
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
							assignments={displaySchedule?.assignments ?? []}
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
							assignments={displaySchedule?.assignments ?? []}
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
							{todayAssignment?.chapters.length ? (
								<ChapterList
									chapters={todayAssignment.chapters}
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
							<UpcomingList assignments={displaySchedule?.assignments ?? []} today={today} />
						</section>
					</>
				)}
			</main>
		</div>
	);
}

function StorageNotice() {
	return (
		<p className="notice" role="status">
			Os dados locais estão indisponíveis ou têm um formato não reconhecido. Eles não serão
			substituídos automaticamente; exporte ou restaure um backup, ou crie um plano para iniciar um
			novo estado.
		</p>
	);
}
