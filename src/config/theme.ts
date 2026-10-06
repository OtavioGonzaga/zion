import type { ThemePreference } from "../storage/state";

export function applyTheme(theme: ThemePreference) {
	const resolvedTheme =
		theme === "system"
			? window.matchMedia("(prefers-color-scheme: light)").matches
				? "light"
				: "dark"
			: theme;
	document.documentElement.dataset.theme = resolvedTheme;
	document
		.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
		?.setAttribute("content", resolvedTheme === "dark" ? "#282828" : "#f9f5d7");
}
