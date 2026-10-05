import { useRef, useState } from "react";
import { parseBackup } from "../../export/backup";
import type { AppState } from "../../storage/state";
import { ConfirmDialog } from "../../components/ConfirmDialog";

export function BackupRestoreControl({ onRestore }: { onRestore: (state: AppState) => void }) {
	const fileInput = useRef<HTMLInputElement>(null);
	const [message, setMessage] = useState("");
	const [pendingRestore, setPendingRestore] = useState<AppState | null>(null);

	async function restore(file?: File) {
		if (!file) return;
		const result = parseBackup(await file.text());
		if (!result.ok) {
			setMessage(result.reason);
			return;
		}
		setPendingRestore(result.state);
	}

	return (
		<div className="backup-restore-control">
			<button className="button" type="button" onClick={() => fileInput.current?.click()}>
				Importar backup JSON
			</button>
			<input
				ref={fileInput}
				className="sr-only"
				type="file"
				accept="application/json,.json"
				aria-label="Selecionar backup JSON"
				onChange={(event) => {
					void restore(event.target.files?.[0]);
					event.target.value = "";
				}}
			/>
			{message && (
				<p role="status" className="notice">
					{message}
				</p>
			)}
			<ConfirmDialog
				open={pendingRestore !== null}
				title="Restaurar backup?"
				message="Os dados atuais deste navegador serão substituídos pelo conteúdo do backup."
				confirmLabel="Restaurar backup"
				destructive
				onCancel={() => setPendingRestore(null)}
				onConfirm={() => {
					if (pendingRestore) {
						onRestore(pendingRestore);
						setMessage("Backup restaurado com sucesso.");
					}
					setPendingRestore(null);
				}}
			/>
		</div>
	);
}
