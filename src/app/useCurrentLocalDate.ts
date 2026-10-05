import { useEffect, useState } from "react";
import { getCurrentLocalDate } from "../domain/bible/date";

export function useCurrentLocalDate() {
	const [today, setToday] = useState(getCurrentLocalDate);

	useEffect(() => {
		const refresh = () => setToday(getCurrentLocalDate());
		const scheduleMidnightRefresh = () => {
			const now = new Date();
			const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
			const timer = window.setTimeout(
				() => {
					refresh();
					scheduleMidnightRefresh();
				},
				Math.max(1, nextDay.getTime() - now.getTime()),
			);
			return timer;
		};
		let timer = scheduleMidnightRefresh();
		const reschedule = () => {
			refresh();
			window.clearTimeout(timer);
			timer = scheduleMidnightRefresh();
		};
		document.addEventListener("visibilitychange", reschedule);
		window.addEventListener("focus", reschedule);
		return () => {
			window.clearTimeout(timer);
			document.removeEventListener("visibilitychange", reschedule);
			window.removeEventListener("focus", reschedule);
		};
	}, []);

	return today;
}
