import { appConfig } from "../config/app";
import type { ThemePreference } from "../storage/state";

export function AppHeader({
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
			<a
				className="brand"
				href={import.meta.env.BASE_URL}
				aria-label={`${appConfig.name} — início`}
			>
				<img
					className="brand-logo-light"
					src={`${import.meta.env.BASE_URL}assets/zion-logo-horizontal.png`}
					alt=""
				/>
				<img
					className="brand-logo-dark"
					src={`${import.meta.env.BASE_URL}assets/zion-logo-horizontal-dark.png`}
					alt=""
				/>
			</a>
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
