import type { ElementType, ReactNode } from "react";
import { Paper, type PaperProps } from "@mui/material";

type SurfaceProps = Omit<PaperProps, "component"> & { component?: ElementType; children?: ReactNode };

/** Cartão (`<article>`) sem sombra do MUI; use `className="card ..."` para o visual do design. */
export function Card({ children, ...props }: Omit<SurfaceProps, "component">) {
	return (
		<Paper component="article" elevation={0} {...props}>
			{children}
		</Paper>
	);
}

/** Superfície genérica (padrão `<div>`), para barras de filtro, seções etc. */
export function Surface({ children, component = "div", ...props }: SurfaceProps) {
	return (
		<Paper component={component} elevation={0} {...props}>
			{children}
		</Paper>
	);
}
