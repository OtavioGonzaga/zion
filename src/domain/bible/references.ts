import { bibleBooks } from "../../data/bible-books";
import { compareChapterRefs, getBook, getChapterRange } from "./bible";
import type { ChapterRef } from "./types";

export function formatReferences(references: ChapterRef[]): string {
	const sorted = [...new Set(references)].sort(compareChapterRefs);
	const output: string[] = [];
	let index = 0;
	while (index < sorted.length) {
		const first = sorted[index]!;
		const [bookId, chapterText] = first.split(".");
		const firstChapter = Number(chapterText);
		let lastChapter = firstChapter;
		let nextIndex = index + 1;
		while (nextIndex < sorted.length) {
			const [nextBook, nextChapterText] = sorted[nextIndex]!.split(".");
			const nextChapter = Number(nextChapterText);
			if (nextBook !== bookId || nextChapter !== lastChapter + 1) break;
			lastChapter = nextChapter;
			nextIndex += 1;
		}
		const bookName = getBook(bookId!)?.name ?? bookId!;
		const chapterLabel =
			firstChapter === lastChapter ? `${firstChapter}` : `${firstChapter}–${lastChapter}`;
		output.push(`${bookName} ${chapterLabel}`);
		index = nextIndex;
	}
	return output.join(", ");
}

export function getBookOptions() {
	return bibleBooks.map(({ id, name, chapters }) => ({ id, name, chapters }));
}

export function getReferenceBookName(reference: ChapterRef): string {
	return getBook(reference.split(".")[0]!)?.name ?? "";
}

export function formatReferenceRange(start: ChapterRef, end: ChapterRef): string {
	const range = getChapterRange(start, end);
	if (range.length === 0) return "";
	const first = range[0]!;
	const last = range.at(-1)!;
	const [firstBook, firstChapter] = first.split(".");
	const [lastBook, lastChapter] = last.split(".");
	if (firstBook === lastBook) {
		const name = getBook(firstBook!)?.name ?? firstBook!;
		return `${name} ${firstChapter}${firstChapter === lastChapter ? "" : `–${lastChapter}`}`;
	}
	return `${formatReferences([first])} – ${formatReferences([last])}`;
}
