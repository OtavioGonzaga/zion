import { getChapterRange } from "../domain/bible/bible";
import { getBookOptions } from "../domain/bible/references";
import type { ChapterRef } from "../domain/bible/types";

const books = getBookOptions();

interface ChapterReferencePickerProps {
	idPrefix: string;
	label: string;
	value: ChapterRef | null;
	start: ChapterRef;
	end: ChapterRef;
	onChange: (reference: ChapterRef | null) => void;
}

export function ChapterReferencePicker({
	idPrefix,
	label,
	value,
	start,
	end,
	onChange,
}: ChapterReferencePickerProps) {
	const range = getChapterRange(start, end);
	const availableBooks = books.filter((book) =>
		range.some((reference) => reference.startsWith(`${book.id}.`)),
	);
	const selectedBook = value?.split(".")[0] ?? "";
	const chapters = range.filter((reference) => reference.startsWith(`${selectedBook}.`));

	return (
		<fieldset className="form-fieldset reference-picker">
			<legend>{label}</legend>
			<label htmlFor={`${idPrefix}-book`}>Livro</label>
			<select
				id={`${idPrefix}-book`}
				value={selectedBook}
				onChange={(event) => {
					const next = range.find((reference) => reference.startsWith(`${event.target.value}.`));
					onChange(next ?? null);
				}}
			>
				<option value="">Selecione</option>
				{availableBooks.map((book) => (
					<option key={book.id} value={book.id}>
						{book.name}
					</option>
				))}
			</select>
			<label htmlFor={`${idPrefix}-chapter`}>Capítulo</label>
			<select
				id={`${idPrefix}-chapter`}
				value={value ?? ""}
				disabled={!selectedBook || chapters.length === 0}
				onChange={(event) => onChange((event.target.value as ChapterRef) || null)}
			>
				<option value="">Selecione</option>
				{chapters.map((reference) => (
					<option key={reference} value={reference}>
						{reference.split(".")[1]}
					</option>
				))}
			</select>
		</fieldset>
	);
}
