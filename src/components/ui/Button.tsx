import type { ComponentProps, ReactNode } from "react";
import { Button as MuiButton, IconButton as MuiIconButton } from "@mui/material";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";

interface ButtonProps {
	children: ReactNode;
	variant?: ButtonVariant;
	icon?: string;
	onClick?: () => void;
	className?: string;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	title?: string;
}

/** Botão do design: primary (contained), secondary (outlined), tertiary (texto) e danger. */
export function Button({
	children,
	variant = "primary",
	icon,
	onClick,
	className = "",
	disabled = false,
	type = "button",
	title,
}: ButtonProps) {
	const muiVariant = variant === "tertiary" ? "text" : variant === "secondary" ? "outlined" : "contained";
	return (
		<MuiButton
			disableElevation
			type={type}
			title={title}
			variant={muiVariant}
			color={variant === "danger" ? "error" : "primary"}
			className={`button ${variant} ${className}`}
			onClick={onClick}
			disabled={disabled}
			startIcon={icon ? <Icon name={icon} size={18} /> : undefined}
		>
			{children}
		</MuiButton>
	);
}

/** Botão de ícone pequeno (classe `icon-button` para o estilo do design). */
export function ActionIconButton({ children, ...props }: ComponentProps<typeof MuiIconButton>) {
	return (
		<MuiIconButton {...props} size="small">
			{children}
		</MuiIconButton>
	);
}

/** Botão sem aparência própria: o visual vem das classes CSS do design. */
export function PlainButton({ children, sx, ...props }: ComponentProps<typeof MuiButton>) {
	return (
		<MuiButton {...props} disableRipple sx={{ minWidth: 0, padding: 0, textTransform: "none", ...sx }}>
			{children}
		</MuiButton>
	);
}
