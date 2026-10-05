import { formatReferences } from "../../domain/bible/references";
import type { ChapterRef } from "../../domain/bible/types";

export function ChapterList({
	chapters,
	completed,
	onToggle,
}: {
	chapters: ChapterRef[];
	completed: Set<ChapterRef>;
	onToggle: (chapter: ChapterRef, checked: boolean) => void;
}) {
	return (
		<div className="reading-list">
			{chapters.map((chapter) => (
				<label className="reading-row" key={chapter}>
					<input
						type="checkbox"
						checked={completed.has(chapter)}
						onChange={(event) => onToggle(chapter, event.target.checked)}
					/>
					<span>{formatReferences([chapter])}</span>
				</label>
			))}
		</div>
	);
}
