import { Monitor, Moon, Settings, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { appConfig } from "../config/app";
import type { ThemePreference } from "../storage/state";

const themeOptions = [
	{ value: "system", label: "Sistema", Icon: Monitor },
	{ value: "dark", label: "Escuro", Icon: Moon },
	{ value: "light", label: "Claro", Icon: Sun },
] as const;

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
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const selectedTheme = themeOptions.find((option) => option.value === theme)!;
	const SelectedIcon = selectedTheme.Icon;

	useEffect(() => {
		if (!menuOpen) return;
		const closeOnOutsideClick = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setMenuOpen(false);
		};
		window.addEventListener("mousedown", closeOnOutsideClick);
		window.addEventListener("keydown", closeOnEscape);
		return () => {
			window.removeEventListener("mousedown", closeOnOutsideClick);
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [menuOpen]);

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
				<div className="theme-menu" ref={menuRef}>
					<button
						className="icon-button"
						type="button"
						aria-label={`Tema: ${selectedTheme.label}`}
						aria-haspopup="true"
						aria-expanded={menuOpen}
						title={`Tema: ${selectedTheme.label}`}
						onClick={() => setMenuOpen((open) => !open)}
					>
						<SelectedIcon size={18} strokeWidth={1.8} aria-hidden="true" />
					</button>
					{menuOpen && (
						<div className="theme-menu-popup" aria-label="Selecionar tema">
							{themeOptions.map(({ value, label, Icon }) => (
								<button
									key={value}
									type="button"
									className={
										theme === value ? "theme-menu-option is-selected" : "theme-menu-option"
									}
									onClick={() => {
										onThemeChange(value);
										setMenuOpen(false);
									}}
								>
									<Icon size={18} strokeWidth={1.8} aria-hidden="true" />
									{label}
								</button>
							))}
						</div>
					)}
				</div>
				{onSettings && (
					<button
						className="icon-button"
						type="button"
						onClick={onSettings}
						aria-label="Configurações"
					>
						<Settings size={18} strokeWidth={1.8} aria-hidden="true" />
					</button>
				)}
			</div>
		</header>
	);
}
