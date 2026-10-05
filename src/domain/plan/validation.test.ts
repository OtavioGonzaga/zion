import { describe, expect, it } from "vitest";
import { validatePlan } from "./validation";

const validPlan = {
	startReference: "JER.6" as const,
	endReference: "REV.22" as const,
	startDate: "2026-10-05" as const,
	targetDate: "2026-12-31" as const,
};

describe("reading plan validation", () => {
	it("accepts valid chapter and date ranges", () => {
		expect(validatePlan(validPlan)).toEqual({});
	});

	it("rejects reversed chapter and date ranges", () => {
		expect(validatePlan({ ...validPlan, endReference: "GEN.1" as const })).toHaveProperty(
			"endReference",
		);
		expect(validatePlan({ ...validPlan, targetDate: "2026-10-04" })).toHaveProperty("targetDate");
	});

	it("rejects invalid references and calendar dates", () => {
		expect(validatePlan({ ...validPlan, startReference: "JER.99" as const })).toHaveProperty(
			"startReference",
		);
		expect(validatePlan({ ...validPlan, startDate: "2026-02-30" as const })).toHaveProperty(
			"startDate",
		);
	});
});
