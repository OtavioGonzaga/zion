import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage/state";
import { parseBackup, serializeBackup } from "./backup";

describe("JSON backups", () => {
	it("round-trips the complete versioned application state", () => {
		const state = {
			...createInitialState(),
			plan: {
				startReference: "JER.6" as const,
				endReference: "REV.22" as const,
				startDate: "2026-10-05" as const,
				targetDate: "2026-12-31" as const,
			},
			progress: [{ chapter: "JER.6" as const, completedAt: "2026-10-05T12:00:00.000Z" }],
			preferences: { theme: "light" as const },
		};
		const backup = serializeBackup(state, "2026-10-05T12:00:00.000Z");
		const result = parseBackup(backup);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.state).toEqual(state);
	});

	it("rejects malformed, missing, and invalid state without touching storage", () => {
		expect(parseBackup("{").ok).toBe(false);
		expect(parseBackup(JSON.stringify({ exportedAt: "bad", appVersion: "1", state: {} })).ok).toBe(
			false,
		);
		expect(
			parseBackup(
				JSON.stringify({
					exportedAt: "2026-10-05",
					appVersion: "1",
					state: { schemaVersion: 1, plan: {}, progress: [] },
				}),
			).ok,
		).toBe(false);
	});
});
