import React from "react";
import { Button, Stack, Typography, Chip } from "@mui/material";

import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import { usePermissions } from "../hooks/usePermissions";
import { useTemasDataGrid } from "../hooks/useTemasDataGrid.js";

import CustomDataGrid from "./customs/CustomDataGrid.jsx";

export default function TemasDataGrid({
	temas,
	onOpenVagasModal,
	onToggleAtivo,
	onDelete,
	isDiscenteView = false,
	isOrientadorView = false,
}) {
	const { hasPermission } = usePermissions();
	const { temasParaGrid, getRowClassName } = useTemasDataGrid({
		temas,
		isOrientadorView,
	});

	const columns = [
		{
			field: "docenteNome",
			headerName: "Docente Responsável",
			width: isDiscenteView ? 300 : 250,
			renderCell: (params) => (
				<div
					style={{
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.4",
						width: "100%",
						height: "auto",
						minHeight: "auto",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "areaNome",
			headerName: "Área TCC",
			width: isDiscenteView ? 250 : 200,
			renderCell: (params) => (
				<div
					style={{
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.4",
						width: "100%",
						height: "auto",
						minHeight: "auto",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "descricao",
			headerName: "Descrição",
			width: isDiscenteView ? 500 : 250,
			renderCell: (params) => (
				<div
					style={{
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.4",
						width: "100%",
						height: "auto",
						minHeight: "auto",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "ativo",
			headerName: "Status",
			width: 120,
			rowSpanValueGetter: () => null,
			renderCell: (params) => (
				<Chip
					label={params.row.ativo ? "Ativo" : "Inativo"}
					color={params.row.ativo ? "success" : "default"}
					size="small"
					variant="outlined"
				/>
			),
		},
		{
			field: "vagasOferta",
			headerName: "Vagas",
			width: isDiscenteView ? 300 : 200,
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
		{
			field: "actions",
			headerName: "Ações",
			sortable: false,
			width: 280,
			renderCell: (params) => (
				<PermissionContext
					grupos={[
						Permissoes.GRUPOS.ADMIN,
						Permissoes.GRUPOS.PROFESSOR,
						Permissoes.GRUPOS.ORIENTADOR,
					]}
					showError={false}
				>
					<Stack direction="row" spacing={1}>
						<Button
							size="small"
							variant="outlined"
							color="primary"
							onClick={() => onOpenVagasModal(params.row)}
						>
							Vagas
						</Button>
						<Button
							size="small"
							variant={
								params.row.ativo ? "outlined" : "contained"
							}
							color={params.row.ativo ? "success" : "warning"}
							onClick={() => onToggleAtivo(params.row)}
						>
							{params.row.ativo ? "Ativo" : "Inativo"}
						</Button>
						<Button
							size="small"
							color="secondary"
							onClick={() => onDelete(params.row)}
						>
							Remover
						</Button>
					</Stack>
				</PermissionContext>
			),
		},
	];

	// Criar modelo de visibilidade das colunas baseado nas permissões e modo de visualização
	const columnVisibilityModel = {
		docenteNome: !isOrientadorView, // Ocultar coluna docente no modo orientador
		ativo: !isDiscenteView,
		actions:
			!isDiscenteView &&
			hasPermission([
				Permissoes.GRUPOS.ADMIN,
				Permissoes.GRUPOS.PROFESSOR,
				Permissoes.GRUPOS.ORIENTADOR,
			]),
	};

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
			columnVisibilityModel={columnVisibilityModel}
			sx={{
				"& .row-with-bottom-border": {
					borderBottom: "1px solid #b5b6be !important",
				},
				"& .MuiDataGrid-cell": {
					display: "flex",
					alignItems: "flex-start",
					lineHeight: "1.4",
					paddingTop: "12px",
					paddingBottom: "12px",
					minHeight: "auto",
					height: "auto",
					overflow: "visible",
				},
				"& .MuiDataGrid-cellContent": {
					whiteSpace: "normal",
					wordWrap: "break-word",
					overflow: "visible",
					width: "100%",
					minHeight: "auto",
				},
				"& .MuiDataGrid-row": {
					minHeight: "auto !important",
					height: "auto !important",
				},
				"& .MuiDataGrid-renderingZone": {
					"& .MuiDataGrid-row": {
						minHeight: "auto !important",
						height: "auto !important",
					},
				},
			}}
		/>
	);
}
