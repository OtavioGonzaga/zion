import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		coverage: {
			provider: "v8",
			include: [
				"src/domain/**/*.{ts,tsx}",
				"src/storage/**/*.{ts,tsx}",
				"src/export/**/*.{ts,tsx}",
			],
		},
	},
});
