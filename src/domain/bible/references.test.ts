import { describe, expect, it } from "vitest";
import { formatReferences } from "./references";

describe("reference formatting", () => {
	it("collapses consecutive chapters and preserves gaps", () => {
		expect(formatReferences(["JER.6", "JER.7", "JER.8", "JER.10"])).toBe(
			"Jeremias 6–8, Jeremias 10",
		);
	});

	it("formats cross-book selections as separate references", () => {
		expect(formatReferences(["MAL.4", "MAT.1", "MAT.2"])).toBe("Malaquias 4, Mateus 1–2");
	});
});
