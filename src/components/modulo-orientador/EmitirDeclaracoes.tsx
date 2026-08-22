import { Box, Typography, Button, Alert, Snackbar, Chip, Divider, Stack } from "@mui/material";
import { OpenInNew, TableRows } from "@mui/icons-material";
import type { GridColDef } from "@mui/x-data-grid";

import CustomDataGrid from "../customs/CustomDataGrid";
import FiltrosPesquisa from "../utils/FiltrosPesquisa";
import { useEmitirDeclaracoes } from "../../hooks/useEmitirDeclaracoes";
import declaracoesController from "../../controllers/declaracoes-controller";
import type { Declaracao } from "../../types/declaracao";

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
		gerandoTabela,
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,
		// Handlers
		handleBaixarDeclaracao,
		handleBaixarDeclaracaoExterno,
		handleBaixarDeclaracaoTabela,
		handleCloseSnackbar,
	} = useEmitirDeclaracoes();

	const columnsExternas: GridColDef<Declaracao>[] = [
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
			valueGetter: (_value, row) =>
				declaracoesController.formatarNomeProprio(row.nome_dicente),
		},
		{
			field: "titulo_tcc",
			headerName: "Título do TCC",
			width: 260,
			flex: 2,
			valueGetter: (_value, row) =>
				declaracoesController.formatarNomeProprio(row.titulo_tcc),
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

	const columns: GridColDef<Declaracao>[] = [
		{
			field: "nome_dicente",
			headerName: "Nome do Discente",
			width: 250,
			flex: 1,
			valueGetter: (_value, row) =>
				declaracoesController.formatarNomeProprio(row.nome_dicente),
		},
		{
			field: "titulo_tcc",
			headerName: "Título do TCC",
			width: 300,
			flex: 2,
			valueGetter: (_value, row) =>
				declaracoesController.formatarNomeProprio(row.titulo_tcc),
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
				participou como orientador ou membro de banca. A emissão
				individual e a consolidada em tabela estão disponíveis apenas
				para estudantes já avaliados em banca.
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
					habilitarFiltroOrientacao={false}
					habilitarFiltroProjeto={true}
					habilitarFiltroTcc={true}
					loading={loading}
					anosDisponiveis={anosDisponiveis}
					semestresDisponiveis={semestresDisponiveis}
				/>
			</Box>

		{cursoSelecionado ? (
			<Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
				<Box>
					<Typography variant="subtitle1" gutterBottom>
						Declaração consolidada (tabela)
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
						Gera um único documento com todos os estudantes já avaliados em
						banca, conforme os filtros selecionados. Disponível para
						participações como orientador ou como membro de banca.
					</Typography>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
						<Button
							variant="outlined"
							color="primary"
							startIcon={<TableRows />}
							disabled={loading || gerandoTabela}
							onClick={() => handleBaixarDeclaracaoTabela("orientacao")}
						>
							Tabela — Orientações
						</Button>
						<Button
							variant="outlined"
							color="secondary"
							startIcon={<TableRows />}
							disabled={loading || gerandoTabela}
							onClick={() => handleBaixarDeclaracaoTabela("banca")}
						>
							Tabela — Bancas
						</Button>
					</Stack>
				</Box>

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
							`${row.id_tcc}_${row.tipo_participacao}_${row.fase}`
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
				autoHideDuration={4000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbarSeverity}
					sx={{ width: "100%" }}
				>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</Box>
	);
}
