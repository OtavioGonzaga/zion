import { formatReferences } from "../domain/bible/references";
import type { ChapterRef, LocalDate } from "../domain/bible/types";
import type { DailyAssignment } from "../domain/plan/types";

function escapeCell(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

export function exportScheduleCsv(assignments: DailyAssignment[], progress: ChapterRef[]): string {
	const completed = new Set(progress);
	const rows = assignments.map((assignment) => {
		const doneCount = assignment.chapters.filter((chapter) => completed.has(chapter)).length;
		const status =
			assignment.chapters.length === 0
				? "free"
				: doneCount === assignment.chapters.length
					? "completed"
					: doneCount > 0
						? "partial"
						: "pending";
		const reading = formatReferences(assignment.chapters);
		return [assignment.date as LocalDate, reading, status].map(escapeCell).join(",");
	});
	return ["date,reading,status", ...rows].join("\r\n");
}
