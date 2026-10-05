import type { LocalDate } from "./types";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDate(value: string): LocalDate | null {
	const match = DATE_PATTERN.exec(value);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	)
		return null;
	return value as LocalDate;
}

export function compareLocalDates(left: LocalDate, right: LocalDate): number {
	return left.localeCompare(right);
}

export function addDays(date: LocalDate, amount: number): LocalDate {
	if (!Number.isInteger(amount)) throw new RangeError("Day offset must be an integer.");
	const [year, month, day] = date.split("-").map(Number);
	const result = new Date(Date.UTC(year!, month! - 1, day! + amount));
	return `${result.getUTCFullYear().toString().padStart(4, "0")}-${(result.getUTCMonth() + 1).toString().padStart(2, "0")}-${result.getUTCDate().toString().padStart(2, "0")}` as LocalDate;
}

export function listDates(start: LocalDate, end: LocalDate): LocalDate[] {
	if (compareLocalDates(start, end) > 0) return [];
	const dates: LocalDate[] = [];
	for (let date = start; compareLocalDates(date, end) <= 0; date = addDays(date, 1))
		dates.push(date);
	return dates;
}

export function formatLocalDate(date: LocalDate, options?: Intl.DateTimeFormatOptions): string {
	const [year, month, day] = date.split("-").map(Number);
	return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", ...options }).format(
		new Date(year!, month! - 1, day!, 12),
	);
}

export function getCurrentLocalDate(now = new Date()): LocalDate {
	return `${now.getFullYear().toString().padStart(4, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}` as LocalDate;
}
