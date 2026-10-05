import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { appConfig } from "./config/app";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Application root was not found.");
}

document.title = appConfig.name;
const savedTheme = window.localStorage.getItem("zion:theme");
if (savedTheme === "dark" || savedTheme === "light") {
	document.documentElement.dataset.theme = savedTheme;
} else {
	document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme: light)")
		.matches
		? "light"
		: "dark";
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
