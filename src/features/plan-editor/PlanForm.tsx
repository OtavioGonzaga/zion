import { useEffect, useState } from "react";
import { ChapterReferencePicker } from "../../components/ChapterReferencePicker";
import { SelectField } from "../../components/SelectField";
import { getChapterRange } from "../../domain/bible/bible";
import { getBookOptions } from "../../domain/bible/references";
import type { ChapterRef, LocalDate } from "../../domain/bible/types";
import type { ReadingPlan } from "../../domain/plan/types";
import { validatePlan } from "../../domain/plan/validation";

interface PlanFormProps {
	initialPlan?: ReadingPlan;
	startDate: LocalDate;
	targetDate: LocalDate;
	onSubmit: (plan: ReadingPlan, completedThrough?: ChapterRef) => void;
	onCancel?: () => void;
	onDirtyChange?: (dirty: boolean) => void;
}

const books = getBookOptions();

function partsFromReference(
	reference: ChapterRef | undefined,
	fallbackBook: string,
	fallbackChapter: number,
) {
	if (!reference) return { book: fallbackBook, chapter: fallbackChapter };
	const [book, chapter] = reference.split(".");
	return { book: book!, chapter: Number(chapter) };
}

export function PlanForm({
	initialPlan,
	startDate,
	targetDate,
	onSubmit,
	onCancel,
	onDirtyChange,
}: PlanFormProps) {
	const start = partsFromReference(initialPlan?.startReference, "GEN", 1);
	const end = partsFromReference(initialPlan?.endReference, "REV", 22);
	const [startBook, setStartBook] = useState(start.book);
	const [startChapter, setStartChapter] = useState(start.chapter);
	const [endBook, setEndBook] = useState(end.book);
	const [endChapter, setEndChapter] = useState(end.chapter);
	const [startDay, setStartDay] = useState<string>(initialPlan?.startDate ?? startDate);
	const [targetDay, setTargetDay] = useState<string>(initialPlan?.targetDate ?? targetDate);
	const [errors, setErrors] = useState<ReturnType<typeof validatePlan>>({});
	const [readThrough, setReadThrough] = useState<ChapterRef | null>(null);
	const [readThroughError, setReadThroughError] = useState(false);
	const dirty =
		Boolean(initialPlan) &&
		(`${startBook}.${startChapter}` !== initialPlan?.startReference ||
			`${endBook}.${endChapter}` !== initialPlan?.endReference ||
			startDay !== initialPlan?.startDate ||
			targetDay !== initialPlan?.targetDate ||
			readThrough !== null);

	useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

	function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const candidate: ReadingPlan = {
			startReference: `${startBook}.${startChapter}` as ChapterRef,
			endReference: `${endBook}.${endChapter}` as ChapterRef,
			startDate: startDay as LocalDate,
			targetDate: targetDay as LocalDate,
		};
		const validation = validatePlan(candidate);
		setErrors(validation);
		const validReadThrough =
			!readThrough ||
			getChapterRange(candidate.startReference, candidate.endReference).includes(readThrough);
		setReadThroughError(!validReadThrough);
		if (Object.keys(validation).length === 0 && validReadThrough)
			onSubmit(candidate, readThrough ?? undefined);
	}

	return (
		<form className="plan-form" onSubmit={submit} noValidate>
			<div className="form-range">
				<fieldset className="form-fieldset">
					<legend>Começar em</legend>
					<label htmlFor="start-book">Livro inicial</label>
					<SelectField
						id="start-book"
						value={startBook}
						onChange={(event) => {
							setStartBook(event.target.value);
							setStartChapter(1);
						}}
					>
						{books.map((book) => (
							<option key={book.id} value={book.id}>
								{book.name}
							</option>
						))}
					</SelectField>
					<label htmlFor="start-chapter">Capítulo inicial</label>
					<SelectField
						id="start-chapter"
						aria-invalid={Boolean(errors.startReference)}
						aria-describedby={errors.startReference ? "start-reference-error" : undefined}
						value={startChapter}
						onChange={(event) => setStartChapter(Number(event.target.value))}
					>
						{Array.from(
							{ length: books.find((book) => book.id === startBook)?.chapters ?? 1 },
							(_, index) => (
								<option key={index + 1} value={index + 1}>
									{index + 1}
								</option>
							),
						)}
					</SelectField>
					{errors.startReference && (
						<p className="field-error" id="start-reference-error" role="alert">
							{errors.startReference}
						</p>
					)}
				</fieldset>
				<fieldset className="form-fieldset">
					<legend>Terminar em</legend>
					<label htmlFor="end-book">Livro final</label>
					<SelectField
						id="end-book"
						value={endBook}
						onChange={(event) => {
							setEndBook(event.target.value);
							setEndChapter(1);
						}}
					>
						{books.map((book) => (
							<option key={book.id} value={book.id}>
								{book.name}
							</option>
						))}
					</SelectField>
					<label htmlFor="end-chapter">Capítulo final</label>
					<SelectField
						id="end-chapter"
						aria-invalid={Boolean(errors.endReference)}
						aria-describedby={errors.endReference ? "end-reference-error" : undefined}
						value={endChapter}
						onChange={(event) => setEndChapter(Number(event.target.value))}
					>
						{Array.from(
							{ length: books.find((book) => book.id === endBook)?.chapters ?? 1 },
							(_, index) => (
								<option key={index + 1} value={index + 1}>
									{index + 1}
								</option>
							),
						)}
					</SelectField>
					{errors.endReference && (
						<p className="field-error" id="end-reference-error" role="alert">
							{errors.endReference}
						</p>
					)}
				</fieldset>
			</div>
			<div className="form-range">
				<div>
					<ChapterReferencePicker
						idPrefix="read-through"
						label="Já li até… (opcional)"
						value={readThrough}
						start={`${startBook}.${startChapter}` as ChapterRef}
						end={`${endBook}.${endChapter}` as ChapterRef}
						onChange={(reference) => {
							setReadThrough(reference);
							setReadThroughError(false);
						}}
					/>
					<p className="muted field-hint">
						{readThrough
							? `${getChapterRange(`${startBook}.${startChapter}` as ChapterRef, readThrough).length} capítulos serão marcados como lidos, desde o início do plano.`
							: "Marque automaticamente como lidos os capítulos desde o início do plano."}
					</p>
					{readThroughError && (
						<p className="field-error" role="alert">
							Escolha um capítulo entre o início e o fim do plano.
						</p>
					)}
				</div>
			</div>
			<div className="form-range">
				<div className="form-fieldset">
					<label htmlFor="start-date">Data inicial</label>
					<input
						id="start-date"
						type="date"
						aria-invalid={Boolean(errors.startDate)}
						aria-describedby={errors.startDate ? "start-date-error" : undefined}
						value={startDay}
						onChange={(event) => setStartDay(event.target.value)}
					/>
					{errors.startDate && (
						<p className="field-error" id="start-date-error" role="alert">
							{errors.startDate}
						</p>
					)}
				</div>
				<div className="form-fieldset">
					<label htmlFor="target-date">Data final</label>
					<input
						id="target-date"
						type="date"
						aria-invalid={Boolean(errors.targetDate)}
						aria-describedby={errors.targetDate ? "target-date-error" : undefined}
						value={targetDay}
						onChange={(event) => setTargetDay(event.target.value)}
					/>
					{errors.targetDate && (
						<p className="field-error" id="target-date-error" role="alert">
							{errors.targetDate}
						</p>
					)}
				</div>
			</div>
			<div className="form-actions">
				{onCancel && (
					<button className="button" type="button" onClick={onCancel}>
						Cancelar
					</button>
				)}
				<button className="button button-primary" type="submit">
					{initialPlan ? "Salvar alterações" : "Criar plano"}
				</button>
			</div>
		</form>
	);
}
