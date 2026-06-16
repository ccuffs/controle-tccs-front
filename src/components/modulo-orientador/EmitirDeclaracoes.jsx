import React from "react";
import { Box, Typography, Button, Alert, Snackbar, Chip, Divider } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";

import CustomDataGrid from "../customs/CustomDataGrid";
import FiltrosPesquisa from "../utils/FiltrosPesquisa";
import { useEmitirDeclaracoes } from "../../hooks/useEmitirDeclaracoes";
import declaracoesController from "../../controllers/declaracoes-controller";

export default function EmitirDeclaracoes() {
	const {
		// Estados de dados
		declaracoes,
		declaracoesExternas,
		cursos,
		// Estados de filtros
		cursoSelecionado,
		setCursoSelecionado,
		ano,
		setAno,
		semestre,
		setSemestre,
		fase,
		setFase,
		anosDisponiveis,
		semestresDisponiveis,
		// Estados de UI
		loading,
		snackbarOpen,
		snackbarMessage,
		// Handlers
		handleBaixarDeclaracao,
		handleBaixarDeclaracaoExterno,
		handleCloseSnackbar,
	} = useEmitirDeclaracoes();

	const columnsExternas = [
		{
			field: "nome_docente",
			headerName: "Membro Externo",
			width: 220,
			flex: 1,
			renderCell: (params) => (
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{params.value}
					<Chip label="Externo" size="small" color="warning" variant="outlined" />
				</Box>
			),
		},
		{
			field: "instituicao",
			headerName: "Instituição",
			width: 160,
		},
		{
			field: "nome_dicente",
			headerName: "Discente",
			width: 200,
			flex: 1,
		},
		{
			field: "titulo_tcc",
			headerName: "Título do TCC",
			width: 260,
			flex: 2,
		},
		{
			field: "periodo",
			headerName: "Período",
			width: 110,
			renderCell: (params) =>
				declaracoesController.formatarPeriodo(params.row.ano, params.row.semestre),
		},
		{
			field: "acoes",
			headerName: "Ações",
			width: 160,
			sortable: false,
			renderCell: (params) => (
			<Button
				variant="contained"
				color="warning"
				size="small"
				startIcon={<OpenInNew />}
				onClick={() => handleBaixarDeclaracaoExterno(params.row)}
				sx={{ fontSize: "0.75rem" }}
			>
				Ver Declaração
			</Button>
			),
		},
	];

	const columns = [
		{
			field: "nome_dicente",
			headerName: "Nome do Discente",
			width: 250,
			flex: 1,
		},
		{
			field: "titulo_tcc",
			headerName: "Título do TCC",
			width: 300,
			flex: 2,
		},
		{
			field: "periodo",
			headerName: "Período",
			width: 120,
			renderCell: (params) => {
				return declaracoesController.formatarPeriodo(
					params.row.ano,
					params.row.semestre,
				);
			},
		},
		{
			field: "fase_descricao",
			headerName: "Fase",
			width: 100,
			renderCell: (params) => {
				return declaracoesController.obterDescricaoFase(
					params.row.fase,
				);
			},
		},
		{
			field: "tipo_participacao",
			headerName: "Participação",
			width: 120,
			renderCell: (params) => {
				return declaracoesController.obterTextoParticipacao(
					params.row.foi_orientador,
				);
			},
		},
		{
			field: "acoes",
			headerName: "Ações",
			width: 150,
			sortable: false,
			renderCell: (params) => {
				return (
				<Button
					variant="contained"
					color="primary"
					size="small"
					startIcon={<OpenInNew />}
					onClick={() => handleBaixarDeclaracao(params.row)}
					sx={{ fontSize: "0.75rem" }}
				>
					Ver Declaração
				</Button>
				);
			},
		},
	];

	return (
		<Box>
			<Typography variant="h5" component="h2" gutterBottom>
				Emitir Declarações
			</Typography>

			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				Aqui você pode baixar declarações dos trabalhos em que
				participou como orientador ou membro de banca.
			</Typography>

			<Box sx={{ mb: 3 }}>
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
					habilitarCurso={true}
					habilitarAno={true}
					habilitarSemestre={true}
					habilitarFase={true}
					mostrarTodosCursos={true}
					habilitarFiltroTodasFases={true}
					habilitarFiltroOrientacao={true}
					habilitarFiltroProjeto={true}
					habilitarFiltroTcc={true}
					loading={loading}
					anosDisponiveis={anosDisponiveis}
					semestresDisponiveis={semestresDisponiveis}
				/>
			</Box>

		{cursoSelecionado ? (
			<Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
				{/* Grid principal — declarações do próprio docente */}
				<Box sx={{ height: 500, width: "100%", overflow: "hidden" }}>
					<CustomDataGrid
						rows={declaracoes}
						columns={columns}
						pageSize={10}
						loading={loading}
						checkboxSelection={false}
						disableSelectionOnClick={true}
						getRowId={(row) =>
							`${row.id_tcc}_${row.tipo_participacao}`
						}
					/>
				</Box>

				{/* Grid de membros externos — separado do principal */}
				{declaracoesExternas.length > 0 && (
					<Box>
						<Divider sx={{ mb: 2 }} />
						<Typography variant="h6" gutterBottom>
							Declarações para Membros Externos
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Declarações que você pode emitir em nome de docentes externos convidados
							para as bancas dos seus TCCs orientados.
						</Typography>
						<Box sx={{ height: 400, width: "100%", overflow: "hidden" }}>
							<CustomDataGrid
								rows={declaracoesExternas}
								columns={columnsExternas}
								pageSize={5}
								loading={loading}
								checkboxSelection={false}
								disableSelectionOnClick={true}
								getRowId={(row) =>
									`ext_${row.id_tcc}_${row.codigo_docente}_${row.fase}`
								}
							/>
						</Box>
					</Box>
				)}
			</Box>
		) : (
				<Box
					sx={{
						height: 400,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						border: "2px dashed",
						borderColor: "grey.300",
						borderRadius: 2,
						backgroundColor: "grey.50",
					}}
				>
					<Typography variant="h6" color="text.secondary">
						Selecione um curso para visualizar as declarações
						disponíveis
					</Typography>
				</Box>
			)}

			<Snackbar
				open={snackbarOpen}
				autoHideDuration={3000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity="success"
					sx={{ width: "100%" }}
				>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</Box>
	);
}
