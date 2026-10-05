import { getChapterRange } from "../bible/bible";
import type { ChapterRef } from "../bible/types";
import type { CompletedChapter } from "./types";

export function getContiguousCompletedThrough(
	start: ChapterRef,
	end: ChapterRef,
	progress: CompletedChapter[],
): ChapterRef | undefined {
	const completed = new Set(progress.map(({ chapter }) => chapter));
	let lastCompleted: ChapterRef | undefined;
	for (const chapter of getChapterRange(start, end)) {
		if (!completed.has(chapter)) break;
		lastCompleted = chapter;
	}
	return lastCompleted;
}

export function mergeCompletedRange(
	progress: CompletedChapter[],
	start: ChapterRef,
	end: ChapterRef,
	completedAt: string,
): CompletedChapter[] {
	const merged = new Map(progress.map((item) => [item.chapter, item]));
	for (const chapter of getChapterRange(start, end)) {
		if (!merged.has(chapter)) merged.set(chapter, { chapter, completedAt });
	}
	return [...merged.values()];
}

export function markChapterComplete(
	progress: CompletedChapter[],
	chapter: ChapterRef,
	completedAt: string,
): CompletedChapter[] {
	return mergeCompletedRange(progress, chapter, chapter, completedAt);
}

export function markRangePending(
	progress: CompletedChapter[],
	start: ChapterRef,
	end: ChapterRef,
): CompletedChapter[] {
	const removed = new Set(getChapterRange(start, end));
	return progress.filter(({ chapter }) => !removed.has(chapter));
}

export function markChapterPending(
	progress: CompletedChapter[],
	chapter: ChapterRef,
): CompletedChapter[] {
	return markRangePending(progress, chapter, chapter);
}
