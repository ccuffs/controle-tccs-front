import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";

import CustomDataGrid from "../customs/CustomDataGrid";

export default function ListaDocentesSemDisponibilidadeBanca({
	docentes,
	faseLabel,
	largura,
}) {
	const theme = useTheme();

	const columns = [
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
							localeText={{
								noRowsLabel:
									"Nenhum docente pendente encontrado",
								loadingOverlay: "Carregando...",
							}}
						/>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
