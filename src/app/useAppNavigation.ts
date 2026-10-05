import { useCallback, useEffect, useRef, useState } from "react";
import { hashForView, parseViewFromHash } from "./navigation";
import type { AppView } from "./navigation";

interface NavigationHistoryState {
	zionNavigationIndex: number;
}
function readIndex(state: unknown): number | null {
	if (!state || typeof state !== "object" || !("zionNavigationIndex" in state)) return null;
	const index = (state as NavigationHistoryState).zionNavigationIndex;
	return typeof index === "number" ? index : null;
}

export function useAppNavigation(
	hasPlan: boolean,
	canLeaveCurrent: (next: AppView | "setup") => boolean = () => true,
) {
	const [view, setView] = useState<AppView | "setup">(() =>
		parseViewFromHash(window.location.hash, hasPlan),
	);
	const viewRef = useRef(view);
	const indexRef = useRef(0);
	const guardRef = useRef(canLeaveCurrent);
	const restoringRef = useRef(false);
	const allowPendingNavigationRef = useRef(false);
	const pendingHistoryDelta = useRef<number | null>(null);
	guardRef.current = canLeaveCurrent;
	viewRef.current = view;

	useEffect(() => {
		const existing = readIndex(window.history.state);
		if (existing === null)
			window.history.replaceState({ zionNavigationIndex: 0 }, "", window.location.href);
		indexRef.current = existing ?? 0;
		const sync = (fromHistory: boolean) => {
			const next = parseViewFromHash(window.location.hash, hasPlan);
			const nextIndex = readIndex(window.history.state) ?? indexRef.current;
			if (restoringRef.current) {
				restoringRef.current = false;
				return;
			}
			const allowPendingNavigation = allowPendingNavigationRef.current;
			allowPendingNavigationRef.current = false;
			if (next !== viewRef.current && !allowPendingNavigation && !guardRef.current(next)) {
				if (fromHistory) {
					const delta = nextIndex - indexRef.current;
					if (delta) {
						pendingHistoryDelta.current = delta;
						restoringRef.current = true;
						window.history.go(-delta);
					}
				}
				return;
			}
			if (next !== viewRef.current) pendingHistoryDelta.current = null;
			indexRef.current = nextIndex;
			viewRef.current = next;
			setView(next);
		};
		const onPopState = () => sync(true);
		const onHashChange = () => sync(true);
		window.addEventListener("popstate", onPopState);
		window.addEventListener("hashchange", onHashChange);
		sync(false);
		return () => {
			window.removeEventListener("popstate", onPopState);
			window.removeEventListener("hashchange", onHashChange);
		};
	}, [hasPlan]);

	const navigate = useCallback((next: AppView) => {
		if (next === viewRef.current) return;
		const index = indexRef.current + 1;
		window.history.pushState({ zionNavigationIndex: index }, "", hashForView(next));
		indexRef.current = index;
		viewRef.current = next;
		setView(next);
	}, []);
	const continuePendingNavigation = useCallback(() => {
		const delta = pendingHistoryDelta.current;
		if (!delta) return false;
		pendingHistoryDelta.current = null;
		allowPendingNavigationRef.current = true;
		window.history.go(delta);
		return true;
	}, []);
	const cancelPendingNavigation = useCallback(() => {
		pendingHistoryDelta.current = null;
		allowPendingNavigationRef.current = false;
	}, []);
	const reset = useCallback(() => {
		window.history.replaceState(
			{ zionNavigationIndex: indexRef.current },
			"",
			window.location.pathname + window.location.search,
		);
		viewRef.current = "setup";
		setView("setup");
	}, []);
	return { view, navigate, reset, continuePendingNavigation, cancelPendingNavigation };
}
