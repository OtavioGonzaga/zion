import { describe, expect, it } from "vitest";
import { appConfig } from "./app";

describe("appConfig", () => {
	it("centralizes the application name", () => {
		expect(appConfig.name).toBe("Zion");
	});
});
