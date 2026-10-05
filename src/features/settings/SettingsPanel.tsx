import { useState } from "react";
import { appConfig } from "../../config/app";
import { ChapterReferencePicker } from "../../components/ChapterReferencePicker";
import { getChapterRange } from "../../domain/bible/bible";
import { getCurrentLocalDate } from "../../domain/bible/date";
import type { ChapterRef } from "../../domain/bible/types";
import type { DailyAssignment, Schedule } from "../../domain/plan/types";
import { serializeBackup } from "../../export/backup";
import { exportCurrentScheduleCsv } from "../../export/csv";
import { downloadTextFile } from "../../export/download";
import { BackupRestoreControl } from "./BackupRestoreControl";
import type { AppState } from "../../storage/state";
import { ConfirmDialog } from "../../components/ConfirmDialog";

interface Confirmation {
	title: string;
	message: string;
	confirmLabel: string;
	destructive?: boolean;
	action: () => void;
}

interface SettingsPanelProps {
	state: AppState;
	schedule: Schedule | null;
	todayAssignment?: DailyAssignment;
	onRestore: (state: AppState) => void;
	onResetProgress: () => void;
	onRemovePlan: () => void;
	onMarkRange: (start: ChapterRef, end: ChapterRef) => void;
	onUnmarkRange: (start: ChapterRef, end: ChapterRef) => void;
	onPrint: () => void;
	onEditPlan: () => void;
	headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

export function SettingsPanel({
	state,
	schedule,
	todayAssignment,
	onRestore,
	onResetProgress,
	onRemovePlan,
	onMarkRange,
	onUnmarkRange,
	onPrint,
	onEditPlan,
	headingRef,
}: SettingsPanelProps) {
	const today = getCurrentLocalDate();
	const plan = state.plan!;
	const [rangeStart, setRangeStart] = useState<ChapterRef>(plan.startReference);
	const [rangeEnd, setRangeEnd] = useState<ChapterRef>(plan.startReference);
	const chaptersInRange = getChapterRange(rangeStart, rangeEnd);
	const completed = new Set(state.progress.map(({ chapter }) => chapter));
	const completedInRange = chaptersInRange.filter((chapter) => completed.has(chapter)).length;
	const missingInRange = chaptersInRange.length - completedInRange;
	const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

	function exportJson() {
		downloadTextFile(
			`${appConfig.name.toLowerCase()}-backup-${today}.json`,
			serializeBackup(state),
			"application/json",
		);
	}

	function exportCsv() {
		if (!schedule) return;
		downloadTextFile(
			`${appConfig.name.toLowerCase()}-schedule-${today}.csv`,
			exportCurrentScheduleCsv(
				today,
				todayAssignment,
				schedule,
				state.progress.map(({ chapter }) => chapter),
			),
			"text/csv;charset=utf-8",
		);
	}

	return (
		<section className="card settings-card" aria-labelledby="settings-heading">
			<p className="eyebrow">Privacidade e dados</p>
			<h1 className="plan-title" id="settings-heading" tabIndex={-1} ref={headingRef}>
				Configurações
			</h1>
			<p className="muted">
				Seus dados ficam armazenados neste navegador. Limpar os dados do navegador pode remover seu
				progresso; recomendamos exportar um backup JSON.
			</p>
			<div className="settings-group">
				<h2>Plano</h2>
				<button className="button" type="button" onClick={onEditPlan}>
					Editar plano
				</button>
			</div>
			<div className="settings-group">
				<h2>Progresso</h2>
				<p className="muted">
					A meta de hoje permanece estável durante o dia; o cronograma futuro acompanha seu
					progresso.
				</p>
				<div className="form-range progress-range">
					<ChapterReferencePicker
						idPrefix="progress-start"
						label="Começar em"
						value={rangeStart}
						start={plan.startReference}
						end={plan.endReference}
						onChange={(reference) => reference && setRangeStart(reference)}
					/>
					<ChapterReferencePicker
						idPrefix="progress-end"
						label="Terminar em"
						value={rangeEnd}
						start={plan.startReference}
						end={plan.endReference}
						onChange={(reference) => reference && setRangeEnd(reference)}
					/>
				</div>
				<p className="muted" aria-live="polite">
					{chaptersInRange.length} capítulos no intervalo; {completedInRange} já concluídos.
				</p>
				<div className="settings-actions">
					<button
						className="button button-primary"
						type="button"
						disabled={!missingInRange}
						onClick={() => {
							if (missingInRange)
								setConfirmation({
									title: "Marcar capítulos como lidos?",
									message: `Serão marcados ${missingInRange} capítulos como lidos.`,
									confirmLabel: "Marcar como lidos",
									action: () => onMarkRange(rangeStart, rangeEnd),
								});
						}}
					>
						Marcar {missingInRange} capítulos como lidos
					</button>
					<button
						className="button"
						type="button"
						disabled={!completedInRange}
						onClick={() => {
							if (completedInRange)
								setConfirmation({
									title: "Desmarcar capítulos?",
									message: `Serão removidos ${completedInRange} capítulos concluídos deste intervalo.`,
									confirmLabel: "Desmarcar capítulos",
									action: () => onUnmarkRange(rangeStart, rangeEnd),
								});
						}}
					>
						Desmarcar {completedInRange} capítulos
					</button>
				</div>
			</div>
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
							setConfirmation({
								title: "Resetar progresso?",
								message: "Todo o progresso concluído deste plano será removido.",
								confirmLabel: "Resetar progresso",
								destructive: true,
								action: onResetProgress,
							});
						}}
					>
						Resetar progresso
					</button>
					<button
						className="button button-danger"
						type="button"
						onClick={() => {
							setConfirmation({
								title: "Remover plano?",
								message: "O plano e todo o progresso salvo neste navegador serão removidos.",
								confirmLabel: "Remover plano",
								destructive: true,
								action: onRemovePlan,
							});
						}}
					>
						Remover plano
					</button>
				</div>
			</div>
			{confirmation && (
				<ConfirmDialog
					open
					title={confirmation.title}
					message={confirmation.message}
					confirmLabel={confirmation.confirmLabel}
					destructive={confirmation.destructive}
					onCancel={() => setConfirmation(null)}
					onConfirm={() => {
						confirmation.action();
						setConfirmation(null);
					}}
				/>
			)}
		</section>
	);
}
