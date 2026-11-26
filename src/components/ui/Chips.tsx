import type { ReactNode } from "react";
import { Chip } from "@mui/material";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

/** Chip de fase: "Projeto (TCC I)" ou "TCC (TCC II)". Aceita `fase` (1/2) ou `final`. */
export function PhaseChip({ final, fase }: { final?: boolean; fase?: number }) {
	const ehFinal = final ?? fase === 2;
	return (
		<Chip
			size="small"
			className={`chip ${ehFinal ? "phase-final" : "phase-project"}`}
			label={ehFinal ? "TCC (TCC II)" : "Projeto (TCC I)"}
		/>
	);
}

export function StatusChip({ type, children }: { type: StatusTone; children: ReactNode }) {
	return <Chip size="small" className={`chip ${type}`} label={children} />;
}
