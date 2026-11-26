import type { ReactNode } from "react";
import { Pagination, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { Button } from "./Button";
import { Card } from "./Card";
import { Icon } from "./Icon";

export interface DataTableColumn<T> {
	key: string;
	header: ReactNode;
	render: (row: T) => ReactNode;
	className?: string;
	/** Cabeçalho apenas para leitores de tela (ex.: coluna de ações). */
	srOnlyHeader?: boolean;
}

interface DataTableProps<T> {
	columns: DataTableColumn<T>[];
	rows: T[];
	getRowKey: (row: T) => string | number;
	/** Total de registros (paginação no servidor); padrão = rows.length. */
	total?: number;
	page?: number;
	pageSize?: number;
	onPageChange?: (page: number) => void;
	tableClassName?: string;
	title?: ReactNode;
	loading?: boolean;
	onClearFilters?: () => void;
}

/** Tabela do design: cabeçalho, linhas, estado "sem resultados" e paginação. Sem checkboxes. */
export function DataTable<T>({
	columns,
	rows,
	getRowKey,
	total,
	page = 1,
	pageSize = 10,
	onPageChange,
	tableClassName,
	title,
	loading = false,
	onClearFilters,
}: DataTableProps<T>) {
	const totalRegistros = total ?? rows.length;
	return (
		<Card className="card table-card">
			{title && <div className="table-section-title">{title}</div>}
			<div className="table-scroll">
				<Table className={tableClassName}>
					<TableHead>
						<TableRow>
							{columns.map((coluna) => (
								<TableCell key={coluna.key}>
									{coluna.srOnlyHeader ? <span className="sr-only">{coluna.header}</span> : coluna.header}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={getRowKey(row)}>
								{columns.map((coluna) => (
									<TableCell key={coluna.key} className={coluna.className}>
										{coluna.render(row)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{!loading && rows.length === 0 && (
				<div className="table-no-results">
					<Icon name="search_off" size={30} />
					<strong>Nenhum resultado encontrado</strong>
					<span>Tente alterar a busca ou limpar os filtros aplicados.</span>
					{onClearFilters && (
						<Button variant="tertiary" onClick={onClearFilters}>
							Limpar filtros
						</Button>
					)}
				</div>
			)}
			<div className="pagination">
				<span>
					{totalRegistros} {totalRegistros === 1 ? "resultado" : "resultados"}
				</span>
				<Pagination
					count={Math.max(1, Math.ceil(totalRegistros / pageSize))}
					page={page}
					onChange={(_, novaPagina) => onPageChange?.(novaPagina)}
					size="small"
					color="primary"
				/>
			</div>
		</Card>
	);
}
