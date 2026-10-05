import rawBlocks from "./reading-template.json";

export interface ReadingBlock {
	id: string;
	order: number;
	chapters: string[];
	weight: number;
}

export const readingTemplate = rawBlocks as ReadingBlock[];
