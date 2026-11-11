import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import CustomDataGrid from "../customs/CustomDataGrid";
import type { DocenteSemDisponibilidadeBanca } from "../../types/dashboard";

interface ListaDocentesSemDisponibilidadeBancaProps {
	docentes: DocenteSemDisponibilidadeBanca[];
	faseLabel?: string;
	/** Altura da área de conteúdo em px — deve corresponder a alturaDocentes/alturaDefesas
	 *  para que o card fique com a mesma altura dos gráficos de barras. */
	alturaConteudo?: number;
}

// `loadingOverlay` não existe em `GridLocaleText` (sem efeito na grade),
// mantido apenas por paridade com a configuração original.
const localeText = {
	noRowsLabel: "Nenhum docente pendente encontrado",
	loadingOverlay: "Carregando...",
};

export default function ListaDocentesSemDisponibilidadeBanca({
	docentes,
	faseLabel,
	alturaConteudo,
}: ListaDocentesSemDisponibilidadeBancaProps) {
	const theme = useTheme();

	const columns: GridColDef<DocenteSemDisponibilidadeBanca>[] = [
		{
			field: "nome",
			headerName: "Docente",
			flex: 1,
			minWidth: 200,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: 1.2,
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "codigo_docente",
			headerName: "Código",
			width: 120,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "nowrap",
					}}
				>
					{params.value}
				</div>
			),
		},
	];

	const titulo = `Docentes sem disponibilidade de banca${faseLabel ? ` ${faseLabel}` : ""}`;
	// Altura total do card = área de conteúdo + overhead de título + padding (≈68 px)
	const alturaCard = Math.max(400, alturaConteudo ?? 0) + 68;
	// Altura disponível para o DataGrid:
	// alturaCard − padding CardContent (32) − título+margin (30) − Box mt (8) − texto "Total"+margin (28) − margem de segurança (4)
	const alturaDataGrid = Math.max(260, alturaCard - 102);

	return (
		<Card
			sx={{
				backgroundColor: theme.palette.background.default,
				height: alturaCard,
				display: "flex",
				flexDirection: "column",
				width: "100%",
			}}
		>
			<CardContent
				sx={{
					display: "flex",
					flexDirection: "column",
					flexGrow: 1,
					padding: "16px",
					"&:last-child": { paddingBottom: "16px" },
				}}
			>
				<Typography variant="subtitle1" gutterBottom>
					{titulo}
				</Typography>

				{(docentes || []).length === 0 ? (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Todos os docentes já informaram disponibilidade de banca
					</Typography>
			) : (
					<Box sx={{ mt: 1 }}>
						<Typography
							variant="body2"
							color="text.secondary"
							gutterBottom
						>
							Total: {docentes.length} docente
							{docentes.length !== 1 ? "s" : ""}
						</Typography>
						<Box sx={{ height: alturaDataGrid }}>
							<CustomDataGrid
								rows={docentes}
								columns={columns}
								autoPageSize
								checkboxSelection={false}
								disableSelectionOnClick
								rowSpanning={false}
								getRowId={(row) => row.codigo_docente}
								rowHeight={44}
								localeText={localeText}
							/>
						</Box>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
