import type { LocalDate } from "./types";

export function timestampToLocalDate(timestamp: string): LocalDate | null {
	const date = new Date(timestamp);
	if (!Number.isFinite(date.getTime())) return null;
	return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1)
		.toString()
		.padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}` as LocalDate;
}
