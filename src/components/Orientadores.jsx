import React, { useState, useEffect } from "react";
import axiosInstance from "../auth/axios";
import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";

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
import { DataGrid } from "@mui/x-data-grid";

export default function Orientadores() {
	const [orientadores, setOrientadores] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [formData, setFormData] = useState({
		id_curso: "",
		codigo_docente: "",
	});
	const [docentes, setDocentes] = useState([]);
	const [openMessage, setOpenMessage] = React.useState(false);
	const [openDialog, setOpenDialog] = React.useState(false);
	const [openDocenteModal, setOpenDocenteModal] = React.useState(false);
	const [messageText, setMessageText] = React.useState("");
	const [messageSeverity, setMessageSeverity] = React.useState("success");
	const [orientacaoDelete, setOrientacaoDelete] = React.useState(null);
	const [novoDocenteData, setNovoDocenteData] = useState({
		codigo: "",
		nome: "",
		email: "",
		sala: "",
	});

	useEffect(() => {
		getCursos();
		getDocentes();
	}, []);

	useEffect(() => {
		if (cursoSelecionado) {
			getOrientadoresPorCurso(cursoSelecionado);
		} else {
			setOrientadores([]);
		}
	}, [cursoSelecionado]);

	async function getCursos() {
		try {
			const response = await axiosInstance.get("/cursos");
			setCursos(response.cursos || []);
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		}
	}

	async function getDocentes() {
		try {
			const response = await axiosInstance.get("/docentes");
			setDocentes(response.docentes || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de docentes: ",
				error,
			);
			setDocentes([]);
		}
	}

	async function getOrientadoresPorCurso(idCurso) {
		try {
			const response = await axiosInstance.get(
				`/orientadores/curso/${idCurso}`,
			);
			setOrientadores(response.orientacoes || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de orientadores: ",
				error,
			);
			setOrientadores([]);
		}
	}

	function handleDelete(row) {
		setOrientacaoDelete({
			id_curso: row.id_curso,
			codigo_docente: row.codigo_docente,
		});
		setOpenDialog(true);
	}

	function handleInputChange(e) {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	}

	function handleCursoChange(e) {
		setCursoSelecionado(e.target.value);
	}

	function handleNovoDocenteChange(e) {
		setNovoDocenteData({
			...novoDocenteData,
			[e.target.name]: e.target.value,
		});
	}

	function handleOpenDocenteModal() {
		setOpenDocenteModal(true);
	}

	function handleCloseDocenteModal() {
		setOpenDocenteModal(false);
		setNovoDocenteData({
			codigo: "",
			nome: "",
			email: "",
			sala: "",
		});
	}

	async function handleCreateDocente() {
		try {
			if (
				!novoDocenteData.codigo ||
				!novoDocenteData.nome ||
				!novoDocenteData.email
			) {
				setMessageText(
					"Por favor, preencha os campos obrigatórios (código, nome e email)!",
				);
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			// Converter sala para número se não estiver vazio
			const docenteParaEnviar = {
				...novoDocenteData,
				sala: novoDocenteData.sala
					? parseInt(novoDocenteData.sala)
					: null,
			};

			await axiosInstance.post("/docentes", {
				formData: docenteParaEnviar,
			});

			setMessageText("Docente criado com sucesso!");
			setMessageSeverity("success");
			handleCloseDocenteModal();
			// Atualiza a lista de docentes
			await getDocentes();
		} catch (error) {
			console.log(
				"Não foi possível criar o docente no banco de dados",
				error,
			);
			setMessageText("Falha ao criar docente!");
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	async function handleAddOrientacao() {
		try {
			if (!cursoSelecionado || !formData.codigo_docente) {
				setMessageText("Por favor, selecione o docente!");
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			const orientacaoData = {
				id_curso: cursoSelecionado,
				codigo_docente: formData.codigo_docente,
			};

			await axiosInstance.post("/orientadores", {
				formData: orientacaoData,
			});

			setMessageText("Orientação adicionada com sucesso!");
			setMessageSeverity("success");
			setFormData({ id_curso: "", codigo_docente: "" });

			// Atualiza a lista
			await getOrientadoresPorCurso(cursoSelecionado);
		} catch (error) {
			console.log(
				"Não foi possível inserir a orientação no banco de dados",
			);
			setMessageText("Falha ao gravar orientação!");
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	function handleCancelClick() {
		setFormData({ id_curso: "", codigo_docente: "" });
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
			if (!orientacaoDelete) return;

			await axiosInstance.delete(
				`/orientadores/${orientacaoDelete.id_curso}/${orientacaoDelete.codigo_docente}`,
			);
			setMessageText("Orientação removida com sucesso!");
			setMessageSeverity("success");

			// Atualiza a lista
			if (cursoSelecionado) {
				await getOrientadoresPorCurso(cursoSelecionado);
			}
		} catch (error) {
			console.log(
				"Não foi possível remover a orientação no banco de dados",
			);
			setMessageText("Falha ao remover orientação!");
			setMessageSeverity("error");
		} finally {
			setOrientacaoDelete(null);
			setOpenDialog(false);
			setOpenMessage(true);
		}
	}

	function handleNoDeleteClick() {
		setOpenDialog(false);
		setOrientacaoDelete(null);
	}

	const columns = [
		{ field: "codigo_docente", headerName: "Código Docente", width: 150 },
		{
			field: "docente_nome",
			headerName: "Nome do Orientador",
			width: 350,
			renderCell: (params) => {
				const docente = params?.row?.docente;
				return docente?.nome || "N/A";
			},
		},
		{
			field: "docente_email",
			headerName: "Email",
			width: 300,
			renderCell: (params) => {
				const docente = params?.row?.docente;
				return docente?.email || "N/A";
			},
		},
		{
			field: "actions",
			headerName: "Ações",
			sortable: false,
			width: 150,
			renderCell: (params) => (
				<PermissionContext
					permissoes={[Permissoes.ORIENTADOR.DELETAR]}
					showError={false}
				>
					<Button
						color="secondary"
						onClick={() => handleDelete(params.row)}
					>
						Remover
					</Button>
				</PermissionContext>
			),
		},
	];

	return (
		<Box>
			<Stack spacing={2} sx={{ width: 1400 }}>
				<Typography variant="h5" component="h2">
					Orientadores por Curso
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

				<PermissionContext permissoes={[Permissoes.ORIENTADOR.CRIAR]}>
					{cursoSelecionado && (
						<>
							<Typography variant="h6" component="h3">
								Adicionar Novo Orientador
							</Typography>

							<Stack spacing={2}>
								<Stack
									direction="row"
									spacing={2}
									alignItems="center"
								>
									<FormControl fullWidth size="small">
										<InputLabel>Docente</InputLabel>
										<Select
											name="codigo_docente"
											value={formData.codigo_docente}
											label="Docente"
											onChange={handleInputChange}
										>
											{docentes.map((docente) => (
												<MenuItem
													key={docente.codigo}
													value={docente.codigo}
												>
													{docente.nome} (
													{docente.codigo})
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<PermissionContext
										permissoes={[Permissoes.DOCENTE.CRIAR]}
										showError={false}
									>
										<Button
											variant="outlined"
											color="primary"
											onClick={handleOpenDocenteModal}
											sx={{
												minWidth: "auto",
												whiteSpace: "nowrap",
											}}
										>
											Novo Docente
										</Button>
									</PermissionContext>
								</Stack>

								<Stack spacing={2} direction="row">
									<PermissionContext
										permissoes={[
											Permissoes.ORIENTADOR.CRIAR,
										]}
										showError={false}
									>
										<Button
											color="primary"
											variant="contained"
											onClick={handleAddOrientacao}
										>
											Adicionar Orientação
										</Button>
									</PermissionContext>
									<Button
										variant="outlined"
										onClick={handleCancelClick}
										color="error"
									>
										Cancelar
									</Button>
								</Stack>
							</Stack>
						</>
					)}
				</PermissionContext>

				{/* Modal para criar novo docente */}
				<PermissionContext permissoes={[Permissoes.DOCENTE.CRIAR]}>
					<Dialog
						open={openDocenteModal}
						onClose={handleCloseDocenteModal}
						aria-labelledby="criar-docente-title"
						maxWidth="sm"
						fullWidth
					>
						<DialogTitle id="criar-docente-title">
							Criar Novo Docente
						</DialogTitle>
						<DialogContent>
							<Stack spacing={2} sx={{ mt: 1 }}>
								<TextField
									name="codigo"
									label="Código"
									value={novoDocenteData.codigo}
									onChange={handleNovoDocenteChange}
									fullWidth
									size="small"
									required
								/>
								<TextField
									name="nome"
									label="Nome"
									value={novoDocenteData.nome}
									onChange={handleNovoDocenteChange}
									fullWidth
									size="small"
									required
								/>
								<TextField
									name="email"
									label="Email"
									type="email"
									value={novoDocenteData.email}
									onChange={handleNovoDocenteChange}
									fullWidth
									size="small"
									required
								/>
								<TextField
									name="sala"
									label="Sala"
									value={novoDocenteData.sala}
									onChange={handleNovoDocenteChange}
									fullWidth
									size="small"
								/>
							</Stack>
						</DialogContent>
						<DialogActions>
							<Button onClick={handleCloseDocenteModal}>
								Cancelar
							</Button>
							<Button
								onClick={handleCreateDocente}
								variant="contained"
								color="primary"
							>
								Criar Docente
							</Button>
						</DialogActions>
					</Dialog>
				</PermissionContext>

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
							Deseja realmente remover esta orientação?
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleNoDeleteClick}>Cancelar</Button>
						<Button onClick={handleDeleteClick} autoFocus>
							Confirmar
						</Button>
					</DialogActions>
				</Dialog>

				<PermissionContext
					permissoes={[
						Permissoes.ORIENTADOR.VISUALIZAR,
						Permissoes.ORIENTADOR.VISUALIZAR_TODOS,
					]}
				>
					{cursoSelecionado && (
						<Box style={{ height: "500px" }}>
							<DataGrid
								rows={orientadores}
								columns={columns}
								pageSize={5}
								checkboxSelection={false}
								disableSelectionOnClick
								getRowId={(row) =>
									`${row.id_curso}_${row.codigo_docente}`
								}
							/>
						</Box>
					)}
				</PermissionContext>
			</Stack>
		</Box>
	);
}
