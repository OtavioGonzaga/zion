import { describe, expect, it } from "vitest";
import type { CompletedChapter, ReadingPlan } from "../../domain/plan/types";
import { groupCompletedByLocalDate, selectCompleted } from "./completed";

const plan: ReadingPlan = {
	startReference: "JER.1",
	endReference: "MAT.2",
	startDate: "2026-10-01",
	targetDate: "2026-12-31",
};

describe("completed reading projections", () => {
	it("filters to the current plan, applies book filters, and sorts newest first", () => {
		const progress: CompletedChapter[] = [
			{ chapter: "JER.1", completedAt: "2026-10-01T08:00:00.000Z" },
			{ chapter: "MAT.1", completedAt: "2026-10-02T08:00:00.000Z" },
			{ chapter: "GEN.1", completedAt: "2026-10-03T08:00:00.000Z" },
		];
		expect(selectCompleted(progress, plan).map(({ chapter }) => chapter)).toEqual([
			"MAT.1",
			"JER.1",
		]);
		expect(selectCompleted(progress, plan, "JER").map(({ chapter }) => chapter)).toEqual(["JER.1"]);
	});

	it("groups completions by the runtime's local calendar date", () => {
		const groups = groupCompletedByLocalDate([
			{ chapter: "JER.1", completedAt: "2026-10-01T23:30:00-04:00" },
			{ chapter: "JER.2", completedAt: "2026-10-02T01:00:00-04:00" },
		]);
		expect(groups).toHaveLength(1);
		expect(groups[0]?.date).toBe("2026-10-02");
		expect(groups[0]?.items.map(({ chapter }) => chapter)).toEqual(["JER.1", "JER.2"]);
	});
});
