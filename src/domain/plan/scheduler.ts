import { compareChapterRefs, getChapterPosition, getChapterRange } from "../bible/bible";
import { compareLocalDates, listDates } from "../bible/date";
import type { ChapterRef, LocalDate } from "../bible/types";
import type { ReadingBlock } from "../../data/reading-template";
import type {
	CompletedChapter,
	DailyAssignment,
	ReadingPlan,
	Schedule,
	ScheduledBlock,
} from "./types";

interface ScheduleInput {
	template: ReadingBlock[];
	plan: ReadingPlan;
	progress: CompletedChapter[];
	today: LocalDate;
	eligibleDates?: LocalDate[];
}

function makeEmptyAssignments(dates: LocalDate[]): DailyAssignment[] {
	return dates.map((date) => ({ date, blocks: [], chapters: [], weight: 0 }));
}

export function generateSchedule({
	template,
	plan,
	progress,
	today,
	eligibleDates,
}: ScheduleInput): Schedule {
	const planRange = getChapterRange(plan.startReference, plan.endReference);
	const rangeSet = new Set(planRange);
	const completedSet = new Set(progress.map(({ chapter }) => chapter));
	const completedChapters = planRange.filter((chapter) => completedSet.has(chapter));
	const remainingChapters = planRange.filter((chapter) => !completedSet.has(chapter));
	if (remainingChapters.length === 0)
		return { status: "completed", assignments: [], completedChapters, remainingChapters };
	if (compareLocalDates(today, plan.targetDate) > 0)
		return { status: "expired", assignments: [], completedChapters, remainingChapters };

	const status = compareLocalDates(today, plan.startDate) < 0 ? "not-started" : "active";
	const startDate = compareLocalDates(today, plan.startDate) > 0 ? today : plan.startDate;
	const dates = (eligibleDates ?? listDates(startDate, plan.targetDate))
		.filter(
			(date) =>
				compareLocalDates(date, startDate) >= 0 && compareLocalDates(date, plan.targetDate) <= 0,
		)
		.sort(compareLocalDates)
		.filter((date, index, allDates) => index === 0 || date !== allDates[index - 1]);
	const assignments = makeEmptyAssignments(dates);
	if (dates.length === 0)
		return { status: "expired", assignments, completedChapters, remainingChapters };

	const units: ScheduledBlock[] = [];
	for (const block of [...template].sort((left, right) => left.order - right.order)) {
		const clipped = block.chapters.filter((chapter) =>
			rangeSet.has(chapter as ChapterRef),
		) as ChapterRef[];
		const pending = clipped.filter((chapter) => !completedSet.has(chapter));
		if (pending.length > 0) {
			units.push({
				blockId: block.id,
				chapters: pending,
				weight: block.weight * (pending.length / block.chapters.length),
			});
		}
	}

	const totalWeight = units.reduce((total, unit) => total + unit.weight, 0);
	let cumulativeWeight = 0;
	for (const [unitIndex, unit] of units.entries()) {
		const midpoint = cumulativeWeight + unit.weight / 2;
		const dayIndex =
			units.length <= dates.length
				? units.length === 1
					? 0
					: Math.round((unitIndex / (units.length - 1)) * (dates.length - 1))
				: Math.min(dates.length - 1, Math.floor((midpoint / totalWeight) * dates.length));
		const assignment = assignments[dayIndex]!;
		assignment.blocks.push(unit);
		assignment.chapters.push(...unit.chapters);
		assignment.weight += unit.weight;
		cumulativeWeight += unit.weight;
	}

	for (const assignment of assignments) assignment.chapters.sort(compareChapterRefs);
	return { status, assignments, completedChapters, remainingChapters };
}

export function getPlanProgress(plan: ReadingPlan, progress: CompletedChapter[]) {
	const chapters = getChapterRange(plan.startReference, plan.endReference);
	const completed = new Set(progress.map(({ chapter }) => chapter));
	const completedCount = chapters.filter((chapter) => completed.has(chapter)).length;
	return {
		completed: completedCount,
		total: chapters.length,
		percentage: chapters.length === 0 ? 0 : Math.round((completedCount / chapters.length) * 100),
	};
}

export function findAssignment(schedule: Schedule, date: LocalDate): DailyAssignment | undefined {
	return schedule.assignments.find((assignment) => assignment.date === date);
}

export function isChapterWithinPlan(chapter: ChapterRef, plan: ReadingPlan): boolean {
	const position = getChapterPosition(chapter);
	return (
		position >= getChapterPosition(plan.startReference) &&
		position <= getChapterPosition(plan.endReference)
	);
}
