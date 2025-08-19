import React, { useState, useEffect } from "react";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";

import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Snackbar,
	Stack,
	TextField,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Typography,
} from "@mui/material";
import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import TemasDataGrid from "./TemasDataGrid";

export default function TemasTcc({ isOrientadorView = false }) {
	const { usuario } = useAuth();
	const [temas, setTemas] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [docentesOrientadores, setDocentesOrientadores] = useState([]);
	const [areasTcc, setAreasTcc] = useState([]);
	const [formData, setFormData] = useState({
		descricao: "",
		id_area_tcc: "",
		codigo_docente: isOrientadorView
			? usuario?.codigo || usuario?.id || ""
			: "",
	});
	const [openMessage, setOpenMessage] = React.useState(false);
	const [openDialog, setOpenDialog] = React.useState(false);
	const [openAreaModal, setOpenAreaModal] = React.useState(false);
	const [openVagasModal, setOpenVagasModal] = React.useState(false);
	const [messageText, setMessageText] = React.useState("");
	const [messageSeverity, setMessageSeverity] = React.useState("success");
	const [temaDelete, setTemaDelete] = React.useState(null);
	const [temaVagas, setTemaVagas] = React.useState({
		id: null,
		vagas: 0,
		codigoDocente: null,
		docenteNome: null,
	});
	const [novaAreaData, setNovaAreaData] = useState({
		descricao: "",
		codigo_docente: "",
	});

	useEffect(() => {
		if (isOrientadorView) {
			getCursosOrientador();
		} else {
			getCursos();
		}
	}, [isOrientadorView, usuario]);

	useEffect(() => {
		if (cursoSelecionado) {
			if (isOrientadorView) {
				getTemasPorCursoOrientador(cursoSelecionado);
				getAreasTccOrientador();
			} else {
				getDocentesOrientadoresPorCurso(cursoSelecionado);
				getTemasPorCurso(cursoSelecionado);
			}
		} else {
			setDocentesOrientadores([]);
			setTemas([]);
		}
	}, [cursoSelecionado, isOrientadorView, usuario]);

	useEffect(() => {
		if (formData.codigo_docente) {
			getAreasTccPorDocente(formData.codigo_docente);
		} else {
			setAreasTcc([]);
		}
	}, [formData.codigo_docente]);

	async function getCursos() {
		try {
			const response = await axiosInstance.get("/cursos");
			setCursos(response.cursos || []);
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		}
	}

	async function getCursosOrientador() {
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
			if (!codigoDocente) return;

			// Buscar cursos do orientador logado
			const response = await axiosInstance.get(
				`/orientadores/docente/${codigoDocente}`,
			);
			const cursosOrientador = response.orientacoes || [];
			setCursos(cursosOrientador.map((orientacao) => orientacao.curso));

			// Se o orientador possui apenas 1 curso, pré-selecionar
			if (cursosOrientador.length === 1) {
				setCursoSelecionado(cursosOrientador[0].curso.id);
			}
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de cursos do orientador: ",
				error,
			);
			setCursos([]);
		}
	}

	async function getDocentesOrientadoresPorCurso(idCurso) {
		try {
			const response = await axiosInstance.get(
				`/orientadores/curso/${idCurso}`,
			);
			setDocentesOrientadores(response.orientacoes || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de docentes orientadores: ",
				error,
			);
			setDocentesOrientadores([]);
		}
	}

	async function getAreasTccPorDocente(codigoDocente) {
		try {
			const response = await axiosInstance.get(
				`/areas-tcc/docente/${codigoDocente}`,
			);
			setAreasTcc(response.areas || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de áreas TCC: ",
				error,
			);
			setAreasTcc([]);
		}
	}

	async function getTemasPorCurso(idCurso) {
		try {
			const response = await axiosInstance.get(
				`/temas-tcc/curso/${idCurso}`,
			);
			setTemas(response || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de temas TCC: ",
				error,
			);
			setTemas([]);
		}
	}

	async function getTemasPorCursoOrientador(idCurso) {
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
			if (!codigoDocente) return;

			// Buscar apenas os temas do orientador logado no curso selecionado
			const response = await axiosInstance.get(
				`/temas-tcc/docente/${codigoDocente}/curso/${idCurso}`,
			);
			setTemas(response || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de temas TCC do orientador: ",
				error,
			);
			setTemas([]);
		}
	}

	async function getAreasTccOrientador() {
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
			if (!codigoDocente) return;

			const response = await axiosInstance.get(
				`/areas-tcc/docente/${codigoDocente}`,
			);
			setAreasTcc(response.areas || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de áreas TCC do orientador: ",
				error,
			);
			setAreasTcc([]);
		}
	}

	function handleDelete(row) {
		setTemaDelete(row.id);
		setOpenDialog(true);
	}

	function handleOpenVagasModal(tema) {
		const codigoDocente = isOrientadorView
			? usuario?.codigo || usuario?.id
			: tema.codigo_docente;
		const docenteNome = isOrientadorView ? usuario?.nome : tema.docenteNome;

		setTemaVagas({
			id: tema.id,
			vagas: tema.vagasOferta || tema.vagas || 0,
			codigoDocente: codigoDocente,
			docenteNome: docenteNome,
		});
		setOpenVagasModal(true);
	}

	function handleCloseVagasModal() {
		setOpenVagasModal(false);
		setTemaVagas({
			id: null,
			vagas: 0,
			codigoDocente: null,
			docenteNome: null,
		});
	}

	async function handleUpdateVagas() {
		try {
			// Usar o novo endpoint específico para vagas da oferta do docente
			await axiosInstance.patch(
				`/temas-tcc/docente/${temaVagas.codigoDocente}/curso/${cursoSelecionado}/vagas`,
				{
					vagas: temaVagas.vagas,
				},
			);

			const mensagem = isOrientadorView
				? `Vagas da sua oferta atualizadas com sucesso!`
				: `Vagas da oferta do ${temaVagas.docenteNome} atualizadas com sucesso!`;
			setMessageText(mensagem);
			setMessageSeverity("success");
			setOpenMessage(true);

			// Atualiza a lista
			if (cursoSelecionado) {
				if (isOrientadorView) {
					await getTemasPorCursoOrientador(cursoSelecionado);
				} else {
					await getTemasPorCurso(cursoSelecionado);
				}
			}

			handleCloseVagasModal();
		} catch (error) {
			console.log("Não foi possível atualizar as vagas da oferta");
			setMessageText("Falha ao atualizar vagas da oferta!");
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	function handleInputChange(e) {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	}

	function handleCursoChange(e) {
		setCursoSelecionado(e.target.value);
		// Limpar seleções dependentes
		setFormData({
			descricao: "",
			id_area_tcc: "",
			codigo_docente: isOrientadorView
				? usuario?.codigo || usuario?.id || ""
				: "",
		});
	}

	function handleNovaAreaChange(e) {
		setNovaAreaData({ ...novaAreaData, [e.target.name]: e.target.value });
	}

	function handleOpenAreaModal() {
		const codigoDocente = isOrientadorView
			? usuario?.codigo || usuario?.id
			: formData.codigo_docente;

		if (!codigoDocente) {
			const mensagem = isOrientadorView
				? "Erro: Código do docente não encontrado!"
				: "Por favor, selecione um docente primeiro!";
			setMessageText(mensagem);
			setMessageSeverity("error");
			setOpenMessage(true);
			return;
		}
		setNovaAreaData({
			descricao: "",
			codigo_docente: codigoDocente,
		});
		setOpenAreaModal(true);
	}

	function handleCloseAreaModal() {
		setOpenAreaModal(false);
		setNovaAreaData({
			descricao: "",
			codigo_docente: "",
		});
	}

	async function handleCreateArea() {
		try {
			if (!novaAreaData.descricao) {
				setMessageText("Por favor, preencha a descrição da área!");
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			await axiosInstance.post("/areas-tcc", {
				formData: novaAreaData,
			});

			setMessageText("Área TCC criada com sucesso!");
			setMessageSeverity("success");
			handleCloseAreaModal();
			// Atualiza a lista de áreas TCC
			if (isOrientadorView) {
				await getAreasTccOrientador();
			} else {
				await getAreasTccPorDocente(formData.codigo_docente);
			}
		} catch (error) {
			console.log(
				"Não foi possível criar a área TCC no banco de dados",
				error,
			);
			setMessageText("Falha ao criar área TCC!");
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	async function handleAddTema() {
		try {
			if (
				!formData.descricao ||
				!formData.id_area_tcc ||
				!formData.codigo_docente
			) {
				setMessageText(
					"Por favor, preencha todos os campos obrigatórios!",
				);
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			await axiosInstance.post("/temas-tcc", formData);

			setMessageText("Tema TCC adicionado com sucesso!");
			setMessageSeverity("success");
			setFormData({
				descricao: "",
				id_area_tcc: "",
				codigo_docente: isOrientadorView
					? usuario?.codigo || usuario?.id || ""
					: "",
			});

			// Atualiza a lista
			if (isOrientadorView) {
				await getTemasPorCursoOrientador(cursoSelecionado);
			} else {
				await getTemasPorCurso(cursoSelecionado);
			}
		} catch (error) {
			console.log(
				"Não foi possível inserir o tema TCC no banco de dados",
			);
			setMessageText("Falha ao gravar tema TCC!");
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	function handleCancelClick() {
		setFormData({
			descricao: "",
			id_area_tcc: "",
			codigo_docente: isOrientadorView
				? usuario?.codigo || usuario?.id || ""
				: "",
		});
	}

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	}

	function handleClose() {
		setOpenDialog(false);
	}

	async function handleDeleteClick() {
		try {
			if (!temaDelete) return;

			await axiosInstance.delete(`/temas-tcc/${temaDelete}`);
			setMessageText("Tema TCC removido com sucesso!");
			setMessageSeverity("success");

			// Atualiza a lista
			if (cursoSelecionado) {
				if (isOrientadorView) {
					await getTemasPorCursoOrientador(cursoSelecionado);
				} else {
					await getTemasPorCurso(cursoSelecionado);
				}
			}
		} catch (error) {
			console.log(
				"Não foi possível remover o tema TCC no banco de dados",
			);
			setMessageText("Falha ao remover tema TCC!");
			setMessageSeverity("error");
		} finally {
			setTemaDelete(null);
			setOpenDialog(false);
			setOpenMessage(true);
		}
	}

	function handleNoDeleteClick() {
		setOpenDialog(false);
		setTemaDelete(null);
	}

	async function handleToggleAtivo(tema) {
		try {
			const novoStatus = !tema.ativo;

			await axiosInstance.put("/temas-tcc", {
				id: tema.id,
				ativo: novoStatus,
			});

			setMessageText(
				`Tema ${novoStatus ? "ativado" : "desativado"} com sucesso!`,
			);
			setMessageSeverity("success");

			// Atualiza a lista
			if (cursoSelecionado) {
				if (isOrientadorView) {
					await getTemasPorCursoOrientador(cursoSelecionado);
				} else {
					await getTemasPorCurso(cursoSelecionado);
				}
			}
		} catch (error) {
			console.log("Não foi possível alterar o status do tema");
			setMessageText("Falha ao alterar status do tema!");
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	return (
		<Box sx={{ width: 1400 }}>
			<Stack spacing={2} sx={{ width: "100%" }}>
				<Typography variant="h5" component="h2">
					Temas TCC por Curso
				</Typography>

				<FormControl fullWidth size="small">
					<InputLabel>Selecione um Curso</InputLabel>
					<Select
						value={cursoSelecionado}
						label="Selecione um Curso"
						onChange={handleCursoChange}
					>
						<MenuItem value="">
							<em>Selecione um curso</em>
						</MenuItem>
						{cursos.map((curso) => (
							<MenuItem key={curso.id} value={curso.id}>
								{curso.nome} - {curso.codigo} ({curso.turno})
							</MenuItem>
						))}
					</Select>
				</FormControl>

				{cursoSelecionado && (
					<PermissionContext
						grupos={
							isOrientadorView
								? [Permissoes.GRUPOS.ORIENTADOR]
								: [
										Permissoes.GRUPOS.ADMIN,
										Permissoes.GRUPOS.PROFESSOR,
									]
						}
						showError={false}
					>
						<Typography variant="h6" component="h3">
							Adicionar Novo Tema TCC
						</Typography>

						<Stack spacing={2}>
							{!isOrientadorView && (
								<FormControl fullWidth size="small">
									<InputLabel>Docente Orientador</InputLabel>
									<Select
										name="codigo_docente"
										value={formData.codigo_docente}
										label="Docente Orientador"
										onChange={handleInputChange}
									>
										{docentesOrientadores.map(
											(orientacao) => (
												<MenuItem
													key={
														orientacao.docente
															?.codigo
													}
													value={
														orientacao.docente
															?.codigo
													}
												>
													{orientacao.docente?.nome} (
													{orientacao.docente?.codigo}
													)
												</MenuItem>
											),
										)}
									</Select>
								</FormControl>
							)}

							{(formData.codigo_docente || isOrientadorView) && (
								<Stack
									direction="row"
									spacing={2}
									alignItems="center"
								>
									<FormControl fullWidth size="small">
										<InputLabel>Área TCC</InputLabel>
										<Select
											name="id_area_tcc"
											value={formData.id_area_tcc}
											label="Área TCC"
											onChange={handleInputChange}
										>
											{areasTcc.map((area) => (
												<MenuItem
													key={area.id}
													value={area.id}
												>
													{area.descricao}
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<Button
										variant="outlined"
										color="primary"
										onClick={handleOpenAreaModal}
										sx={{
											minWidth: "auto",
											whiteSpace: "nowrap",
										}}
									>
										Nova Área
									</Button>
								</Stack>
							)}

							<TextField
								name="descricao"
								label="Descrição do Tema"
								value={formData.descricao}
								onChange={handleInputChange}
								fullWidth
								size="small"
								multiline
								rows={3}
								placeholder="Descreva o tema TCC..."
							/>

							<Stack spacing={2} direction="row">
								<Button
									color="primary"
									variant="contained"
									onClick={handleAddTema}
								>
									Adicionar Tema
								</Button>
								<Button
									variant="outlined"
									onClick={handleCancelClick}
									color="error"
								>
									Cancelar
								</Button>
							</Stack>
						</Stack>
					</PermissionContext>
				)}

				{/* Modal para criar nova área TCC */}
				<Dialog
					open={openAreaModal}
					onClose={handleCloseAreaModal}
					aria-labelledby="criar-area-title"
					maxWidth="sm"
					fullWidth
				>
					<DialogTitle id="criar-area-title">
						Criar Nova Área TCC
					</DialogTitle>
					<DialogContent>
						<Stack spacing={2} sx={{ mt: 1 }}>
							<TextField
								name="descricao"
								label="Descrição da Área"
								value={novaAreaData.descricao}
								onChange={handleNovaAreaChange}
								fullWidth
								size="small"
								required
								multiline
								rows={2}
								placeholder="Ex: Inteligência Artificial, Desenvolvimento Web, Banco de Dados..."
							/>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseAreaModal}>Cancelar</Button>
						<Button
							onClick={handleCreateArea}
							variant="contained"
							color="primary"
						>
							Criar Área
						</Button>
					</DialogActions>
				</Dialog>

				{/* Modal para atualizar vagas */}
				<Dialog
					open={openVagasModal}
					onClose={handleCloseVagasModal}
					aria-labelledby="atualizar-vagas-title"
					maxWidth="sm"
					fullWidth
				>
					<DialogTitle id="atualizar-vagas-title">
						Atualizar Vagas da Oferta
					</DialogTitle>
					<DialogContent>
						<Stack spacing={2} sx={{ mt: 1 }}>
							<Typography variant="body2" color="text.secondary">
								{isOrientadorView
									? "Editando vagas da sua oferta no curso selecionado."
									: `Editando vagas da oferta do docente: ${temaVagas.docenteNome}`}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								Nota: As vagas são por oferta do docente, não
								por tema individual. Alterar aqui afetará todos
								{isOrientadorView
									? " os seus temas neste curso."
									: " os temas deste docente."}
							</Typography>
							<TextField
								label="Número de Vagas da Oferta"
								type="number"
								value={temaVagas.vagas}
								onChange={(e) =>
									setTemaVagas({
										...temaVagas,
										vagas: parseInt(e.target.value) || 0,
									})
								}
								fullWidth
								size="small"
								inputProps={{ min: 0 }}
							/>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseVagasModal}>
							Cancelar
						</Button>
						<Button
							onClick={handleUpdateVagas}
							variant="contained"
							color="primary"
						>
							Atualizar Vagas
						</Button>
					</DialogActions>
				</Dialog>

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
						{"Atenção!"}
					</DialogTitle>
					<DialogContent>
						<DialogContentText id="alert-dialog-description">
							Deseja realmente remover este tema TCC?
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleNoDeleteClick}>Cancelar</Button>
						<Button onClick={handleDeleteClick} autoFocus>
							Confirmar
						</Button>
					</DialogActions>
				</Dialog>

				{cursoSelecionado && (
					<>
						<Typography variant="body2" color="text.secondary">
							Total: {temas.length} tema(s) •{" "}
							{
								Object.keys(
									temas.reduce((acc, tema) => {
										const codigo =
											tema.Docente?.codigo ||
											"sem-docente";
										acc[codigo] = true;
										return acc;
									}, {}),
								).length
							}{" "}
							docente(s) •{" "}
							{
								Object.keys(
									temas.reduce((acc, tema) => {
										const idArea =
											tema.AreaTcc?.id || "sem-area";
										acc[idArea] = true;
										return acc;
									}, {}),
								).length
							}{" "}
							área(s)
						</Typography>

						<TemasDataGrid
							temas={temas}
							onOpenVagasModal={handleOpenVagasModal}
							onToggleAtivo={handleToggleAtivo}
							onDelete={handleDelete}
							isOrientadorView={isOrientadorView}
						/>
					</>
				)}
			</Stack>
		</Box>
	);
}
