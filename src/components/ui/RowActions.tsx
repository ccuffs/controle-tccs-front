import { useState, type MouseEvent } from "react";
import { Menu, MenuItem } from "@mui/material";
import { ActionIconButton } from "./Button";
import { Icon } from "./Icon";

interface RowActionsProps {
	onEdit?: () => void;
	onRemove?: () => void;
	label?: string;
	removeLabel?: string;
}

/** Menu "…" de linha/cartão com Editar e Remover. */
export function RowActions({ onEdit, onRemove, label = "Abrir ações", removeLabel = "Remover" }: RowActionsProps) {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const fechar = () => setAnchor(null);
	return (
		<>
			<ActionIconButton
				className="icon-button"
				aria-label={label}
				onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
			>
				<Icon name="more_horiz" />
			</ActionIconButton>
			<Menu anchorEl={anchor} open={Boolean(anchor)} onClose={fechar}>
				{onEdit && (
					<MenuItem
						onClick={() => {
							fechar();
							onEdit();
						}}
					>
						<Icon name="edit" size={18} /> Editar
					</MenuItem>
				)}
				{onRemove && (
					<MenuItem
						className="danger-menu-item"
						onClick={() => {
							fechar();
							onRemove();
						}}
					>
						<Icon name="delete" size={18} /> {removeLabel}
					</MenuItem>
				)}
			</Menu>
		</>
	);
}
