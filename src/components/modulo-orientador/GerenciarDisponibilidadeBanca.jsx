import React, { forwardRef } from "react";
import {
	Box,
	Typography,
	Button,
	Alert,
	CircularProgress,
	Stack,
	Checkbox,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material";

import CustomDataGrid from "../customs/CustomDataGrid";
import FiltrosPesquisa from "../utils/FiltrosPesquisa";
import { useGerenciarDisponibilidadeBanca } from "../../hooks/useGerenciarDisponibilidadeBanca";
import disponibilidadeBancaController from "../../controllers/disponibilidade-banca-controller";

const GerenciarDisponibilidadeBanca = forwardRef((props, ref) => {
	const {
		// Estados de filtros
		cursos,
		cursoSelecionado,
		setCursoSelecionado,
		ano,
		setAno,
		semestre,
		setSemestre,
		fase,
		setFase,
		// Estados de dados
		grade,
		disponibilidades,
		bloqueados,
		rows,
		// Estados de UI
		loading,
		error,
		success,
		showConfirmDialog,
		// Funções
		calcularNumeroAlteracoes,
		handleCheckboxChange,
		handleHeaderClick,
		sincronizarDisponibilidades,
		handleConfirmNavigation,
		handleCancelNavigation,
		handleSincronizarESair,
	} = useGerenciarDisponibilidadeBanca(ref);


	// Gerar colunas dinamicamente baseadas nas datas da grade
	const generateColumns = () => {
		if (!grade || !grade.datas) return [];

		const baseColumns = [
			{
				field: "horario",
				headerName: "Horário",
				width: 120,
				sortable: false,
				headerAlign: "center",
				align: "center",
				headerClassName: "header-horario",
			},
		];

		const dataColumns = grade.datas.map((data) => ({
			field: `data_${data}`,
			headerName: disponibilidadeBancaController.formatarData(data),
			width: 165,
			sortable: false,
			headerClassName: disponibilidadeBancaController.isDataCompleta(
				data,
				grade,
				disponibilidades,
				bloqueados,
			)
				? "header-completa"
				: disponibilidadeBancaController.isDataParcial(
						data,
						grade,
						disponibilidades,
						bloqueados,
					)
					? "header-parcial"
					: "header-padrao",
			headerAlign: "center",
			renderHeader: (params) => (
				<span
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						userSelect: "none",
					}}
					onClick={(e) => {
						e.stopPropagation();
						handleHeaderClick(data);
					}}
				>
					{disponibilidadeBancaController.formatarData(data)}
				</span>
			),
			renderCell: (params) => {
				const cellData = params.value;
				if (!cellData) return null;
				const key = `${cellData.data}-${cellData.hora}`;
				const isBlocked =
					disponibilidadeBancaController.isSlotBloqueado(
						bloqueados,
						key,
					);

				if (isBlocked) {
					return (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								opacity: 0.6,
							}}
						>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								{disponibilidadeBancaController.tipoBloqueio(
									bloqueados,
									key,
								) === "indisp"
									? "Horário Indisponível"
									: "Banca de TCC"}
							</Typography>
						</Box>
					);
				}

				return (
					<Box sx={{ display: "flex", justifyContent: "center" }}>
						<Checkbox
							checked={cellData.disponivel}
							onChange={(e) =>
								handleCheckboxChange(
									cellData.data,
									cellData.hora,
									e.target.checked,
								)
							}
							disabled={loading}
							color="primary"
						/>
					</Box>
				);
			},
		}));

		return [...baseColumns, ...dataColumns];
	};

	if (loading && !grade) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="400px"
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant="h6" component="h3" gutterBottom>
				Gerenciar Disponibilidade para Bancas
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 2 }}>
					{success}
				</Alert>
			)}

			<Stack
				// direction="row"
				spacing={2}
				// alignItems="center"
				sx={{ mb: 3 }}
			>
				<FiltrosPesquisa
					cursoSelecionado={cursoSelecionado}
					setCursoSelecionado={setCursoSelecionado}
					ano={ano}
					setAno={setAno}
					semestre={semestre}
					setSemestre={setSemestre}
					fase={fase}
					setFase={setFase}
					cursos={cursos}
					habilitarCurso
					habilitarAno
					habilitarSemestre
					habilitarFase
					habilitarFiltroOrientacao={false}
					habilitarFiltroTodasFases={false}
					mostrarTodosCursos={false}
					loading={loading}
				/>
				<Button
					variant="contained"
					color="primary"
					onClick={sincronizarDisponibilidades}
					disabled={
						!cursoSelecionado ||
						!ano ||
						!semestre ||
						!fase ||
						loading
					}
					sx={{ maxWidth: 180 }}
				>
					{loading
						? "Sincronizando..."
						: `Sincronizar${calcularNumeroAlteracoes() > 0 ? ` (${calcularNumeroAlteracoes()})` : ""}`}
				</Button>
			</Stack>

			{grade && rows.length > 0 && (
				<CustomDataGrid
					rows={rows}
					columns={generateColumns()}
					pageSize={10}
					checkboxSelection={false}
					rowSpanning={false}
					disableSelectionOnClick
					getRowId={(row) => row.id}
					rowHeight={56}
					sx={{
						"& .header-padrao": {
							backgroundColor: "info.light",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							"&:hover": {
								backgroundColor: "info.dark",
							},
						},
						"& .header-completa": {
							backgroundColor: "success.main",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							position: "relative",
							"&:hover": {
								backgroundColor: "success.dark",
							},
							"&::after": {
								content: '""',
								position: "absolute",
								top: 2,
								right: 2,
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: "white",
							},
						},
						"& .header-parcial": {
							backgroundColor: "primary.main",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							position: "relative",
							"&:hover": {
								backgroundColor: "primary.dark",
							},
							"&::after": {
								content: '""',
								position: "absolute",
								top: 2,
								right: 2,
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: "orange",
							},
						},
						"& .header-horario": {
							backgroundColor: "grey.100",
							fontWeight: "bold",
							borderRight: "1px solid #e0e0e0",
						},
						"& .MuiDataGrid-cell[data-field='horario']": {
							backgroundColor: "grey.100",
							fontWeight: "bold",
							borderRight: "1px solid #e0e0e0",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						},
						"& .MuiCheckbox-root": {
							"& .MuiSvgIcon-root": {
								fontSize: "1.2rem",
							},
						},
						"& .MuiCheckbox-root.Mui-checked": {
							"& .MuiSvgIcon-root": {
								fontSize: "1.2rem",
							},
						},
						"& .MuiDataGrid-cell": {
							border: "0.5px solid #f0f0f0",
						},
						"& .MuiDataGrid-columnHeader": {
							border: "0.5px solid #f0f0f0",
						},
					}}
				/>
			)}

			{cursoSelecionado && !grade && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Nenhuma data de defesa configurada para esta oferta.
				</Alert>
			)}

			{!cursoSelecionado && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Selecione um curso para gerenciar a disponibilidade.
				</Alert>
			)}

			{cursoSelecionado && ano && semestre && fase && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Marque os horários disponíveis na grade abaixo e clique em
					"Sincronizar" para salvar suas disponibilidades.
					<br />
					<strong>Dica:</strong> Clique no título de uma data para
					selecionar/desselecionar todos os horários daquele dia.
				</Alert>
			)}

			{/* Diálogo de confirmação para navegação com mudanças não sincronizadas */}
			<Dialog
				open={showConfirmDialog}
				onClose={handleCancelNavigation}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Alterações não sincronizadas</DialogTitle>
				<DialogContent>
					<Typography>
						Você tem {calcularNumeroAlteracoes()} alteração(ões) não
						sincronizada(s) na sua disponibilidade para bancas.
					</Typography>
					<Typography sx={{ mt: 2 }}>O que deseja fazer?</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelNavigation} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={handleConfirmNavigation}
						color="error"
						variant="outlined"
					>
						Sair sem sincronizar
					</Button>
					<Button
						onClick={handleSincronizarESair}
						color="primary"
						variant="contained"
						disabled={loading}
					>
						{loading ? "Sincronizando..." : "Sincronizar e sair"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
});

GerenciarDisponibilidadeBanca.displayName = "GerenciarDisponibilidadeBanca";

export default GerenciarDisponibilidadeBanca;
