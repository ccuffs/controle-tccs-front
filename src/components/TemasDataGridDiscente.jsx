import React from "react";
import { Typography, Chip } from "@mui/material";
import CustomDataGrid from "./CustomDataGrid";

export default function TemasDataGridDiscente({ temas }) {
	// Preparar dados para o DataGrid sem agrupamento
	console.log(temas);
	const temasParaGrid = temas
		.map((tema) => ({
			...tema,
			docenteNome: tema?.Docente?.nome || "N/A",
			areaNome: tema?.AreaTcc?.descricao || "N/A",
			vagasOferta: tema?.vagasOferta || tema?.vagas || 0,
		}))
		.sort((a, b) => {
			// Primeiro ordenar por nome do docente
			const nomeA = a.docenteNome || "";
			const nomeB = b.docenteNome || "";
			if (nomeA !== nomeB) {
				return nomeA.localeCompare(nomeB);
			}

			// Se mesmo docente, ordenar por área TCC
			const areaA = a.areaNome || "";
			const areaB = b.areaNome || "";
			if (areaA !== areaB) {
				return areaA.localeCompare(areaB);
			}

			// Se mesma área, ordenar por descrição do tema
			return (a.descricao || "").localeCompare(b.descricao || "");
		});

	// Função para determinar se uma linha deve ter borda inferior
	const getRowClassName = (params) => {
		const currentDocente = params.row.docenteNome;
		console.log(params);

		// Encontrar o índice da linha atual no array temasParaGrid
		const currentIndex = temasParaGrid.findIndex(
			(tema) => tema.id === params.row.id,
		);

		// Verificar se a próxima linha tem um docente diferente
		const nextRow = temasParaGrid[currentIndex + 1];
		if (nextRow && nextRow.docenteNome !== currentDocente) {
			return "row-with-bottom-border";
		}

		return "";
	};

	const columns = [
		{
			field: "docenteNome",
			headerName: "Docente Responsável",
			width: 300,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "areaNome",
			headerName: "Área TCC",
			width: 250,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "descricao",
			headerName: "Descrição",
			width: 500,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},

		{
			field: "vagasOferta",
			headerName: "Vagas",
			width: 300,
			renderCell: (params) => {
				const vagas = params.row.vagasOferta || 0;
				if (vagas === 0) {
					return (
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{
								fontSize: "0.75rem",
								fontStyle: "italic",
								textAlign: "center",
								maxWidth: "180px",
							}}
						>
							Converse com o orientador sobre disponibilidade
						</Typography>
					);
				}

				return (
					<Chip
						label={vagas}
						color="success"
						size="small"
						sx={{
							fontWeight: "bold",
							"& .MuiChip-label": {
								fontSize: "0.875rem",
							},
						}}
					/>
				);
			},
		},
	];

	return (
		<CustomDataGrid
			rows={temasParaGrid}
			columns={columns}
			pageSize={10}
			checkboxSelection={false}
			disableSelectionOnClick
			rowSpanning
			getRowId={(row) => row.id}
			getRowClassName={getRowClassName}
			getRowHeight={() => "auto"}
			sx={{
				"& .row-with-bottom-border": {
					borderBottom: "1px solid #b5b6be !important",
				},
			}}
		/>
	);
}
