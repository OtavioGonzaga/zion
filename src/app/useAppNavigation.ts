import { useCallback, useEffect, useRef, useState } from "react";
import { hashForView, parseViewFromHash } from "./navigation";
import type { AppView } from "./navigation";

export function useAppNavigation(
	hasPlan: boolean,
	canLeaveCurrent: (next: AppView | "setup") => boolean = () => true,
) {
	const [view, setView] = useState<AppView | "setup">(() =>
		parseViewFromHash(window.location.hash, hasPlan),
	);
	const viewRef = useRef(view);
	const currentHash = useRef(window.location.hash);
	const guardRef = useRef(canLeaveCurrent);
	guardRef.current = canLeaveCurrent;
	viewRef.current = view;

	useEffect(() => {
		const sync = () => {
			const next = parseViewFromHash(window.location.hash, hasPlan);
			if (next !== viewRef.current && !guardRef.current(next)) {
				window.history.replaceState(
					null,
					"",
					`${window.location.pathname}${window.location.search}${currentHash.current}`,
				);
				return;
			}
			currentHash.current = window.location.hash;
			viewRef.current = next;
			setView(next);
			if (hasPlan && next === "today" && window.location.hash !== "#today") {
				window.history.replaceState(null, "", hashForView("today"));
				currentHash.current = hashForView("today");
			}
		};
		window.addEventListener("hashchange", sync);
		sync();
		return () => window.removeEventListener("hashchange", sync);
	}, [hasPlan]);

	const navigate = useCallback((next: AppView) => {
		if (window.location.hash === hashForView(next)) {
			viewRef.current = next;
			currentHash.current = hashForView(next);
			setView(next);
		} else window.location.hash = hashForView(next);
	}, []);

	const reset = useCallback(() => {
		window.history.replaceState(null, "", window.location.pathname + window.location.search);
		currentHash.current = "";
		viewRef.current = "setup";
		setView("setup");
	}, []);

	return { view, navigate, reset };
}
