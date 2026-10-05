import { describe, expect, it } from "vitest";
import { prepareReleaseFiles } from "./prepare";

const packageJson = JSON.stringify({ name: "zion", version: "0.1.1", private: true }, null, "\t");
const history = "## [0.1.1] - 2026-10-05\n\n### Fixed\n\n- Historical fix.\n";

describe("release preparation", () => {
	it("promotes actual unreleased entries and preserves historical sections", () => {
		const changelog = `# Changelog\n\n## [Unreleased]\n\n### Added\n\n- New feature.\n${history}`;
		const prepared = prepareReleaseFiles({
			version: "0.2.0",
			packageJson,
			changelog,
			date: "2026-10-06",
		});
		expect(JSON.parse(prepared.packageJson).version).toBe("0.2.0");
		expect(prepared.changelog).toContain("## [Unreleased]\n\n## [0.2.0] - 2026-10-06");
		expect(prepared.changelog).toContain("### Added\n\n- New feature.");
		expect(prepared.changelog.endsWith(history)).toBe(true);
		expect(prepared.releaseNotes).toBe("### Added\n\n- New feature.");
	});

	it("rejects an empty Unreleased section without changing its inputs", () => {
		const original = `## [Unreleased]\n\n### Added\n\n${history}`;
		expect(() =>
			prepareReleaseFiles({
				version: "0.2.0",
				packageJson,
				changelog: original,
				date: "2026-10-06",
			}),
		).toThrow("no changes to release");
		expect(original).toContain("## [Unreleased]");
		expect(JSON.parse(packageJson).version).toBe("0.1.1");
	});

	it("rejects invalid, duplicate, and non-increasing versions", () => {
		const changelog = `## [Unreleased]\n\n- Feature.\n${history}`;
		for (const version of ["v0.2.0", "0.1.1", "0.1.0", "0.2"]) {
			expect(() =>
				prepareReleaseFiles({ version, packageJson, changelog, date: "2026-10-06" }),
			).toThrow();
		}
		const duplicate = `## [Unreleased]\n\n- Feature.\n\n## [0.2.0] - 2026-01-01\n\n- Old release.\n`;
		expect(() =>
			prepareReleaseFiles({
				version: "0.2.0",
				packageJson,
				changelog: duplicate,
				date: "2026-10-06",
			}),
		).toThrow();
	});
});
