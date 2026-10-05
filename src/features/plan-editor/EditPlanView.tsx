import type { RefObject } from "react";
import type { ChapterRef, LocalDate } from "../../domain/bible/types";
import type { ReadingPlan } from "../../domain/plan/types";
import { PlanForm } from "./PlanForm";
export function EditPlanView({
	plan,
	today,
	targetDate,
	onSubmit,
	onCancel,
	onDirtyChange,
	headingRef,
}: {
	plan: ReadingPlan;
	today: LocalDate;
	targetDate: LocalDate;
	onSubmit: (plan: ReadingPlan, completedThrough?: ChapterRef) => void;
	onCancel: () => void;
	onDirtyChange: (dirty: boolean) => void;
	headingRef: RefObject<HTMLHeadingElement | null>;
}) {
	return (
		<section className="card setup-card edit-plan-card">
			<p className="eyebrow">Configurações do plano</p>
			<h1 className="plan-title" tabIndex={-1} ref={headingRef}>
				Editar plano
			</h1>
			<p className="muted setup-intro">
				Atualize o intervalo de capítulos e as datas do seu plano.
			</p>
			<PlanForm
				key={`${plan.startReference}:${plan.endReference}:${plan.startDate}:${plan.targetDate}`}
				initialPlan={plan}
				startDate={today}
				targetDate={targetDate}
				onSubmit={onSubmit}
				onCancel={onCancel}
				onDirtyChange={onDirtyChange}
			/>
		</section>
	);
}
