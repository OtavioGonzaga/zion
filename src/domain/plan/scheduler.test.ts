import { describe, expect, it } from "vitest";
import type { CompletedChapter, ReadingBlock, ReadingPlan } from "./types";
import {
	findAssignment,
	generateAdaptiveSchedule,
	generateSchedule,
	getPlanProgress,
} from "./scheduler";

const plan: ReadingPlan = {
	startReference: "JER.6",
	endReference: "JER.15",
	startDate: "2026-10-05",
	targetDate: "2026-10-09",
};

const blocks: ReadingBlock[] = [
	{ id: "a", order: 1, chapters: ["JER.4", "JER.5", "JER.6"], weight: 1 },
	{ id: "b", order: 2, chapters: ["JER.7", "JER.8", "JER.9"], weight: 1 },
	{ id: "c", order: 3, chapters: ["JER.10", "JER.11", "JER.12", "JER.13"], weight: 1 },
	{ id: "d", order: 4, chapters: ["JER.14", "JER.15", "JER.16"], weight: 1 },
];

function schedule(overrides: Partial<Parameters<typeof generateSchedule>[0]> = {}) {
	return generateSchedule({
		template: blocks,
		plan,
		progress: [],
		today: "2026-10-05",
		...overrides,
	});
}

describe("generateSchedule", () => {
	it("clips the range at block boundaries without losing or duplicating chapters", () => {
		const result = schedule();
		expect(result.remainingChapters).toEqual([
			"JER.6",
			"JER.7",
			"JER.8",
			"JER.9",
			"JER.10",
			"JER.11",
			"JER.12",
			"JER.13",
			"JER.14",
			"JER.15",
		]);
		const projected = result.assignments.flatMap((day) => day.chapters);
		expect(new Set(projected).size).toBe(projected.length);
		expect(projected).toEqual(result.remainingChapters);
	});

	it("never splits an effective template block across days", () => {
		const result = schedule();
		const assignmentsByBlock = result.assignments.flatMap((day) =>
			day.blocks.map((block) => [block.blockId, day.date] as const),
		);
		expect(new Set(assignmentsByBlock.map(([id]) => id)).size).toBe(assignmentsByBlock.length);
		expect(assignmentsByBlock.map(([id]) => id)).toEqual(["a", "b", "c", "d"]);
	});

	it("removes completed chapters but keeps remaining pieces of a block together", () => {
		const progress: CompletedChapter[] = [
			{ chapter: "JER.10", completedAt: "2026-10-05T12:00:00.000Z" },
			{ chapter: "JER.12", completedAt: "2026-10-05T12:00:00.000Z" },
		];
		const result = schedule({ progress });
		const block = result.assignments
			.flatMap((day) => day.blocks)
			.find((item) => item.blockId === "c");
		expect(block?.chapters).toEqual(["JER.11", "JER.13"]);
		expect(result.assignments.flatMap((day) => day.chapters)).not.toContain("JER.10");
	});

	it("reweights partially completed blocks by their remaining chapter fraction", () => {
		const result = schedule({ progress: [{ chapter: "JER.10", completedAt: "2026-10-05" }] });
		const block = result.assignments
			.flatMap((day) => day.blocks)
			.find((item) => item.blockId === "c");
		expect(block?.weight).toBe(0.75);
	});

	it("spreads a small number of blocks across the full date range", () => {
		const shortTemplate = blocks.slice(0, 2);
		const result = schedule({
			template: shortTemplate,
			plan: { ...plan, startReference: "JER.6", endReference: "JER.9", targetDate: "2026-10-14" },
		});
		expect(result.assignments).toHaveLength(10);
		expect(result.assignments.at(-1)?.chapters).toEqual(
			expect.arrayContaining(["JER.7", "JER.8", "JER.9"]),
		);
		expect(result.assignments.filter((day) => day.chapters.length === 0).length).toBeGreaterThan(0);
	});

	it("groups multiple template blocks when there are fewer days", () => {
		const result = schedule({ plan: { ...plan, targetDate: "2026-10-06" } });
		expect(result.assignments).toHaveLength(2);
		expect(result.assignments.some((day) => day.blocks.length > 1)).toBe(true);
	});

	it("assigns at least one unit to every eligible day with extreme weights", () => {
		const extremeBlocks: ReadingBlock[] = [
			{ id: "heavy", order: 1, chapters: ["GEN.1"], weight: 1 },
			{ id: "light-a", order: 2, chapters: ["GEN.2"], weight: 0.09 },
			{ id: "light-b", order: 3, chapters: ["GEN.3"], weight: 0.16 },
			{ id: "light-c", order: 4, chapters: ["GEN.4"], weight: 0.14 },
		];
		const result = schedule({
			template: extremeBlocks,
			plan: {
				...plan,
				startReference: "GEN.1",
				endReference: "GEN.4",
				targetDate: "2026-10-07",
			},
		});
		expect(result.assignments).toHaveLength(3);
		expect(result.assignments.every(({ chapters }) => chapters.length > 0)).toBe(true);
		expect(result.assignments.flatMap(({ chapters }) => chapters)).toEqual([
			"GEN.1",
			"GEN.2",
			"GEN.3",
			"GEN.4",
		]);
	});

	it("returns explicit future, completed, and expired states", () => {
		const future = schedule({ today: "2026-10-01" });
		expect(future.status).toBe("not-started");
		expect(future.assignments[0]?.date).toBe(plan.startDate);
		const completed = schedule({ progress: planRangeProgress() });
		expect(completed.status).toBe("completed");
		expect(completed.assignments).toEqual([]);
		const expired = schedule({ today: "2026-10-10" });
		expect(expired.status).toBe("expired");
		expect(expired.assignments).toEqual([]);
	});

	it("reschedules pending chapters from today and accepts eligible dates", () => {
		const result = schedule({
			today: "2026-10-07",
			eligibleDates: ["2026-10-09", "2026-10-07", "2026-10-08"],
		});
		expect(result.assignments.map((day) => day.date)).toEqual([
			"2026-10-07",
			"2026-10-08",
			"2026-10-09",
		]);
		expect(result.assignments.flatMap((day) => day.chapters)).toEqual(result.remainingChapters);
	});

	it("can mark a future chapter complete and undo it by removing its progress fact", () => {
		const advanced = schedule({ progress: [{ chapter: "JER.15", completedAt: "2026-10-05" }] });
		expect(advanced.assignments.flatMap((day) => day.chapters)).not.toContain("JER.15");
		const undone = schedule();
		expect(undone.assignments.flatMap((day) => day.chapters)).toContain("JER.15");
	});

	it("reserves a frozen daily target before redistributing the future", () => {
		const initial = schedule();
		const frozenToday = findAssignment(initial, "2026-10-05");
		if (!frozenToday) throw new Error("Expected an assignment for today");
		const progress: CompletedChapter[] = [{ chapter: "JER.6", completedAt: "2026-10-05" }];
		const result = generateAdaptiveSchedule({
			template: blocks,
			plan,
			progress,
			today: "2026-10-05",
			todayAssignment: frozenToday,
		});
		expect(result.assignments[0]?.chapters).toEqual(["JER.6"]);
		expect(result.assignments.slice(1).flatMap(({ chapters }) => chapters)).toContain("JER.7");
		const displayedPending = result.assignments
			.flatMap(({ chapters }) => chapters)
			.filter((chapter) => !new Set(progress.map(({ chapter: item }) => item)).has(chapter));
		expect(displayedPending).toEqual(result.remainingChapters);
	});

	it("computes a consistent progress summary", () => {
		expect(getPlanProgress(plan, [{ chapter: "JER.6", completedAt: "2026-10-05" }])).toEqual({
			completed: 1,
			total: 10,
			percentage: 10,
		});
		expect(findAssignment(schedule(), "2026-10-05")?.date).toBe("2026-10-05");
	});

	it("satisfies generated range/progress invariants", () => {
		for (let start = 6; start <= 12; start += 1) {
			const generatedPlan = {
				...plan,
				startReference: `JER.${start}` as ReadingPlan["startReference"],
				endReference: "JER.15" as const,
			};
			for (let completedTo = start - 1; completedTo <= 15; completedTo += 1) {
				const progress = Array.from(
					{ length: Math.max(0, completedTo - start + 1) },
					(_, index) => ({
						chapter: `JER.${start + index}` as ReadingPlan["startReference"],
						completedAt: "2026-10-05",
					}),
				);
				const result = schedule({ plan: generatedPlan, progress });
				const flattened = result.assignments.flatMap((day) => day.chapters);
				expect(new Set(flattened).size).toBe(flattened.length);
				expect(flattened).toEqual(result.remainingChapters);
			}
		}
	});
});

function planRangeProgress(): CompletedChapter[] {
	return Array.from({ length: 10 }, (_, index) => ({
		chapter: `JER.${index + 6}` as ReadingPlan["startReference"],
		completedAt: "2026-10-05",
	}));
}
