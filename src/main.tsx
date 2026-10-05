import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { appConfig } from "./config/app";
import { loadAppState } from "./storage/state";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Application root was not found.");
}

document.title = appConfig.name;
const boot = loadAppState();
const theme = boot.state.preferences.theme;
document.documentElement.dataset.theme =
	theme === "system"
		? window.matchMedia("(prefers-color-scheme: light)").matches
			? "light"
			: "dark"
		: theme;

createRoot(rootElement).render(
	<StrictMode>
		<App
			initialState={boot.state}
			initialStorageIssue={boot.issue}
			canPersistInitially={boot.canPersist}
		/>
	</StrictMode>,
);
