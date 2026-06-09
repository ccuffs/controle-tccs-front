import React from "react";
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Card,
	CardContent,
	Chip,
	Typography,
} from "@mui/material";

import CustomDataGrid from "../customs/CustomDataGrid";

export default function ListaEstudantesSemConviteBanca({
	estudantes,
	faseLabel,
	largura,
}) {
	const theme = useTheme();

	const columns = [
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

				{(estudantes || []).length === 0 ? (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Todos os estudantes já enviaram convites para a banca
					</Typography>
				) : (
					<Box sx={{ mt: 1, flexGrow: 1, overflow: "auto" }}>
						<Typography
							variant="body2"
							color="text.secondary"
							gutterBottom
						>
							Total: {estudantes.length} estudante
							{estudantes.length !== 1 ? "s" : ""}
						</Typography>
						<CustomDataGrid
							rows={estudantes}
							columns={columns}
							pageSize={5}
							checkboxSelection={false}
							disableSelectionOnClick
							rowSpanning={false}
							getRowId={(row) => `${row.id_tcc}`}
							rowHeight={52}
							localeText={{
								noRowsLabel:
									"Nenhum estudante pendente encontrado",
								loadingOverlay: "Carregando...",
							}}
						/>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
