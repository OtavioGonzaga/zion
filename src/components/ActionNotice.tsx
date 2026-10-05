import { formatReferences } from "../domain/bible/references";
import type { ChapterRef } from "../domain/bible/types";
import { Undo2 } from "lucide-react";

export interface UndoNotice {
	chapter: ChapterRef;
}

export function ActionNotice({
	notice,
	onUndo,
}: {
	notice: UndoNotice | null;
	onUndo: () => void;
}) {
	if (!notice) return null;
	return (
		<div className="action-notice" role="status" aria-live="polite">
			<span>{formatReferences([notice.chapter])} marcado como lido.</span>
			<button className="button" type="button" onClick={onUndo}>
				<Undo2 size={18} strokeWidth={1.8} aria-hidden="true" />
				Desfazer
			</button>
		</div>
	);
}
