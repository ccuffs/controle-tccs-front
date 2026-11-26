import { Icon as MuiIcon } from "@mui/material";

/** Ícone Material Symbols Rounded (nome do símbolo, ex.: "space_dashboard"). */
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
	return (
		<MuiIcon baseClassName="material-symbols-rounded" sx={{ fontSize: size }} aria-hidden="true">
			{name}
		</MuiIcon>
	);
}
