import type { ChapterRef, LocalDate } from "../bible/types";

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
