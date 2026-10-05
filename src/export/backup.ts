import packageJson from "../../package.json";
import { parseAppState } from "../storage/state";
import type { AppState } from "../storage/state";

export interface BackupFile {
	exportedAt: string;
	appVersion: string;
	state: AppState;
}

export type BackupParseResult =
	| { ok: true; state: AppState; exportedAt: string }
	| { ok: false; reason: string };

export function createBackup(state: AppState, exportedAt = new Date().toISOString()): BackupFile {
	return { exportedAt, appVersion: packageJson.version, state };
}

export function serializeBackup(state: AppState, exportedAt?: string): string {
	return `${JSON.stringify(createBackup(state, exportedAt), null, 2)}\n`;
}

export function parseBackup(serialized: string): BackupParseResult {
	let value: unknown;
	try {
		value = JSON.parse(serialized);
	} catch {
		return { ok: false, reason: "O arquivo não contém JSON válido." };
	}
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return { ok: false, reason: "A estrutura do backup é inválida." };
	}
	const backup = value as Partial<BackupFile>;
	if (typeof backup.exportedAt !== "string" || !Number.isFinite(Date.parse(backup.exportedAt))) {
		return { ok: false, reason: "A data de exportação do backup é inválida." };
	}
	if (
		typeof backup.appVersion !== "string" ||
		typeof backup.state !== "object" ||
		backup.state === null
	) {
		return { ok: false, reason: "O arquivo não contém um estado de aplicação válido." };
	}
	const state = parseAppState(JSON.stringify(backup.state));
	if (!state.ok)
		return {
			ok: false,
			reason: "A versão dos dados do backup não é compatível ou está corrompida.",
		};
	return { ok: true, state: state.state, exportedAt: backup.exportedAt };
}
