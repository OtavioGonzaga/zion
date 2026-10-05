import { useEffect, useState } from "react";
import { appConfig } from "../config/app";
import { addDays, formatLocalDate, getCurrentLocalDate } from "../domain/bible/date";
import { formatReferences } from "../domain/bible/references";
import type { LocalDate } from "../domain/bible/types";
import type { ReadingPlan } from "../domain/plan/types";
import { PlanForm } from "../features/plan-editor/PlanForm";
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

export function App() {
	const [appState, setAppState] = useState<AppState>(() => loadAppState().state);
	const [storageIssue, setStorageIssue] = useState(() => loadAppState().issue);
	const [editing, setEditing] = useState(false);
	const today = getCurrentLocalDate();
	const defaultTargetDate = addDays(today, 364);

	useEffect(() => {
		if (!saveAppState(appState)) setStorageIssue("unavailable");
	}, [appState]);

	function savePlan(plan: ReadingPlan) {
		setAppState((state) => ({ ...state, plan, progress: [], dailyAssignment: null }));
		setEditing(false);
	}

	function setTheme(theme: ThemePreference) {
		applyTheme(theme);
		setAppState((state) => ({ ...state, preferences: { ...state.preferences, theme } }));
	}

	return (
		<div className="app-shell">
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
						value={appState.preferences.theme}
						onChange={(event) => setTheme(event.target.value as ThemePreference)}
					>
						<option value="system">Sistema</option>
						<option value="dark">Escuro</option>
						<option value="light">Claro</option>
					</select>
				</div>
			</header>
			{storageIssue && (
				<p className="notice" role="status">
					Os dados locais não puderam ser lidos ou salvos. Você pode continuar, mas as alterações
					talvez não permaneçam após fechar esta página.
				</p>
			)}

			{!appState.plan || editing ? (
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
							startDate={today as LocalDate}
							targetDate={defaultTargetDate}
							onSubmit={savePlan}
							onCancel={editing ? () => setEditing(false) : undefined}
						/>
					</section>
				</main>
			) : (
				<main className="dashboard">
					<section className="card summary-card" aria-labelledby="plan-heading">
						<p className="eyebrow">Seu plano de leitura</p>
						<h1 className="plan-title" id="plan-heading">
							{formatReferences([appState.plan.startReference, appState.plan.endReference])}
						</h1>
						<div className="plan-range">
							<span>
								De <strong>{formatLocalDate(appState.plan.startDate)}</strong>
							</span>
							<span>
								até <strong>{formatLocalDate(appState.plan.targetDate)}</strong>
							</span>
						</div>
						<p className="muted setup-intro">
							Seu plano está salvo neste navegador. O cronograma e o acompanhamento de progresso
							serão carregados a seguir.
						</p>
						<button
							className="button button-primary"
							type="button"
							onClick={() => setEditing(true)}
						>
							Editar plano
						</button>
					</section>
				</main>
			)}
		</div>
	);
}
