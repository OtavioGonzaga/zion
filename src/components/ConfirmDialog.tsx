import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

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
	return (
		<Dialog
			open={open}
			onClose={onCancel}
			aria-labelledby="confirm-dialog-title"
			aria-describedby="confirm-dialog-description"
			slotProps={{
				paper: {
					sx: {
						backgroundColor: "var(--color-surface)",
						backgroundImage: "none",
						color: "var(--color-text)",
						border: "1px solid var(--color-border)",
					},
				},
			}}
		>
			<DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
			<DialogContent>
				<DialogContentText
					id="confirm-dialog-description"
					sx={{ color: "var(--color-text-muted)" }}
				>
					{message}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<button className="button" type="button" onClick={onCancel}>
					Cancelar
				</button>
				<button
					className={`button${destructive ? " button-danger" : " button-primary"}`}
					type="button"
					onClick={onConfirm}
					autoFocus
				>
					{confirmLabel}
				</button>
			</DialogActions>
		</Dialog>
	);
}
