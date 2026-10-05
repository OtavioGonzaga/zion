import { compareChapterRefs, isValidChapterRef } from "../bible/bible";
import { compareLocalDates, parseLocalDate } from "../bible/date";
import type { ReadingPlan } from "./types";

export type PlanField = "startReference" | "endReference" | "startDate" | "targetDate";
export type PlanErrors = Partial<Record<PlanField, string>>;

export function validatePlan(plan: ReadingPlan): PlanErrors {
	const errors: PlanErrors = {};
	if (!isValidChapterRef(plan.startReference))
		errors.startReference = "Escolha um capítulo inicial válido.";
	if (!isValidChapterRef(plan.endReference))
		errors.endReference = "Escolha um capítulo final válido.";
	if (
		isValidChapterRef(plan.startReference) &&
		isValidChapterRef(plan.endReference) &&
		compareChapterRefs(plan.startReference, plan.endReference) > 0
	) {
		errors.endReference = "O capítulo final deve ser igual ou posterior ao inicial.";
	}
	if (!parseLocalDate(plan.startDate)) errors.startDate = "Informe uma data inicial válida.";
	if (!parseLocalDate(plan.targetDate)) errors.targetDate = "Informe uma data final válida.";
	if (
		parseLocalDate(plan.startDate) &&
		parseLocalDate(plan.targetDate) &&
		compareLocalDates(plan.startDate, plan.targetDate) > 0
	) {
		errors.targetDate = "A data final deve ser igual ou posterior à inicial.";
	}
	return errors;
}
