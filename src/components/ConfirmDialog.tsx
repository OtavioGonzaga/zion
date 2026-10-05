import { useEffect, useId, useRef } from "react";

export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = "Confirmar",
	destructive = false,
	onCancel,
	onConfirm,
}: {
	open: boolean;
	title: string;
	message: string;
	confirmLabel?: string;
	destructive?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	return (
		<dialog
			className="confirm-dialog"
			ref={dialogRef}
			aria-labelledby={titleId}
			aria-describedby={descriptionId}
			onCancel={(event) => {
				event.preventDefault();
				onCancel();
			}}
		>
			<h2 id={titleId}>{title}</h2>
			<p id={descriptionId}>{message}</p>
			<div className="confirm-dialog-actions">
				<button className="button" type="button" onClick={onCancel} autoFocus={destructive}>
					Cancelar
				</button>
				<button
					className={`button${destructive ? " button-danger" : " button-primary"}`}
					type="button"
					onClick={onConfirm}
					autoFocus={!destructive}
				>
					{confirmLabel}
				</button>
			</div>
		</dialog>
	);
}
