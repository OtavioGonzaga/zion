import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
	base,
	plugins: [
		react(),
		VitePWA({
			strategies: "generateSW",
			registerType: "prompt",
			injectRegister: null,
			includeAssets: ["assets/*.png"],
			manifest: {
				name: "Zion",
				short_name: "Zion",
				description: "Crie e acompanhe seu plano pessoal de leitura bíblica.",
				lang: "pt-BR",
				id: "./",
				start_url: "./#today",
				scope: "./",
				display: "standalone",
				background_color: "#1d2021",
				theme_color: "#282828",
				icons: [
					{
						src: "assets/zion-pwa-192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "assets/zion-pwa-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "assets/zion-pwa-maskable-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
				shortcuts: [
					{
						name: "Hoje",
						short_name: "Hoje",
						description: "Abrir a leitura de hoje",
						url: "./#today",
					},
					{
						name: "Plano",
						short_name: "Plano",
						description: "Abrir o plano completo",
						url: "./#plan",
					},
					{
						name: "Concluídos",
						short_name: "Concluídos",
						description: "Ver leituras concluídas",
						url: "./#completed",
					},
				],
			},
			workbox: {
				cleanupOutdatedCaches: true,
			},
		}),
	],
});
