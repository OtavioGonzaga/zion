import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const semverPattern =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

interface SemverParts {
	major: number;
	minor: number;
	patch: number;
	prerelease: string[];
}

function parseSemver(version: string): SemverParts | null {
	const match = semverPattern.exec(version);
	if (!match) return null;
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
		prerelease: match[4]?.split(".") ?? [],
	};
}

function compareSemver(left: SemverParts, right: SemverParts): number {
	for (const key of ["major", "minor", "patch"] as const) {
		if (left[key] !== right[key]) return left[key]! < right[key]! ? -1 : 1;
	}
	if (left.prerelease.length === 0 || right.prerelease.length === 0) {
		return left.prerelease.length === right.prerelease.length
			? 0
			: left.prerelease.length === 0
				? 1
				: -1;
	}
	for (
		let index = 0;
		index < Math.max(left.prerelease.length, right.prerelease.length);
		index += 1
	) {
		const a = left.prerelease[index];
		const b = right.prerelease[index];
		if (a === undefined || b === undefined) return a === undefined ? -1 : 1;
		if (a === b) continue;
		const aNumeric = /^\d+$/.test(a);
		const bNumeric = /^\d+$/.test(b);
		if (aNumeric && bNumeric) return Number(a) < Number(b) ? -1 : 1;
		if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
		return a < b ? -1 : 1;
	}
	return 0;
}

export function prepareReleaseFiles(input: {
	version: string;
	packageJson: string;
	changelog: string;
	date: string;
}): { packageJson: string; changelog: string; releaseNotes: string } {
	const requested = parseSemver(input.version);
	if (!requested) throw new Error(`Invalid SemVer version: ${input.version}`);
	const packageData: unknown = JSON.parse(input.packageJson);
	if (typeof packageData !== "object" || packageData === null || !("version" in packageData)) {
		throw new Error("package.json has no version field");
	}
	const currentVersion = (packageData as { version: unknown }).version;
	if (typeof currentVersion !== "string" || !parseSemver(currentVersion)) {
		throw new Error("package.json contains an invalid SemVer version");
	}
	if (compareSemver(requested, parseSemver(currentVersion)!) <= 0) {
		throw new Error(`Release version ${input.version} must be greater than ${currentVersion}`);
	}

	const unreleasedHeading = /^## \[Unreleased\][^\S\r\n]*$/m;
	const match = unreleasedHeading.exec(input.changelog);
	if (!match) throw new Error("Missing ## [Unreleased] changelog section");
	const bodyStart = match.index + match[0].length;
	const nextHeading = /^## \[/gm;
	nextHeading.lastIndex = bodyStart;
	const next = nextHeading.exec(input.changelog);
	const bodyEnd = next?.index ?? input.changelog.length;
	const body = input.changelog.slice(bodyStart, bodyEnd).trim();
	const meaningful = body
		.replace(/^#{1,6}\s+.*$/gm, "")
		.replace(/<!--[\s\S]*?-->/g, "")
		.trim();
	if (!meaningful) throw new Error("The [Unreleased] section has no changes to release");
	if (new RegExp(`^## \\[${escapeRegExp(input.version)}\\](?:\\s|$)`, "m").test(input.changelog)) {
		throw new Error(`Changelog already contains ${input.version}`);
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Release date must use YYYY-MM-DD");

	const before = input.changelog.slice(0, bodyStart);
	const after = input.changelog.slice(bodyEnd);
	const changelog = `${before.trimEnd()}\n\n## [${input.version}] - ${input.date}\n\n${body}\n\n${after.trimStart()}`;
	const nextPackage = { ...(packageData as Record<string, unknown>), version: input.version };
	return {
		packageJson: `${JSON.stringify(nextPackage, null, "\t")}\n`,
		changelog,
		releaseNotes: body,
	};
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function writeAtomically(path: string, contents: string) {
	const temporaryPath = `${path}.release-tmp`;
	await writeFile(temporaryPath, contents, "utf8");
	await rename(temporaryPath, path);
}

async function main() {
	const version = process.argv[2];
	if (!version) throw new Error("Usage: bun scripts/release/prepare.ts <version>");
	const root = process.cwd();
	const packagePath = join(root, "package.json");
	const changelogPath = join(root, "CHANGELOG.md");
	const [packageJson, changelog] = await Promise.all([
		readFile(packagePath, "utf8"),
		readFile(changelogPath, "utf8"),
	]);
	const prepared = prepareReleaseFiles({
		version,
		packageJson,
		changelog,
		date: new Date().toISOString().slice(0, 10),
	});
	await writeAtomically(packagePath, prepared.packageJson);
	await writeAtomically(changelogPath, prepared.changelog);
	console.log(`Prepared release ${version}; no Git operations were performed.`);
}

if (import.meta.main) {
	main().catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
