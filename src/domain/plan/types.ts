import type { ChapterRef, LocalDate } from "../bible/types";

export interface ReadingBlock {
	id: string;
	order: number;
	chapters: ChapterRef[];
	weight: number;
}

export interface ReadingPlan {
	startReference: ChapterRef;
	endReference: ChapterRef;
	startDate: LocalDate;
	targetDate: LocalDate;
}

export interface CompletedChapter {
	chapter: ChapterRef;
	completedAt: string;
}

export interface ScheduledBlock {
	blockId: string;
	chapters: ChapterRef[];
	weight: number;
}

export interface DailyAssignment {
	/** Frozen reading target for this local calendar day; progress changes do not alter its chapters. */
	date: LocalDate;
	blocks: ScheduledBlock[];
	chapters: ChapterRef[];
	weight: number;
}

export interface Schedule {
	status: "active" | "not-started" | "completed" | "expired";
	assignments: DailyAssignment[];
	completedChapters: ChapterRef[];
	remainingChapters: ChapterRef[];
}
