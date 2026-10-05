import { getChapterRange } from "../../domain/bible/bible";
import { timestampToLocalDate } from "../../domain/bible/date-format";
import type { ChapterRef, LocalDate } from "../../domain/bible/types";
import type { CompletedChapter, ReadingPlan } from "../../domain/plan/types";

export interface CompletedGroup {
	date: LocalDate;
	items: CompletedChapter[];
}

export function selectCompleted(
	progress: CompletedChapter[],
	plan: ReadingPlan,
	book?: string,
): CompletedChapter[] {
	const allowed = new Set(getChapterRange(plan.startReference, plan.endReference));
	return progress
		.filter(({ chapter }) => allowed.has(chapter) && (!book || chapter.startsWith(`${book}.`)))
		.slice()
		.sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt));
}

export function groupCompletedByLocalDate(items: CompletedChapter[]): CompletedGroup[] {
	const groups = new Map<LocalDate, CompletedChapter[]>();
	for (const item of items) {
		const date = timestampToLocalDate(item.completedAt);
		if (!date) continue;
		const group = groups.get(date) ?? [];
		group.push(item);
		groups.set(date, group);
	}
	return [...groups]
		.sort(([left], [right]) => right.localeCompare(left))
		.map(([date, grouped]) => ({ date, items: grouped }));
}

export function getCompletedBooks(items: CompletedChapter[]): string[] {
	return [...new Set(items.map(({ chapter }) => (chapter as ChapterRef).split(".")[0]!))];
}
