import type { RefObject } from "react";
import { formatLocalDate } from "../../domain/bible/date";
import type { ChapterRef, LocalDate } from "../../domain/bible/types";
import type { DailyAssignment, Schedule } from "../../domain/plan/types";
import { ChapterList } from "./ChapterList";
import { UpcomingList } from "../schedule/ScheduleList";

export function TodayView({
	today,
	status,
	assignment,
	schedule,
	completed,
	onToggle,
	onOpenPlan,
	onEditPlan,
	headingRef,
}: {
	today: LocalDate;
	status?: Schedule["status"];
	assignment?: DailyAssignment;
	schedule: Schedule | null;
	completed: Set<ChapterRef>;
	onToggle: (chapter: ChapterRef, checked: boolean) => void;
	onOpenPlan: () => void;
	onEditPlan: () => void;
	headingRef: RefObject<HTMLHeadingElement | null>;
}) {
	return (
		<>
			{status === "completed" ? (
				<section className="card state-card">
					<h1 tabIndex={-1} ref={headingRef}>
						Parabéns! Você terminou sua leitura.
					</h1>
				</section>
			) : status === "expired" ? (
				<section className="card state-card">
					<h1 tabIndex={-1} ref={headingRef}>
						Prazo encerrado
					</h1>
					<p>Seu prazo terminou com capítulos pendentes.</p>
					<button className="button button-primary" onClick={onEditPlan} type="button">
						Alterar data final
					</button>
				</section>
			) : (
				<section className="card today-card" aria-labelledby="today-heading">
					<div className="section-heading">
						<div>
							<p className="eyebrow">Leitura de hoje</p>
							<h1 id="today-heading" tabIndex={-1} ref={headingRef}>
								{formatLocalDate(today, { weekday: "long", day: "2-digit", month: "long" })}
							</h1>
						</div>
						<span className="today-date">HOJE</span>
					</div>
					{assignment?.chapters.length ? (
						<ChapterList chapters={assignment.chapters} completed={completed} onToggle={onToggle} />
					) : (
						<p className="muted">
							Não há leitura prevista para hoje. Seu próximo dia de leitura aparece abaixo.
						</p>
					)}
				</section>
			)}
			<section className="card upcoming-card" aria-labelledby="upcoming-heading">
				<div className="section-heading">
					<h2 id="upcoming-heading">Próximas leituras</h2>
					<button className="button" type="button" onClick={onOpenPlan}>
						Ver plano
					</button>
				</div>
				<UpcomingList assignments={schedule?.assignments ?? []} today={today} />
			</section>
		</>
	);
}
