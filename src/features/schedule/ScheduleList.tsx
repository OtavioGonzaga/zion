import { formatLocalDate } from "../../domain/bible/date";
import { formatReferences } from "../../domain/bible/references";
import type { LocalDate, ChapterRef } from "../../domain/bible/types";
import type { DailyAssignment } from "../../domain/plan/types";
import { ChapterList } from "../today/ChapterList";

function describeDay(date: LocalDate, today: LocalDate) {
	if (date === today) return "Hoje";
	return formatLocalDate(date, { weekday: "short", day: "2-digit", month: "short" });
}

export function ScheduleList({
	assignments,
	today,
	completed,
	onToggle,
}: {
	assignments: DailyAssignment[];
	today: LocalDate;
	completed: Set<ChapterRef>;
	onToggle: (chapter: ChapterRef, checked: boolean) => void;
}) {
	return (
		<div className="schedule-list">
			{assignments.map((assignment) => (
				<article className="schedule-day" key={assignment.date}>
					<div className="schedule-day-heading">
						<time dateTime={assignment.date}>{describeDay(assignment.date, today)}</time>
						<strong>
							{assignment.chapters.length ? formatReferences(assignment.chapters) : "Dia livre"}
						</strong>
					</div>
					{assignment.chapters.length > 0 && (
						<ChapterList chapters={assignment.chapters} completed={completed} onToggle={onToggle} />
					)}
				</article>
			))}
		</div>
	);
}

export function UpcomingList({
	assignments,
	today,
}: {
	assignments: DailyAssignment[];
	today: LocalDate;
}) {
	const upcoming = assignments
		.filter((assignment) => assignment.date > today && assignment.chapters.length > 0)
		.slice(0, 4);
	return upcoming.length ? (
		<div className="upcoming-list">
			{upcoming.map((assignment) => (
				<div className="upcoming-item" key={assignment.date}>
					<time dateTime={assignment.date}>{describeDay(assignment.date, today)}</time>
					<strong>{formatReferences(assignment.chapters)}</strong>
				</div>
			))}
		</div>
	) : (
		<p className="muted">Nenhuma leitura futura pendente.</p>
	);
}
