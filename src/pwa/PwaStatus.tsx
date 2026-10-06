import { Download, RefreshCw, Wifi, X } from "lucide-react";

export function PwaStatus({
	updateAvailable,
	offlineReady,
	editDirty,
	onApplyUpdate,
	onDismissUpdate,
	onDismissOfflineReady,
}: {
	updateAvailable: boolean;
	offlineReady: boolean;
	editDirty: boolean;
	onApplyUpdate: () => void;
	onDismissUpdate: () => void;
	onDismissOfflineReady: () => void;
}) {
	if (updateAvailable) {
		return (
			<aside className="pwa-notice" role="status" aria-live="polite">
				<div className="pwa-notice-copy">
					<RefreshCw size={19} aria-hidden="true" />
					<div>
						<strong>Nova versão do Zion disponível.</strong>
						{editDirty && (
							<p>Você possui alterações não salvas. Salve ou descarte-as antes de atualizar.</p>
						)}
					</div>
				</div>
				<div className="pwa-notice-actions">
					<button className="button" type="button" onClick={onDismissUpdate}>
						Depois
					</button>
					<button
						className="button button-primary"
						type="button"
						disabled={editDirty}
						onClick={onApplyUpdate}
					>
						<Download size={16} aria-hidden="true" /> Atualizar
					</button>
				</div>
			</aside>
		);
	}

	if (offlineReady) {
		return (
			<aside className="pwa-notice pwa-offline-notice" role="status" aria-live="polite">
				<Wifi size={18} aria-hidden="true" />
				<span>Zion está pronto para uso offline.</span>
				<button type="button" aria-label="Fechar aviso offline" onClick={onDismissOfflineReady}>
					<X size={18} aria-hidden="true" />
				</button>
			</aside>
		);
	}

	return null;
}
