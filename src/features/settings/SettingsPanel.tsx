import { getCurrentLocalDate } from "../../domain/bible/date";
import { appConfig } from "../../config/app";
import type { DailyAssignment, Schedule } from "../../domain/plan/types";
import { serializeBackup } from "../../export/backup";
import { exportScheduleCsv } from "../../export/csv";
import { downloadTextFile } from "../../export/download";
import { BackupRestoreControl } from "./BackupRestoreControl";
import type { AppState } from "../../storage/state";

interface SettingsPanelProps {
	state: AppState;
	schedule: Schedule | null;
	todayAssignment?: DailyAssignment;
	onRestore: (state: AppState) => void;
	onResetProgress: () => void;
	onRemovePlan: () => void;
	onPrint: () => void;
}

export function SettingsPanel({
	state,
	schedule,
	todayAssignment,
	onRestore,
	onResetProgress,
	onRemovePlan,
	onPrint,
}: SettingsPanelProps) {
	const today = getCurrentLocalDate();

	function exportJson() {
		downloadTextFile(
			`${appConfig.name.toLowerCase()}-backup-${today}.json`,
			serializeBackup(state),
			"application/json",
		);
	}

	function exportCsv() {
		const assignments =
			schedule?.assignments.map((assignment) =>
				assignment.date === today && todayAssignment ? todayAssignment : assignment,
			) ?? [];
		downloadTextFile(
			`${appConfig.name.toLowerCase()}-schedule-${today}.csv`,
			exportScheduleCsv(
				assignments,
				state.progress.map((item) => item.chapter),
			),
			"text/csv;charset=utf-8",
		);
	}

	return (
		<section className="card settings-card" aria-labelledby="settings-heading">
			<p className="eyebrow">Privacidade e dados</p>
			<h1 className="plan-title" id="settings-heading">
				Configurações
			</h1>
			<p className="muted">
				Seus dados ficam armazenados neste navegador. Limpar os dados do navegador pode remover seu
				progresso; recomendamos exportar um backup JSON.
			</p>
			<div className="settings-group">
				<h2>Backup e exportação</h2>
				<div className="settings-actions">
					<button className="button button-primary" type="button" onClick={exportJson}>
						Exportar backup JSON
					</button>
					<BackupRestoreControl onRestore={onRestore} />
					<button className="button" type="button" onClick={exportCsv}>
						Exportar cronograma CSV
					</button>
					<button className="button" type="button" onClick={onPrint}>
						Imprimir / Salvar em PDF
					</button>
				</div>
			</div>
			<div className="settings-group">
				<h2>Dados do plano</h2>
				<div className="settings-actions">
					<button
						className="button"
						type="button"
						onClick={() => {
							if (window.confirm("Resetar todo o progresso deste plano?")) onResetProgress();
						}}
					>
						Resetar progresso
					</button>
					<button
						className="button button-danger"
						type="button"
						onClick={() => {
							if (window.confirm("Remover o plano e todo o progresso salvo neste navegador?"))
								onRemovePlan();
						}}
					>
						Remover plano
					</button>
				</div>
			</div>
		</section>
	);
}
