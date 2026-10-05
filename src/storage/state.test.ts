import { describe, expect, it } from "vitest";
import { loadAppState, parseAppState, saveAppState, STORAGE_KEY } from "./state";
import type { StorageLike } from "./state";

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
	const values = new Map(Object.entries(initial));
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
	};
}

const savedState = {
	schemaVersion: 1,
	plan: {
		startReference: "JER.6",
		endReference: "REV.22",
		startDate: "2026-10-05",
		targetDate: "2026-12-31",
	},
	progress: [{ chapter: "JER.6", completedAt: "2026-10-05T12:00:00.000Z" }],
	dailyAssignment: { date: "2026-10-05", chapters: ["JER.6", "JER.7"] },
	preferences: { theme: "dark" },
};

describe("versioned local storage", () => {
	it("loads initial state when no data exists", () => {
		expect(loadAppState(memoryStorage()).state).toMatchObject({
			schemaVersion: 1,
			plan: null,
			progress: [],
		});
	});

	it("saves and reloads the complete state", () => {
		const storage = memoryStorage();
		const parsed = parseAppState(JSON.stringify(savedState));
		if (!parsed.ok) throw new Error("Test state was rejected");
		expect(saveAppState(parsed.state, storage)).toBe(true);
		expect(loadAppState(storage).state).toEqual(parsed.state);
		expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
	});

	it("rejects invalid JSON, invalid fields, and unsupported schemas", () => {
		expect(parseAppState("{").ok).toBe(false);
		expect(
			parseAppState(
				JSON.stringify({ ...savedState, plan: { ...savedState.plan, startDate: "2026-02-30" } }),
			),
		).toEqual({ ok: false, reason: "invalid-schema" });
		expect(parseAppState(JSON.stringify({ ...savedState, schemaVersion: 2 }))).toEqual({
			ok: false,
			reason: "unsupported-version",
		});
	});

	it("does not throw when storage is unavailable or operations fail", () => {
		const brokenStorage: StorageLike = {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("quota");
			},
		};
		expect(loadAppState(brokenStorage).issue).toBe("unavailable");
		expect(saveAppState(loadAppState(memoryStorage()).state, brokenStorage)).toBe(false);
	});

	it("keeps a readable fallback when persisted JSON is corrupt", () => {
		const result = loadAppState(memoryStorage({ [STORAGE_KEY]: "not-json" }));
		expect(result.issue).toBe("invalid-json");
		expect(result.canPersist).toBe(false);
		expect(result.state.plan).toBeNull();
	});

	it("does not overwrite corrupt or unsupported persisted state during load", () => {
		for (const raw of ["not-json", JSON.stringify({ schemaVersion: 999 })]) {
			const storage = memoryStorage({ [STORAGE_KEY]: raw });
			const loaded = loadAppState(storage);
			expect(loaded.canPersist).toBe(false);
			expect(storage.getItem(STORAGE_KEY)).toBe(raw);
		}
	});
});
