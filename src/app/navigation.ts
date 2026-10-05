export type AppView = "today" | "schedule" | "completed" | "settings" | "edit-plan";
export type PrimaryView = Extract<AppView, "today" | "schedule" | "completed">;

export const viewToHash: Record<AppView, string> = {
	today: "today",
	schedule: "plan",
	completed: "completed",
	settings: "settings",
	"edit-plan": "edit-plan",
};

const hashToView = Object.fromEntries(
	Object.entries(viewToHash).map(([view, hash]) => [hash, view]),
) as Record<string, AppView>;

export function parseViewFromHash(hash: string, hasPlan: boolean): AppView | "setup" {
	if (!hasPlan) return "setup";
	return hashToView[hash.replace(/^#/, "")] ?? "today";
}

export function hashForView(view: AppView): string {
	return `#${viewToHash[view]}`;
}

export function isPrimaryView(view: AppView): view is PrimaryView {
	return view === "today" || view === "schedule" || view === "completed";
}
