import type { AppView, PrimaryView } from "../app/navigation";

const destinations: { view: PrimaryView; label: string }[] = [
	{ view: "today", label: "Hoje" },
	{ view: "schedule", label: "Plano" },
	{ view: "completed", label: "Concluídos" },
];

export function PrimaryNavigation({
	view,
	navigate,
}: {
	view: AppView;
	navigate: (view: AppView) => void;
}) {
	return (
		<nav className="primary-nav" aria-label="Navegação principal">
			{destinations.map(({ view: destination, label }) => (
				<a
					key={destination}
					href={`#${destination === "schedule" ? "plan" : destination}`}
					className={`primary-nav-item${view === destination ? " primary-nav-item-active" : ""}`}
					aria-current={view === destination ? "page" : undefined}
					onClick={(event) => {
						event.preventDefault();
						navigate(destination);
					}}
				>
					{label}
				</a>
			))}
		</nav>
	);
}
