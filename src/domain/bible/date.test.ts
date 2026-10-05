import { describe, expect, it } from "vitest";
import { addDays, formatLocalDate, getCurrentLocalDate, listDates, parseLocalDate } from "./date";

describe("local calendar dates", () => {
	it("rejects invalid dates and accepts leap days", () => {
		expect(parseLocalDate("2024-02-29")).toBe("2024-02-29");
		expect(parseLocalDate("2025-02-29")).toBeNull();
		expect(parseLocalDate("2026-2-05")).toBeNull();
	});

	it("adds and lists calendar days without UTC string conversion", () => {
		expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
		expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
		expect(listDates("2026-10-05", "2026-10-07")).toEqual([
			"2026-10-05",
			"2026-10-06",
			"2026-10-07",
		]);
	});

	it("formats dates as readable local calendar dates", () => {
		expect(formatLocalDate("2026-10-05", { month: "short" })).toContain("05");
	});

	it("reads the local calendar day from the current date", () => {
		expect(getCurrentLocalDate(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
	});
});
