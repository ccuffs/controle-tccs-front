import { Button } from "./Button";
import { ModalDialog } from "./ModalDialog";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	danger?: boolean;
	busy?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

/** Confirmação no padrão do design (ex.: remover cadastro). */
export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Confirmar",
	danger = true,
	busy = false,
	onConfirm,
	onClose,
}: ConfirmDialogProps) {
	return (
		<ModalDialog
			open={open}
			onClose={onClose}
			icon={danger ? "delete" : "help"}
			title={title}
			description={description}
			actions={
				<>
					<Button variant="secondary" onClick={onClose} disabled={busy}>
						Cancelar
					</Button>
					<Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
						{confirmLabel}
					</Button>
				</>
			}
		/>
	);
}
