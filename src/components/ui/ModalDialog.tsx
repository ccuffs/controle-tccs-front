import type { ReactNode } from "react";
import { Dialog } from "@mui/material";
import { Icon } from "./Icon";

interface ModalDialogProps {
	open: boolean;
	onClose: () => void;
	icon?: string;
	/** Conteúdo acima do título (ex.: chips de status). */
	header?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	children?: ReactNode;
	actions?: ReactNode;
}

/** Diálogo do design: ícone, título, descrição, conteúdo e ações à direita. */
export function ModalDialog({ open, onClose, icon, header, title, description, children, actions }: ModalDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { className: "modal" } }}>
			{icon && (
				<div className="modal-icon">
					<Icon name={icon} />
				</div>
			)}
			{header}
			<h2>{title}</h2>
			{description &&
				(typeof description === "string" ? (
					<p>{description}</p>
				) : (
					// Conteúdo com elementos (ex.: chips) não pode ficar dentro de <p>.
					<div style={{ color: "var(--muted)", fontSize: 12, marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
						{description}
					</div>
				))}
			{children}
			{actions && <div className="modal-actions">{actions}</div>}
		</Dialog>
	);
}
