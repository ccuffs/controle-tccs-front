import type { ReactNode } from "react";
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
	/** Conteúdo extra entre a descrição e as ações (ex.: opções, aviso de erro). */
	children?: ReactNode;
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
	children,
}: ConfirmDialogProps) {
	return (
		<ModalDialog
			open={open}
			onClose={onClose}
			icon={danger ? "delete" : "help"}
			title={title}
			description={description}
			children={children}
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
