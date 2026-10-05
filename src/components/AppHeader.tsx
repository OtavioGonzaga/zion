import { useState } from "react";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { appConfig } from "../config/app";
import SettingsIcon from "@mui/icons-material/Settings";
import type { ThemePreference } from "../storage/state";

export function AppHeader({
	theme,
	onThemeChange,
	onSettings,
	onHome,
}: {
	theme: ThemePreference;
	onThemeChange: (theme: ThemePreference) => void;
	onSettings?: () => void;
	onHome?: () => void;
}) {
	const [themeMenuAnchor, setThemeMenuAnchor] = useState<HTMLElement | null>(null);
	const themeOptions = [
		{ value: "system", label: "Sistema", icon: <BrightnessAutoIcon fontSize="small" /> },
		{ value: "dark", label: "Escuro", icon: <DarkModeIcon fontSize="small" /> },
		{ value: "light", label: "Claro", icon: <LightModeIcon fontSize="small" /> },
	] as const;
	const selectedTheme = themeOptions.find((option) => option.value === theme)!;

	return (
		<header className="app-header">
			<a
				className="brand"
				href={onHome ? "#today" : import.meta.env.BASE_URL}
				aria-label={`${appConfig.name} — início`}
				onClick={(event) => {
					if (!onHome) return;
					event.preventDefault();
					onHome();
				}}
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
				<button
					className="icon-button"
					type="button"
					aria-label={`Tema: ${selectedTheme.label}`}
					aria-haspopup="menu"
					aria-expanded={Boolean(themeMenuAnchor)}
					title={`Tema: ${selectedTheme.label}`}
					onClick={(event) => setThemeMenuAnchor(event.currentTarget)}
				>
					{selectedTheme.icon}
				</button>
				<Menu
					anchorEl={themeMenuAnchor}
					open={Boolean(themeMenuAnchor)}
					onClose={() => setThemeMenuAnchor(null)}
					slotProps={{ list: { "aria-label": "Selecionar tema" } }}
				>
					{themeOptions.map((option) => (
						<MenuItem
							key={option.value}
							selected={theme === option.value}
							onClick={() => {
								onThemeChange(option.value as ThemePreference);
								setThemeMenuAnchor(null);
							}}
						>
							<ListItemIcon>{option.icon}</ListItemIcon>
							<ListItemText>{option.label}</ListItemText>
						</MenuItem>
					))}
				</Menu>
				{onSettings && (
					<button
						className="icon-button"
						type="button"
						onClick={onSettings}
						aria-label="Configurações"
					>
						<SettingsIcon aria-hidden="true" fontSize="small" />
					</button>
				)}
			</div>
		</header>
	);
}
