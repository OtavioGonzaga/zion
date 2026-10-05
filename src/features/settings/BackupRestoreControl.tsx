import { useRef, useState } from "react";
import { parseBackup } from "../../export/backup";
import type { AppState } from "../../storage/state";

export function BackupRestoreControl({ onRestore }: { onRestore: (state: AppState) => void }) {
	const fileInput = useRef<HTMLInputElement>(null);
	const [message, setMessage] = useState("");

	async function restore(file?: File) {
		if (!file) return;
		const result = parseBackup(await file.text());
		if (!result.ok) {
			setMessage(result.reason);
			return;
		}
		if (!window.confirm("Substituir os dados deste navegador pelo backup selecionado?")) return;
		onRestore(result.state);
		setMessage("Backup restaurado com sucesso.");
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
		</div>
	);
}
