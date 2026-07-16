import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import type { GridColDef } from "@mui/x-data-grid";

import CustomDataGrid from "../customs/CustomDataGrid";
import type { DocenteSemDisponibilidadeBanca } from "../../types/dashboard";

interface ListaDocentesSemDisponibilidadeBancaProps {
	docentes: DocenteSemDisponibilidadeBanca[];
	faseLabel?: string;
	largura?: ResponsiveStyleValue<string | number>;
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
	largura,
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

	return (
		<Card
			sx={{
				backgroundColor: theme.palette.background.default,
				height: 360,
				display: "flex",
				flexDirection: "column",
				width: largura || { xs: "100%", md: 695 },
			}}
		>
			<CardContent
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
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
					<Box sx={{ mt: 1, flexGrow: 1, overflow: "auto" }}>
						<Typography
							variant="body2"
							color="text.secondary"
							gutterBottom
						>
							Total: {docentes.length} docente
							{docentes.length !== 1 ? "s" : ""}
						</Typography>
						<CustomDataGrid
							rows={docentes}
							columns={columns}
							pageSize={5}
							checkboxSelection={false}
							disableSelectionOnClick
							rowSpanning={false}
							getRowId={(row) => row.codigo_docente}
							rowHeight={52}
							localeText={localeText}
						/>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
