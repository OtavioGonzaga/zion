import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

export function usePwaLifecycle() {
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [offlineReady, setOfflineReady] = useState(false);
	const updateServiceWorker = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
	const registered = useRef(false);

	useEffect(() => {
		if (registered.current) return;
		registered.current = true;
		updateServiceWorker.current = registerSW({
			onNeedRefresh() {
				setUpdateAvailable(true);
			},
			onOfflineReady() {
				setOfflineReady(true);
			},
		});
	}, []);

	useEffect(() => {
		if (!offlineReady) return;
		const timer = window.setTimeout(() => setOfflineReady(false), 6000);
		return () => window.clearTimeout(timer);
	}, [offlineReady]);

	const applyUpdate = useCallback(() => {
		void updateServiceWorker.current?.(true);
	}, []);
	const dismissUpdate = useCallback(() => setUpdateAvailable(false), []);
	const dismissOfflineReady = useCallback(() => setOfflineReady(false), []);

	return { updateAvailable, offlineReady, applyUpdate, dismissUpdate, dismissOfflineReady };
}
