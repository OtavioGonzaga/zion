import { compareChapterRefs, getChapterPosition, getChapterRange } from "../bible/bible";
import { addDays, compareLocalDates, listDates } from "../bible/date";
import type { ChapterRef, LocalDate } from "../bible/types";
import type {
	CompletedChapter,
	DailyAssignment,
	ReadingBlock,
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
		const clipped = block.chapters.filter((chapter) => rangeSet.has(chapter));
		const pending = clipped.filter((chapter) => !completedSet.has(chapter));
		if (pending.length > 0) {
			units.push({
				blockId: block.id,
				chapters: pending,
				weight: block.weight * (pending.length / block.chapters.length),
			});
		}
	}

	if (units.length <= dates.length) {
		for (const [unitIndex, unit] of units.entries()) {
			const dayIndex =
				units.length === 1 ? 0 : Math.round((unitIndex / (units.length - 1)) * (dates.length - 1));
			assignments[dayIndex]!.blocks.push(unit);
		}
	} else {
		const prefixWeights = [0];
		for (const unit of units) prefixWeights.push(prefixWeights.at(-1)! + unit.weight);
		let firstUnit = 0;
		for (let dayIndex = 0; dayIndex < dates.length; dayIndex += 1) {
			const daysAfter = dates.length - dayIndex - 1;
			const latestEnd = units.length - daysAfter;
			if (daysAfter === 0) {
				assignments[dayIndex]!.blocks.push(...units.slice(firstUnit));
				break;
			}
			const targetWeight = (prefixWeights.at(-1)! * (dayIndex + 1)) / dates.length;
			let endUnit = firstUnit + 1;
			for (let candidate = firstUnit + 2; candidate <= latestEnd; candidate += 1) {
				if (
					Math.abs(prefixWeights[candidate]! - targetWeight) <
					Math.abs(prefixWeights[endUnit]! - targetWeight)
				)
					endUnit = candidate;
			}
			assignments[dayIndex]!.blocks.push(...units.slice(firstUnit, endUnit));
			firstUnit = endUnit;
		}
	}
	for (const assignment of assignments) {
		for (const unit of assignment.blocks) {
			assignment.chapters.push(...unit.chapters);
			assignment.weight += unit.weight;
		}
	}

	for (const assignment of assignments) assignment.chapters.sort(compareChapterRefs);
	return { status, assignments, completedChapters, remainingChapters };
}

interface AdaptiveScheduleInput extends ScheduleInput {
	todayAssignment?: DailyAssignment;
}

/**
 * Keeps the current day's saved target visible while projecting all other
 * pending chapters from tomorrow onward. The frozen chapters are reserved only
 * for scheduling; their actual completion state remains unchanged.
 */
export function generateAdaptiveSchedule({
	todayAssignment,
	...input
}: AdaptiveScheduleInput): Schedule {
	const schedule = generateSchedule(input);
	if (!todayAssignment || todayAssignment.date !== input.today || schedule.status !== "active") {
		return schedule;
	}

	const planChapters = new Set(getChapterRange(input.plan.startReference, input.plan.endReference));
	const reserved = todayAssignment.chapters.filter((chapter) => planChapters.has(chapter));
	const reservedSet = new Set(reserved);
	const progress = [
		...input.progress,
		...reserved
			.filter((chapter) => !input.progress.some((completed) => completed.chapter === chapter))
			.map((chapter) => ({ chapter, completedAt: "reserved-for-today" })),
	];
	const future = generateSchedule({
		...input,
		progress,
		today: addDays(input.today, 1),
	});
	const frozenAssignment: DailyAssignment = {
		...todayAssignment,
		chapters: [...todayAssignment.chapters],
		blocks: [...todayAssignment.blocks],
	};
	const futureAssignments = future.assignments.map((assignment) => ({
		...assignment,
		chapters: assignment.chapters.filter((chapter) => !reservedSet.has(chapter)),
	}));
	return {
		...schedule,
		assignments: [frozenAssignment, ...futureAssignments],
	};
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
