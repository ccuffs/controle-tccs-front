import React from "react";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Snackbar,
	Stack,
	Typography,
	Chip,
} from "@mui/material";

import PermissionContext from "../../contexts/PermissionContext";
import { Permissoes } from "../../enums/permissoes";

import CustomDataGrid from "../customs/CustomDataGrid";
import FiltrosPesquisa from "../utils/FiltrosPesquisa";
import { useConvitesRecebidosOrientador } from "../../hooks/useConvitesRecebidosOrientador";

export default function ConvitesRecebidosOrientador() {
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
		convitesParaGrid,
		// Estados de UI
		loading,
		openMessage,
		openDialog,
		messageText,
		messageSeverity,
		conviteSelecionado,
		// Handlers
		handleResponderConvite,
		handleCloseMessage,
		handleClose,
		handleConfirmarResposta,
		handleCancelarResposta,
	} = useConvitesRecebidosOrientador();

	const columns = [
		{
			field: "nomeDicente",
			headerName: "Estudante",
			width: 200,
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
			field: "matriculaDicente",
			headerName: "Matrícula",
			width: 120,
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
			field: "nomeCurso",
			headerName: "Curso",
			width: 150,
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
			field: "faseDescricao",
			headerName: "Fase",
			width: 100,
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
					<Chip
						label={params.value}
						size="small"
						color={
							params.value === "Orientação"
								? "secondary"
								: params.value === "Projeto"
									? "info"
									: "primary"
						}
						variant="outlined"
					/>
				</div>
			),
		},
		{
			field: "mensagemEnvio",
			headerName: "Mensagem",
			width: 380,
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
			field: "dataEnvio",
			headerName: "Data do Convite",
			width: 150,
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
			field: "status",
			headerName: "Status",
			width: 120,
			renderCell: (params) => {
				// Se não foi respondido (sem data_feedback), mostrar como pendente
				if (!params.row.foiRespondido) {
					return (
						<Chip label="Pendente" color="warning" size="small" />
					);
				}

				// Se foi respondido, verificar se foi aceito ou rejeitado
				const status = params.row.aceito;
				if (status === true) {
					return <Chip label="Aceito" color="success" size="small" />;
				} else {
					return (
						<Chip label="Rejeitado" color="error" size="small" />
					);
				}
			},
		},
		{
			field: "actions",
			headerName: "Ações",
			sortable: false,
			width: 200,
			renderCell: (params) => {
				// Se foi respondido (tem data_feedback), mostrar mensagem
				if (params.row.foiRespondido) {
					return (
						<Typography variant="body2" color="text.secondary">
							Já respondido
						</Typography>
					);
				}

				// Se não foi respondido, mostrar as ações
				return (
					<PermissionContext
						permissoes={[Permissoes.TRABALHO_CONCLUSAO.EDITAR]}
						showError={false}
					>
						<Stack direction="row" spacing={1}>
							<Button
								color="primary"
								variant="contained"
								size="small"
								onClick={() =>
									handleResponderConvite(params.row, true)
								}
							>
								Aceitar
							</Button>
							<Button
								color="error"
								variant="outlined"
								size="small"
								onClick={() =>
									handleResponderConvite(params.row, false)
								}
							>
								Rejeitar
							</Button>
						</Stack>
					</PermissionContext>
				);
			},
		},
	];

	return (
		<Box>
			<Typography variant="h6" component="h2" gutterBottom>
				Convites de Estudantes
			</Typography>

			<Stack spacing={2}>
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
					mostrarTodosCursos={false}
					loading={loading}
				/>
				<Snackbar
					open={openMessage}
					autoHideDuration={6000}
					onClose={handleCloseMessage}
				>
					<Alert
						severity={messageSeverity}
						onClose={handleCloseMessage}
					>
						{messageText}
					</Alert>
				</Snackbar>

				<Dialog
					open={openDialog}
					onClose={handleClose}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
				>
					<DialogTitle id="alert-dialog-title">
						{"Confirmar Resposta"}
					</DialogTitle>
					<DialogContent>
						{conviteSelecionado && (
							<Box>
								<Typography variant="body1" gutterBottom>
									<strong>Estudante:</strong>{" "}
									{
										conviteSelecionado.TrabalhoConclusao
											?.Dicente?.nome
									}
								</Typography>
								<Typography variant="body1" gutterBottom>
									<strong>Matrícula:</strong>{" "}
									{
										conviteSelecionado.TrabalhoConclusao
											?.Dicente?.matricula
									}
								</Typography>
								<Typography variant="body1" gutterBottom>
									<strong>Título do TCC:</strong>{" "}
									{
										conviteSelecionado.TrabalhoConclusao
											?.titulo
									}
								</Typography>
								<Typography variant="body1" gutterBottom>
									<strong>Curso:</strong>{" "}
									{
										conviteSelecionado.TrabalhoConclusao
											?.Curso?.nome
									}
								</Typography>
								<Typography variant="body1" gutterBottom>
									<strong>Mensagem:</strong>{" "}
									{conviteSelecionado.mensagem_envio ||
										"Sem mensagem"}
								</Typography>
								<Typography
									variant="body1"
									color="primary"
									sx={{ mt: 2 }}
								>
									Deseja realmente{" "}
									<strong>
										{conviteSelecionado.acao
											? "aceitar"
											: "rejeitar"}
									</strong>{" "}
									este convite?
								</Typography>
							</Box>
						)}
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCancelarResposta}>
							Cancelar
						</Button>
						<Button
							onClick={handleConfirmarResposta}
							autoFocus
							color={
								conviteSelecionado?.acao ? "success" : "error"
							}
							variant="contained"
						>
							{conviteSelecionado?.acao ? "Aceitar" : "Rejeitar"}
						</Button>
					</DialogActions>
				</Dialog>

				<PermissionContext
					permissoes={[
						Permissoes.ORIENTACAO.VISUALIZAR,
						Permissoes.ORIENTACAO.VISUALIZAR_TODOS,
					]}
				>
					<Box style={{ height: "500px" }}>
						<Typography
							variant="body2"
							color="text.secondary"
							gutterBottom
						>
							Total de convites: {convitesParaGrid.length}
						</Typography>
						<CustomDataGrid
							rows={convitesParaGrid}
							columns={columns}
							pageSize={5}
							checkboxSelection={false}
							disableSelectionOnClick
							rowSpanning={false}
							getRowId={(row) => {
								return `${row.id_tcc}-${row.codigo_docente}-${row.fase}`;
							}}
							rowHeight={56}
							loading={loading}
							localeText={{
								noRowsLabel: "Nenhum convite encontrado",
								loadingOverlay: "Carregando convites...",
							}}
						/>
					</Box>
				</PermissionContext>
			</Stack>
		</Box>
	);
}
