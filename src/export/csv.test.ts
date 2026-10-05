import { describe, expect, it } from "vitest";
import { exportScheduleCsv } from "./csv";

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
});
