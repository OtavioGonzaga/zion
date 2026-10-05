import rawBlocks from "./reading-template.json";
import { bibleBooks } from "./bible-books";
import type { ReadingBlock } from "../domain/plan/types";
import { validateReadingTemplate } from "./validate-reading-template";

const validatedBlocks = rawBlocks as unknown as ReadingBlock[];
const validationErrors = validateReadingTemplate(bibleBooks, validatedBlocks);
if (validationErrors.length > 0) {
	throw new Error(`Invalid reading template: ${validationErrors.join("; ")}`);
}

export const readingTemplate: ReadingBlock[] = validatedBlocks;
