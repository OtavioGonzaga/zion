import { bibleBooks, bibleChapters } from "../../data/bible-books";
import type { BibleBook } from "../../data/bible-books";
import type { ChapterRef } from "./types";

const bookById = new Map(bibleBooks.map((book) => [book.id, book]));
const chapterIndex = new Map(bibleChapters.map((chapter, index) => [chapter, index]));

export function parseChapterRef(value: string): ChapterRef | null {
	const match = /^([A-Z0-9]{3})\.(\d+)$/.exec(value);
	if (!match || !isValidChapterRef(value)) return null;
	return value as ChapterRef;
}

export function isValidChapterRef(value: string): boolean {
	const match = /^([A-Z0-9]{3})\.(\d+)$/.exec(value);
	if (!match) return false;
	const book = bookById.get(match[1] ?? "");
	const chapter = Number(match[2]);
	return Boolean(book && Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters);
}

export function getBook(bookId: string): BibleBook | undefined {
	return bookById.get(bookId);
}

export function compareChapterRefs(left: ChapterRef, right: ChapterRef): number {
	return (
		(chapterIndex.get(left) ?? Number.POSITIVE_INFINITY) -
		(chapterIndex.get(right) ?? Number.POSITIVE_INFINITY)
	);
}

export function getChapterRange(start: ChapterRef, end: ChapterRef): ChapterRef[] {
	const startIndex = chapterIndex.get(start);
	const endIndex = chapterIndex.get(end);
	if (startIndex === undefined || endIndex === undefined || startIndex > endIndex) return [];
	return bibleChapters.slice(startIndex, endIndex + 1) as ChapterRef[];
}

export function getChapterPosition(reference: ChapterRef): number {
	return chapterIndex.get(reference) ?? -1;
}
