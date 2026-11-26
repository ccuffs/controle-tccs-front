import type { ReactNode } from "react";
import { Drawer } from "@mui/material";
import { ActionIconButton } from "./Button";
import { Icon } from "./Icon";

interface SideDrawerProps {
	open: boolean;
	onClose: () => void;
	eyebrow?: string;
	title: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	/** Classe extra do painel (ex.: "defense-drawer", "attention-drawer"). */
	className?: string;
	footerClassName?: string;
}

/** Painel lateral direito do design (cadastros, detalhes de defesa, "Requer atenção"). */
export function SideDrawer({ open, onClose, eyebrow, title, children, footer, className = "", footerClassName = "" }: SideDrawerProps) {
	return (
		<Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { className: `drawer ${className}` } }}>
			<div className="drawer-head">
				<div>
					{eyebrow && <span className="eyebrow">{eyebrow}</span>}
					<h2>{title}</h2>
				</div>
				<ActionIconButton className="icon-button" onClick={onClose} aria-label="Fechar">
					<Icon name="close" />
				</ActionIconButton>
			</div>
			<div className="drawer-body">{children}</div>
			{footer && <div className={`drawer-footer ${footerClassName}`}>{footer}</div>}
		</Drawer>
	);
}
