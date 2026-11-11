import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import CustomDataGrid from "../customs/CustomDataGrid";
import type { EstudanteSemConviteBanca } from "../../types/dashboard";

interface ListaEstudantesSemConviteBancaProps {
	estudantes: EstudanteSemConviteBanca[];
	faseLabel?: string;
	/** Altura da área de conteúdo em px — deve corresponder a alturaDocentes/alturaDefesas
	 *  para que o card fique com a mesma altura dos gráficos de barras. */
	alturaConteudo?: number;
}

// `loadingOverlay` não existe em `GridLocaleText` (sem efeito na grade),
// mantido apenas por paridade com a configuração original.
const localeText = {
	noRowsLabel: "Nenhum estudante pendente encontrado",
	loadingOverlay: "Carregando...",
};

export default function ListaEstudantesSemConviteBanca({
	estudantes,
	faseLabel,
	alturaConteudo,
}: ListaEstudantesSemConviteBancaProps) {
	const theme = useTheme();

	const columns: GridColDef<EstudanteSemConviteBanca>[] = [
		{
			field: "nome",
			headerName: "Estudante",
			flex: 1,
			minWidth: 160,
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
			field: "matricula",
			headerName: "Matrícula",
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
		{
			field: "nomeCurso",
			headerName: "Curso",
			width: 140,
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
			field: "faseLabel",
			headerName: "Fase",
			width: 90,
			renderCell: (params) => (
				<div style={{ display: "flex", alignItems: "center" }}>
					<Chip
						label={params.value}
						size="small"
						color={params.value === "Projeto" ? "info" : "primary"}
						variant="outlined"
					/>
				</div>
			),
		},
	];

	const titulo = `Estudantes sem convite de banca${faseLabel ? ` ${faseLabel}` : ""}`;
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

				{(estudantes || []).length === 0 ? (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Todos os estudantes já enviaram convites para a banca
					</Typography>
			) : (
					<Box sx={{ mt: 1 }}>
						<Typography
							variant="body2"
							color="text.secondary"
							gutterBottom
						>
							Total: {estudantes.length} estudante
							{estudantes.length !== 1 ? "s" : ""}
						</Typography>
						<Box sx={{ height: alturaDataGrid }}>
							<CustomDataGrid
								rows={estudantes}
								columns={columns}
								autoPageSize
								checkboxSelection={false}
								disableSelectionOnClick
								rowSpanning={false}
								getRowId={(row) => `${row.id_tcc}`}
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
