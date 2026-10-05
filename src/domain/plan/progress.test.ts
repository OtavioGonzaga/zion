import { describe, expect, it } from "vitest";
import type { ChapterRef } from "../bible/types";
import { getContiguousCompletedThrough, mergeCompletedRange } from "./progress";

describe("plan progress ranges", () => {
	it("finds the continuous completed prefix within a plan", () => {
		const progress = ["GEN.1", "GEN.2", "GEN.4"].map((chapter) => ({
			chapter: chapter as ChapterRef,
			completedAt: "2026-01-01T12:00:00.000Z",
		}));
		expect(getContiguousCompletedThrough("GEN.1", "GEN.5", progress)).toBe("GEN.2");
		expect(getContiguousCompletedThrough("GEN.3", "GEN.5", progress)).toBeUndefined();
	});

	it("merges ranges without duplicating or replacing existing progress", () => {
		const existing = [{ chapter: "GEN.2" as const, completedAt: "2026-01-02T12:00:00.000Z" }];
		expect(mergeCompletedRange(existing, "GEN.1", "GEN.3", "2026-02-01T00:00:00.000Z")).toEqual([
			{ chapter: "GEN.2", completedAt: "2026-01-02T12:00:00.000Z" },
			{ chapter: "GEN.1", completedAt: "2026-02-01T00:00:00.000Z" },
			{ chapter: "GEN.3", completedAt: "2026-02-01T00:00:00.000Z" },
		]);
	});

	it("ignores reversed ranges", () => {
		expect(mergeCompletedRange([], "GEN.3", "GEN.1", "2026-01-01")).toEqual([]);
	});
});
