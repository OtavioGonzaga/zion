import { describe, expect, it } from "vitest";
import { hashForView, parseViewFromHash } from "./navigation";

describe("application navigation hash mapping", () => {
	it("maps primary and secondary views to stable hashes", () => {
		expect(hashForView("schedule")).toBe("#plan");
		expect(parseViewFromHash("#plan", true)).toBe("schedule");
		expect(parseViewFromHash("#completed", true)).toBe("completed");
		expect(parseViewFromHash("#edit-plan", true)).toBe("edit-plan");
	});

	it("uses Today for invalid hashes and setup when no plan exists", () => {
		expect(parseViewFromHash("#invalid", true)).toBe("today");
		expect(parseViewFromHash("#completed", false)).toBe("setup");
	});
});
