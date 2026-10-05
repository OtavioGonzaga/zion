import type { BibleBook } from "./bible-books";
import type { ReadingBlock } from "../domain/plan/types";

export function validateReadingTemplate(books: BibleBook[], blocks: ReadingBlock[]): string[] {
	const errors: string[] = [];
	const canonical = books.flatMap((book) =>
		Array.from({ length: book.chapters }, (_, index) => `${book.id}.${index + 1}`),
	);
	const knownChapters = new Set(canonical);
	const blockIds = new Set<string>();
	const seenChapters = new Set<string>();
	let expectedOrder = 1;

	for (const block of blocks) {
		if (blockIds.has(block.id)) errors.push(`Duplicate block id: ${block.id}`);
		blockIds.add(block.id);
		if (block.order !== expectedOrder) errors.push(`Invalid order at block ${block.id}`);
		expectedOrder += 1;
		if (block.chapters.length === 0) errors.push(`Empty block: ${block.id}`);
		if (!Number.isFinite(block.weight) || block.weight <= 0) {
			errors.push(`Invalid weight at block ${block.id}`);
		}
		for (const chapter of block.chapters) {
			if (!knownChapters.has(chapter)) errors.push(`Unknown chapter: ${chapter}`);
			if (seenChapters.has(chapter)) errors.push(`Duplicate chapter: ${chapter}`);
			seenChapters.add(chapter);
		}
	}

	const flattened = blocks.flatMap((block) => block.chapters);
	if (flattened.length !== canonical.length) {
		errors.push(`Expected ${canonical.length} chapters, received ${flattened.length}`);
	}
	if (flattened.some((chapter, index) => chapter !== canonical[index])) {
		errors.push("Template chapters do not match canonical Bible order");
	}
	return errors;
}
