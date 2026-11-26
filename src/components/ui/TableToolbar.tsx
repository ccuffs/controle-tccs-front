import type { ReactNode } from "react";
import { Button, PlainButton } from "./Button";
import { Surface } from "./Card";
import { Input } from "./fields";
import { Icon } from "./Icon";

interface TableToolbarProps {
	search?: string;
	onSearchChange?: (valor: string) => void;
	searchPlaceholder?: string;
	/** Controles extras sempre visíveis (ex.: Select de curso). */
	children?: ReactNode;
	/** Botão "Filtros": quantidade de filtros ativos e estado aberto/fechado. */
	filterCount?: number;
	filtersOpen?: boolean;
	onToggleFilters?: () => void;
}

/** Barra fechada do padrão de filtros: busca + controles + botão "Filtros". */
export function TableToolbar({
	search,
	onSearchChange,
	searchPlaceholder = "Buscar",
	children,
	filterCount,
	filtersOpen = false,
	onToggleFilters,
}: TableToolbarProps) {
	return (
		<Surface className="table-toolbar card">
			{onSearchChange && (
				<div className="search">
					<Icon name="search" />
					<Input
						value={search ?? ""}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder={searchPlaceholder}
					/>
				</div>
			)}
			{children}
			{onToggleFilters && (
				<PlainButton
					className={`filter-button ${filtersOpen ? "active" : ""}`}
					onClick={onToggleFilters}
					aria-expanded={filtersOpen}
				>
					<Icon name="filter_list" /> Filtros <span>{filterCount ?? 0}</span>
				</PlainButton>
			)}
		</Surface>
	);
}

interface AdvancedFiltersProps {
	children: ReactNode;
	resultCount?: number;
	onClear?: () => void;
}

/** Cartão aberto pelo botão "Filtros": filtros extras, contagem de resultados e "Limpar filtros". */
export function AdvancedFilters({ children, resultCount, onClear }: AdvancedFiltersProps) {
	return (
		<Surface className="advanced-filters card">
			{children}
			{resultCount !== undefined && (
				<div className="active-filter-summary">
					<Icon name="filter_alt" size={17} />
					<span>
						{resultCount} {resultCount === 1 ? "resultado encontrado" : "resultados encontrados"}
					</span>
				</div>
			)}
			{onClear && (
				<Button variant="tertiary" onClick={onClear}>
					Limpar filtros
				</Button>
			)}
		</Surface>
	);
}
