import { isValidChapterRef } from "../domain/bible/bible";
import { parseLocalDate } from "../domain/bible/date";
import type { ChapterRef, LocalDate } from "../domain/bible/types";
import type { CompletedChapter, DailyAssignment, ReadingPlan } from "../domain/plan/types";
import { validatePlan } from "../domain/plan/validation";

export type ThemePreference = "system" | "dark" | "light";

export interface AppState {
	schemaVersion: 1;
	plan: ReadingPlan | null;
	progress: CompletedChapter[];
	dailyAssignment: DailyAssignment | null;
	preferences: { theme: ThemePreference };
}

export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem?(key: string): void;
}

export const STORAGE_KEY = "zion:v1";

export function createInitialState(): AppState {
	return {
		schemaVersion: 1,
		plan: null,
		progress: [],
		dailyAssignment: null,
		preferences: { theme: "system" },
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLocalDate(value: unknown): value is LocalDate {
	return typeof value === "string" && parseLocalDate(value) !== null;
}

function isChapterRef(value: unknown): value is ChapterRef {
	return typeof value === "string" && isValidChapterRef(value);
}

function parsePlan(value: unknown): ReadingPlan | null {
	if (!isRecord(value)) return null;
	if (
		!isChapterRef(value.startReference) ||
		!isChapterRef(value.endReference) ||
		!isLocalDate(value.startDate) ||
		!isLocalDate(value.targetDate)
	)
		return null;
	const plan = {
		startReference: value.startReference,
		endReference: value.endReference,
		startDate: value.startDate,
		targetDate: value.targetDate,
	};
	return Object.keys(validatePlan(plan)).length === 0 ? plan : null;
}

function parseCompletedChapter(value: unknown): CompletedChapter | null {
	if (!isRecord(value) || !isChapterRef(value.chapter) || typeof value.completedAt !== "string")
		return null;
	if (!Number.isFinite(Date.parse(value.completedAt))) return null;
	return { chapter: value.chapter, completedAt: value.completedAt };
}

function parseAssignment(value: unknown): DailyAssignment | null {
	if (!isRecord(value) || !isLocalDate(value.date) || !Array.isArray(value.chapters)) return null;
	if (!value.chapters.every(isChapterRef)) return null;
	if (new Set(value.chapters).size !== value.chapters.length) return null;
	return {
		date: value.date,
		chapters: value.chapters,
		blocks: [],
		weight: 0,
	};
}

export type StateParseResult =
	| { ok: true; state: AppState }
	| { ok: false; reason: "invalid-json" | "invalid-schema" | "unsupported-version" };

export function parseAppState(serialized: string): StateParseResult {
	let value: unknown;
	try {
		value = JSON.parse(serialized);
	} catch {
		return { ok: false, reason: "invalid-json" };
	}
	if (!isRecord(value)) return { ok: false, reason: "invalid-schema" };
	if (value.schemaVersion !== 1) return { ok: false, reason: "unsupported-version" };

	const plan = value.plan === undefined || value.plan === null ? null : parsePlan(value.plan);
	const progress =
		value.progress === undefined
			? []
			: Array.isArray(value.progress)
				? value.progress.map(parseCompletedChapter)
				: null;
	const dailyAssignment =
		value.dailyAssignment === undefined || value.dailyAssignment === null
			? null
			: parseAssignment(value.dailyAssignment);
	const rawPreferences = isRecord(value.preferences) ? value.preferences : {};
	const theme = rawPreferences.theme;
	if (
		(plan === null && value.plan !== undefined && value.plan !== null) ||
		progress === null ||
		progress.some((entry) => entry === null) ||
		(dailyAssignment === null &&
			value.dailyAssignment !== undefined &&
			value.dailyAssignment !== null) ||
		(theme !== undefined && theme !== "system" && theme !== "dark" && theme !== "light")
	)
		return { ok: false, reason: "invalid-schema" };

	return {
		ok: true,
		state: {
			schemaVersion: 1,
			plan,
			progress: progress as CompletedChapter[],
			dailyAssignment,
			preferences: { theme: (theme as ThemePreference | undefined) ?? "system" },
		},
	};
}

function getBrowserStorage(): StorageLike | undefined {
	try {
		return typeof window === "undefined" ? undefined : window.localStorage;
	} catch {
		return undefined;
	}
}

export type LoadStateResult = {
	state: AppState;
	issue: "unavailable" | "invalid-json" | "invalid-schema" | "unsupported-version" | null;
	canPersist: boolean;
};

export function loadAppState(storage = getBrowserStorage()): LoadStateResult {
	if (!storage) return { state: createInitialState(), issue: "unavailable", canPersist: false };
	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (raw === null) return { state: createInitialState(), issue: null, canPersist: true };
		const result = parseAppState(raw);
		return result.ok
			? { state: result.state, issue: null, canPersist: true }
			: { state: createInitialState(), issue: result.reason, canPersist: false };
	} catch {
		return { state: createInitialState(), issue: "unavailable", canPersist: false };
	}
}

export function saveAppState(state: AppState, storage = getBrowserStorage()): boolean {
	if (!storage) return false;
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(state));
		return true;
	} catch {
		return false;
	}
}
