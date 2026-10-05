import { formatReferences } from "../domain/bible/references";
import type { ChapterRef } from "../domain/bible/types";
import UndoIcon from "@mui/icons-material/Undo";

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
				<UndoIcon aria-hidden="true" fontSize="small" />
				Desfazer
			</button>
		</div>
	);
}
