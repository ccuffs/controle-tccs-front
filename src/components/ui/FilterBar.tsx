import type { ReactNode } from "react";
import { PlainButton } from "./Button";
import { Surface } from "./Card";

/** Barra de filtros rotulados (Curso, Ano, Semestre, Fase…) com "Limpar". */
export function FilterBar({ children, onClear }: { children: ReactNode; onClear?: () => void }) {
	return (
		<Surface className="filters card">
			{children}
			{onClear && (
				<PlainButton className="clear-filter" onClick={onClear}>
					Limpar
				</PlainButton>
			)}
		</Surface>
	);
}

/** Campo rotulado dentro de FilterBar, AdvancedFilters ou formulários. */
export function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
	return (
		<label className={className}>
			<span>{label}</span>
			{children}
		</label>
	);
}
