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

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
