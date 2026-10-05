import { describe, expect, it } from "vitest";
import { exportCurrentScheduleCsv, exportScheduleCsv } from "./csv";
import { readingTemplate } from "../data/reading-template";
import { generateSchedule } from "../domain/plan/scheduler";

describe("CSV schedule export", () => {
	it("escapes references and derives per-day status", () => {
		const result = exportScheduleCsv(
			[
				{ date: "2026-10-05", chapters: ["JER.6", "JER.7"], blocks: [], weight: 1 },
				{ date: "2026-10-06", chapters: [], blocks: [], weight: 0 },
			],
			["JER.6"],
		);
		expect(result).toBe(
			'date,reading,status\r\n"2026-10-05","Jeremias 6–7","partial"\r\n"2026-10-06","","free"',
		);
	});

	it("exports the frozen current-day target with the recalculated future schedule", () => {
		const plan = {
			startReference: "JER.6" as const,
			endReference: "JER.15" as const,
			startDate: "2026-10-05" as const,
			targetDate: "2026-10-09" as const,
		};
		const futureSchedule = generateSchedule({
			template: readingTemplate,
			plan,
			progress: [{ chapter: "JER.7", completedAt: "2026-10-05T09:00:00.000Z" }],
			today: "2026-10-05",
		});
		const csv = exportCurrentScheduleCsv(
			"2026-10-05",
			{ date: "2026-10-05", chapters: ["JER.6", "JER.7"], blocks: [], weight: 0 },
			futureSchedule,
			["JER.7"],
		);
		expect(csv).toContain('"2026-10-05","Jeremias 6–7","partial"');
		expect(csv).toContain('"2026-10-06"');
		expect(csv).not.toContain('"2026-10-05","Jeremias 6","pending"');
	});
});
