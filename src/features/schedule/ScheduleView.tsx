import type { RefObject } from "react";
import { listDates } from "../../domain/bible/date";
import type { ChapterRef, LocalDate } from "../../domain/bible/types";
import type { ReadingPlan, Schedule } from "../../domain/plan/types";
import { ScheduleList } from "./ScheduleList";
export function ScheduleView({
	plan,
	schedule,
	today,
	completed,
	onToggle,
	headingRef,
}: {
	plan: ReadingPlan;
	schedule: Schedule | null;
	today: LocalDate;
	completed: Set<ChapterRef>;
	onToggle: (chapter: ChapterRef, checked: boolean) => void;
	headingRef: RefObject<HTMLHeadingElement | null>;
}) {
	return (
		<section className="card schedule-card" aria-labelledby="schedule-heading">
			<div className="section-heading">
				<div>
					<p className="eyebrow">Cronograma recalculado</p>
					<h1 id="schedule-heading" tabIndex={-1} ref={headingRef}>
						Plano
					</h1>
				</div>
				<span className="muted">{listDates(today, plan.targetDate).length} dias restantes</span>
			</div>
			<ScheduleList
				assignments={schedule?.assignments ?? []}
				today={today}
				completed={completed}
				onToggle={onToggle}
			/>
		</section>
	);
}
