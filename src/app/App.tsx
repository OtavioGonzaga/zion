import { useState } from "react";
import { appConfig } from "../config/app";

type ThemePreference = "system" | "dark" | "light";

const sampleReadings = ["Jeremias 6", "Jeremias 7", "Jeremias 8", "Jeremias 9", "Jeremias 10"];
const upcomingReadings = [
	{ date: "06 OUT", reading: "Jeremias 11–17" },
	{ date: "07 OUT", reading: "Jeremias 18–22" },
	{ date: "08 OUT", reading: "Jeremias 23–29" },
];

function applyTheme(theme: ThemePreference) {
	const resolved =
		theme === "system"
			? window.matchMedia("(prefers-color-scheme: light)").matches
				? "light"
				: "dark"
			: theme;
	document.documentElement.dataset.theme = resolved;
	window.localStorage.setItem("zion:theme", theme);
}

export function App() {
	const [theme, setTheme] = useState<ThemePreference>(() => {
		const stored = window.localStorage.getItem("zion:theme");
		return stored === "dark" || stored === "light" ? stored : "system";
	});
	const [checked, setChecked] = useState<string[]>(["Jeremias 6"]);

	function changeTheme(value: ThemePreference) {
		setTheme(value);
		applyTheme(value);
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
						value={theme}
						onChange={(event) => changeTheme(event.target.value as ThemePreference)}
						aria-label="Tema"
					>
						<option value="system">Sistema</option>
						<option value="dark">Escuro</option>
						<option value="light">Claro</option>
					</select>
					<button className="icon-button" type="button" aria-label="Configurações">
						⚙
					</button>
				</div>
			</header>

			<main className="dashboard">
				<section className="card summary-card" aria-labelledby="plan-heading">
					<p className="eyebrow">Seu plano de leitura</p>
					<h1 className="plan-title" id="plan-heading">
						Uma jornada pela Palavra
					</h1>
					<div className="plan-range">
						<strong>Jeremias 6</strong>
						<span aria-hidden="true">→</span>
						<strong>Apocalipse 22</strong>
					</div>
					<div className="progress-label">
						<strong>31% concluído</strong>
						<span className="muted">128 de 404 capítulos</span>
					</div>
					<div
						className="progress-track"
						role="progressbar"
						aria-label="Progresso do plano"
						aria-valuenow={31}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<div className="progress-fill" />
					</div>
				</section>

				<section className="card today-card" aria-labelledby="today-heading">
					<div className="section-heading">
						<div>
							<p className="eyebrow">Leitura de hoje</p>
							<h2 id="today-heading">05 de outubro</h2>
						</div>
						<span className="today-date">DIA 01</span>
					</div>
					<div className="reading-list">
						{sampleReadings.map((reading) => (
							<label className="reading-row" key={reading}>
								<input
									type="checkbox"
									checked={checked.includes(reading)}
									onChange={() =>
										setChecked((current) =>
											current.includes(reading)
												? current.filter((item) => item !== reading)
												: [...current, reading],
										)
									}
								/>
								<span>{reading}</span>
							</label>
						))}
					</div>
				</section>

				<section className="card upcoming-card" aria-labelledby="upcoming-heading">
					<div className="section-heading">
						<h2 id="upcoming-heading">Próximas leituras</h2>
						<button className="button" type="button">
							Ver plano
						</button>
					</div>
					<div className="upcoming-list">
						{upcomingReadings.map((item) => (
							<div className="upcoming-item" key={item.date}>
								<time>{item.date}</time>
								<strong>{item.reading}</strong>
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}
