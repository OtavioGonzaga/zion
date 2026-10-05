import { formatLocalDate } from "../domain/bible/date";
import { formatReferenceRange } from "../domain/bible/references";
import type { ReadingPlan } from "../domain/plan/types";
import { getPlanProgress } from "../domain/plan/scheduler";

export function PlanSummary({
	plan,
	progress,
}: {
	plan: ReadingPlan;
	progress: ReturnType<typeof getPlanProgress>;
}) {
	return (
		<section className="card summary-card" aria-label="Resumo do plano">
			<p className="eyebrow">Seu plano de leitura</p>
			<h2 className="plan-title">{formatReferenceRange(plan.startReference, plan.endReference)}</h2>
			<div className="plan-range">
				<span>
					De <strong>{formatLocalDate(plan.startDate)}</strong>
				</span>
				<span>
					até <strong>{formatLocalDate(plan.targetDate)}</strong>
				</span>
			</div>
			<div className="progress-label">
				<strong>{progress.percentage}% concluído</strong>
				<span className="muted">
					{progress.completed} de {progress.total} capítulos
				</span>
			</div>
			<div
				className="progress-track"
				role="progressbar"
				aria-label="Progresso do plano"
				aria-valuenow={progress.percentage}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
			</div>
		</section>
	);
}
