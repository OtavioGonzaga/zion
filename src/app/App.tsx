import { useEffect, useRef, useState } from "react";
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
import { ActionNotice } from "../components/ActionNotice";
import type { UndoNotice } from "../components/ActionNotice";
import { AppHeader } from "../components/AppHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import CloseIcon from "@mui/icons-material/Close";
import { PlanSummary } from "../components/PlanSummary";
import { PrimaryNavigation } from "../components/PrimaryNavigation";
import { ScheduleList, UpcomingList } from "../features/schedule/ScheduleList";
import { ChapterList } from "../features/today/ChapterList";
import { CompletedView } from "../features/completed/CompletedView";
import { PlanForm } from "../features/plan-editor/PlanForm";
import { BackupRestoreControl } from "../features/settings/BackupRestoreControl";
import { SettingsPanel } from "../features/settings/SettingsPanel";
import { readingTemplate } from "../data/reading-template";
import { saveAppState } from "../storage/state";
import type { AppState, ThemePreference } from "../storage/state";
import { isPrimaryView } from "./navigation";
import type { AppView, PrimaryView } from "./navigation";
import { useAppNavigation } from "./useAppNavigation";
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
	const [lastPrimaryView, setLastPrimaryView] = useState<PrimaryView>("today");
	const [editReturnView, setEditReturnView] = useState<AppView>("today");
	const [editDirty, setEditDirty] = useState(false);
	const [discardTarget, setDiscardTarget] = useState<AppView | null>(null);
	const [undoNotice, setUndoNotice] = useState<UndoNotice | null>(null);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [printRequested, setPrintRequested] = useState(false);
	const printReturnView = useRef<AppView>("today");
	const headingRef = useRef<HTMLHeadingElement>(null);
	const navigated = useRef(false);
	const hasPlan = Boolean(appState.plan);
	const { view, navigate, reset } = useAppNavigation(hasPlan, (next) => {
		if (effectiveView !== "edit-plan" || !editDirty) return true;
		setDiscardTarget(next === "setup" ? "today" : next);
		return false;
	});
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
	const completedSet = new Set(appState.progress.map(({ chapter }) => chapter));
	const effectiveView: AppView | "setup" = hasPlan ? (view === "setup" ? "today" : view) : "setup";

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
		)
			setAppState((state) => ({ ...state, dailyAssignment: projectedToday }));
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
		if (!navigated.current) {
			navigated.current = true;
			return;
		}
		headingRef.current?.focus();
	}, [effectiveView]);

	useEffect(() => {
		if (effectiveView !== "setup" && isPrimaryView(effectiveView))
			setLastPrimaryView(effectiveView);
	}, [effectiveView]);

	useEffect(() => {
		const title =
			effectiveView === "setup"
				? "Criar plano"
				: {
						today: "Hoje",
						schedule: "Plano",
						completed: "Concluídos",
						settings: "Configurações",
						"edit-plan": "Editar plano",
					}[effectiveView];
		document.title = `${title} · ${appConfig.name}`;
	}, [effectiveView]);

	useEffect(() => {
		if (!editDirty || effectiveView !== "edit-plan") return;
		const preventUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", preventUnload);
		return () => window.removeEventListener("beforeunload", preventUnload);
	}, [editDirty, effectiveView]);

	useEffect(() => {
		if (!printRequested || effectiveView !== "schedule") return;
		const frame = requestAnimationFrame(() => window.print());
		const afterPrint = () => {
			setPrintRequested(false);
			navigate(printReturnView.current);
		};
		window.addEventListener("afterprint", afterPrint, { once: true });
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("afterprint", afterPrint);
		};
	}, [effectiveView, navigate, printRequested]);

	useEffect(() => {
		if (!undoNotice) return;
		const timer = window.setTimeout(() => setUndoNotice(null), 6500);
		return () => window.clearTimeout(timer);
	}, [undoNotice]);

	useEffect(() => {
		if (!actionMessage) return;
		const timer = window.setTimeout(() => setActionMessage(null), 5000);
		return () => window.clearTimeout(timer);
	}, [actionMessage]);

	function go(next: AppView) {
		if (effectiveView === "edit-plan" && editDirty) {
			setDiscardTarget(next);
			return;
		}
		setActionMessage(null);
		if (effectiveView === "edit-plan") setEditDirty(false);
		if (isPrimaryView(next)) setLastPrimaryView(next);
		if (next !== "edit-plan") setUndoNotice(null);
		navigate(next);
	}

	function openEditPlan() {
		setEditReturnView(
			effectiveView === "edit-plan"
				? editReturnView
				: effectiveView === "setup"
					? "today"
					: effectiveView,
		);
		setEditDirty(false);
		go("edit-plan");
	}

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
		setEditDirty(false);
		setActionMessage("Plano atualizado.");
		if (effectiveView === "setup") navigate("today");
		else navigate(editReturnView);
	}

	function setTheme(theme: ThemePreference) {
		applyTheme(theme);
		setAppState((state) => ({ ...state, preferences: { ...state.preferences, theme } }));
	}

	function printPlan() {
		printReturnView.current =
			effectiveView === "settings"
				? lastPrimaryView
				: effectiveView === "setup"
					? "today"
					: effectiveView;
		setPrintRequested(true);
		navigate("schedule");
	}

	function toggleChapter(chapter: ChapterRef, checked: boolean) {
		setCanPersist(true);
		setAppState((state) => ({
			...state,
			progress: checked
				? markChapterComplete(state.progress, chapter, new Date().toISOString())
				: markChapterPending(state.progress, chapter),
		}));
		if (checked && effectiveView === "schedule" && !todayAssignment?.chapters.includes(chapter))
			setUndoNotice({ chapter });
		else if (!checked) setActionMessage(`${chapter} removido dos concluídos.`);
	}

	function undoChapter() {
		if (!undoNotice) return;
		setAppState((state) => ({
			...state,
			progress: markChapterPending(state.progress, undoNotice.chapter),
		}));
		setUndoNotice(null);
	}

	function restore(state: AppState) {
		setCanPersist(true);
		setAppState(state);
		applyTheme(state.preferences.theme);
		setActionMessage("Backup restaurado com sucesso.");
		if (state.plan) navigate("today");
	}

	function removePlan() {
		setCanPersist(true);
		setAppState((state) => ({ ...state, plan: null, progress: [], dailyAssignment: null }));
		setEditDirty(false);
		reset();
	}

	return (
		<div className="app-shell">
			<AppHeader
				theme={appState.preferences.theme}
				onThemeChange={setTheme}
				onHome={hasPlan ? () => go("today") : undefined}
				onSettings={
					hasPlan
						? () => go(effectiveView === "settings" ? lastPrimaryView : "settings")
						: undefined
				}
			/>
			{hasPlan && effectiveView !== "setup" && (
				<PrimaryNavigation view={effectiveView} navigate={go} />
			)}
			{storageIssue && <StorageNotice />}
			{effectiveView === "setup" ? (
				<main className="setup-layout">
					<section className="card setup-card">
						<p className="eyebrow">Primeiro acesso</p>
						<h1 className="plan-title" ref={headingRef} tabIndex={-1}>
							Crie seu plano de leitura
						</h1>
						<p className="muted setup-intro">
							Escolha o intervalo de capítulos e as datas para distribuir as leituras.
						</p>
						<PlanForm startDate={today} targetDate={defaultTargetDate} onSubmit={savePlan} />
						<div className="restore-from-backup">
							<p className="muted">Já tem um backup deste navegador ou de outro dispositivo?</p>
							<BackupRestoreControl onRestore={restore} />
						</div>
					</section>
				</main>
			) : appState.plan ? (
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
					{effectiveView !== "settings" && effectiveView !== "edit-plan" && summary && (
						<PlanSummary plan={appState.plan} progress={summary} />
					)}
					{effectiveView === "today" && (
						<>
							{computedSchedule?.status === "completed" ? (
								<section className="card state-card">
									<h1 tabIndex={-1} ref={headingRef}>
										Parabéns! Você terminou sua leitura.
									</h1>
								</section>
							) : computedSchedule?.status === "expired" ? (
								<section className="card state-card">
									<h1 tabIndex={-1} ref={headingRef}>
										Prazo encerrado
									</h1>
									<p>Seu prazo terminou com capítulos pendentes.</p>
									<button className="button button-primary" onClick={openEditPlan} type="button">
										Alterar data final
									</button>
								</section>
							) : (
								<section className="card today-card" aria-labelledby="today-heading">
									<div className="section-heading">
										<div>
											<p className="eyebrow">Leitura de hoje</p>
											<h1 id="today-heading" tabIndex={-1} ref={headingRef}>
												{formatLocalDate(today, { weekday: "long", day: "2-digit", month: "long" })}
											</h1>
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
							)}
							<section className="card upcoming-card" aria-labelledby="upcoming-heading">
								<div className="section-heading">
									<h2 id="upcoming-heading">Próximas leituras</h2>
									<button className="button" type="button" onClick={() => go("schedule")}>
										Ver plano
									</button>
								</div>
								<UpcomingList assignments={displaySchedule?.assignments ?? []} today={today} />
							</section>
						</>
					)}
					{effectiveView === "schedule" && (
						<section className="card schedule-card" aria-labelledby="schedule-heading">
							<div className="section-heading">
								<div>
									<p className="eyebrow">Cronograma recalculado</p>
									<h1 id="schedule-heading" tabIndex={-1} ref={headingRef}>
										Plano
									</h1>
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
					)}
					{effectiveView === "completed" && (
						<CompletedView
							progress={appState.progress}
							plan={appState.plan}
							completed={completedSet}
							onToggle={toggleChapter}
							headingRef={headingRef}
						/>
					)}
					{effectiveView === "settings" && (
						<SettingsPanel
							state={appState}
							schedule={displaySchedule}
							todayAssignment={todayAssignment}
							onRestore={restore}
							onResetProgress={() => {
								setAppState((state) => ({ ...state, progress: [] }));
								setActionMessage("Progresso resetado.");
							}}
							onMarkRange={(start, end) =>
								setAppState((state) => ({
									...state,
									progress: mergeCompletedRange(
										state.progress,
										start,
										end,
										new Date().toISOString(),
									),
								}))
							}
							onUnmarkRange={(start, end) =>
								setAppState((state) => ({
									...state,
									progress: markRangePending(state.progress, start, end),
								}))
							}
							onRemovePlan={removePlan}
							onPrint={printPlan}
							onEditPlan={openEditPlan}
							headingRef={headingRef}
						/>
					)}
					{effectiveView === "edit-plan" && (
						<section className="card setup-card edit-plan-card">
							<p className="eyebrow">Configurações do plano</p>
							<h1 className="plan-title" tabIndex={-1} ref={headingRef}>
								Editar plano
							</h1>
							<p className="muted setup-intro">
								Atualize o intervalo de capítulos e as datas do seu plano.
							</p>
							<PlanForm
								key={`${appState.plan.startReference}:${appState.plan.endReference}:${appState.plan.startDate}:${appState.plan.targetDate}`}
								initialPlan={appState.plan}
								startDate={today}
								targetDate={defaultTargetDate}
								onSubmit={savePlan}
								onCancel={() => {
									setEditDirty(false);
									navigate(editReturnView);
								}}
								onDirtyChange={setEditDirty}
							/>
						</section>
					)}
				</main>
			) : null}
			{hasPlan && <ActionNotice notice={undoNotice} onUndo={undoChapter} />}
			<ConfirmDialog
				open={discardTarget !== null}
				title="Descartar alterações?"
				message="As alterações feitas no plano ainda não foram salvas. Se sair agora, elas serão perdidas."
				confirmLabel="Descartar alterações"
				destructive
				onCancel={() => setDiscardTarget(null)}
				onConfirm={() => {
					if (discardTarget) {
						setEditDirty(false);
						navigate(discardTarget);
					}
					setDiscardTarget(null);
				}}
			/>
			{actionMessage && (
				<div className="action-message" role="status" aria-live="polite">
					<span>{actionMessage}</span>
					<button type="button" aria-label="Fechar aviso" onClick={() => setActionMessage(null)}>
						<CloseIcon aria-hidden="true" fontSize="small" />
					</button>
				</div>
			)}
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
