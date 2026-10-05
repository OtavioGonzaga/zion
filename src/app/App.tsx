import { appConfig } from "../config/app";

export function App() {
	return (
		<main>
			<h1>{appConfig.name}</h1>
			<p>Seu plano de leitura bíblica será configurado aqui.</p>
		</main>
	);
}
