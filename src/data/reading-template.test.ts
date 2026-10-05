import { describe, expect, it } from "vitest";
import { bibleBooks, bibleChapters } from "./bible-books";
import { readingTemplate } from "./reading-template";
import { validateReadingTemplate } from "./validate-reading-template";

describe("canonical reading template", () => {
	it("covers the canonical Bible exactly once and in order", () => {
		expect(bibleBooks).toHaveLength(66);
		expect(bibleChapters).toHaveLength(1189);
		expect(readingTemplate).toHaveLength(365);
		expect(validateReadingTemplate(bibleBooks, readingTemplate)).toEqual([]);
		expect(readingTemplate.flatMap((block) => block.chapters)).toEqual(bibleChapters);
	});

	it("preserves representative template groups", () => {
		expect(readingTemplate[0]?.chapters).toEqual(["GEN.1", "GEN.2", "GEN.3"]);
		expect(readingTemplate[3]?.chapters).toEqual(["GEN.10", "GEN.11", "GEN.12"]);
		expect(readingTemplate[219]?.chapters).toEqual(["JER.4", "JER.5", "JER.6"]);
		expect(readingTemplate[364]?.chapters).toEqual(["REV.20", "REV.21", "REV.22"]);
	});

	it("reports malformed block IDs, ordering, empty groups, and weights", () => {
		const invalid = [
			{ id: "duplicate", order: 2, chapters: [], weight: 0 },
			{ id: "duplicate", order: 3, chapters: ["GEN.1", "GEN.1", "UNKNOWN.1"], weight: Number.NaN },
		];
		const errors = validateReadingTemplate(bibleBooks, invalid);
		expect(errors).toContain("Duplicate block id: duplicate");
		expect(errors).toContain("Invalid order at block duplicate");
		expect(errors).toContain("Empty block: duplicate");
		expect(errors).toContain("Invalid weight at block duplicate");
		expect(errors).toContain("Unknown chapter: UNKNOWN.1");
		expect(errors).toContain("Duplicate chapter: GEN.1");
	});
});
