import { describe, expect, it } from "vitest";
import { compareChapterRefs, getChapterRange, isValidChapterRef, parseChapterRef } from "./bible";

describe("Bible chapter references", () => {
	it("validates and parses stable chapter IDs", () => {
		expect(parseChapterRef("JER.6")).toBe("JER.6");
		expect(parseChapterRef("JER.53")).toBeNull();
		expect(isValidChapterRef("REV.22")).toBe(true);
		expect(isValidChapterRef("GEN.0")).toBe(false);
		expect(isValidChapterRef("NOPE.1")).toBe(false);
	});

	it("compares and ranges chapters in canonical order", () => {
		expect(compareChapterRefs("GEN.50", "EXO.1")).toBeLessThan(0);
		expect(getChapterRange("JER.51", "LAM.2")).toEqual(["JER.51", "JER.52", "LAM.1", "LAM.2"]);
		expect(getChapterRange("REV.2", "GEN.1")).toEqual([]);
	});
});
