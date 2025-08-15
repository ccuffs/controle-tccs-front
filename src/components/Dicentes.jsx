import React, { useState, useEffect } from "react";
import axiosInstance from "../auth/axios";
import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import CustomDataGrid from "./CustomDataGrid";
import FiltrosPesquisa from "./FiltrosPesquisa";

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
	Chip,
	Paper,
	LinearProgress,
	CircularProgress,
	Grid,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

export default function Dicentes() {
	const [dicentes, setDicentes] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [ofertasTcc, setOfertasTcc] = useState([]);
	const [selectedCurso, setSelectedCurso] = useState(null);
	const [selectedAno, setSelectedAno] = useState("");
	const [selectedSemestre, setSelectedSemestre] = useState("");
	const [faseSelecionada, setFaseSelecionada] = useState("");
	const [loadingCursos, setLoadingCursos] = useState(false);
	const [loadingOfertasTcc, setLoadingOfertasTcc] = useState(false);
	const [loadingDicentes, setLoadingDicentes] = useState(false);
	const [formData, setFormData] = useState({
		matricula: "",
		nome: "",
		email: "",
	});
	const [openMessage, setOpenMessage] = React.useState(false);
	const [openDialog, setOpenDialog] = React.useState(false);
	const [openDicenteModal, setOpenDicenteModal] = React.useState(false);
	const [openUploadModal, setOpenUploadModal] = React.useState(false);
	const [messageText, setMessageText] = React.useState("");
	const [messageSeverity, setMessageSeverity] = React.useState("success");
	const [dicenteDelete, setDicenteDelete] = React.useState(null);
	const [novoDicenteData, setNovoDicenteData] = useState({
		matricula: "",
		nome: "",
		email: "",
	});
	const [uploadFile, setUploadFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [uploadResults, setUploadResults] = useState(null);
	const [modalAno, setModalAno] = useState("");
	const [modalSemestre, setModalSemestre] = useState("");
	const [modalFase, setModalFase] = useState("");
	const [modalCurso, setModalCurso] = useState(null);

	useEffect(() => {
		getCursos();
		getOfertasTcc();
		getDicentes();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		// Atualiza a lista quando qualquer filtro muda
		getDicentes();
	}, [selectedCurso, selectedAno, selectedSemestre, faseSelecionada]); // eslint-disable-line react-hooks/exhaustive-deps

	async function getCursos() {
		setLoadingCursos(true);
		try {
			const response = await axiosInstance.get("/cursos");
			setCursos(response.cursos || []);
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		} finally {
			setLoadingCursos(false);
		}
	}

	async function getOfertasTcc() {
		setLoadingOfertasTcc(true);
		try {
			const response = await axiosInstance.get("/ofertas-tcc");

			// Verificar se a resposta tem a estrutura esperada
			let ofertas = [];
			if (response && response.ofertas) {
				ofertas = response.ofertas;
			} else if (Array.isArray(response)) {
				ofertas = response;
			} else if (response && Array.isArray(response.data)) {
				ofertas = response.data;
			}

			setOfertasTcc(ofertas);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de ofertas TCC: ",
				error,
			);
			setOfertasTcc([]);
		} finally {
			setLoadingOfertasTcc(false);
		}
	}

	async function getDicentes() {
		setLoadingDicentes(true);
		try {
			// Construir parâmetros de filtro apenas para ano/semestre e fase
			// O filtro de curso é apenas visual (não filtra dicentes)
			const params = {};

			// Aplicar filtros de backend apenas se ano OU semestre OU fase estiver selecionado
			// Isso busca dicentes que têm orientação nos critérios especificados
			if (selectedAno) {
				params.ano = selectedAno;
			}

			if (selectedSemestre) {
				params.semestre = selectedSemestre;
			}

			if (faseSelecionada) {
				params.fase = faseSelecionada;
			}

			const response = await axiosInstance.get("/dicentes", { params });
			setDicentes(response.dicentes || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de dicentes: ",
				error,
			);
			setDicentes([]);
		} finally {
			setLoadingDicentes(false);
		}
	}

	function handleDelete(row) {
		setDicenteDelete(row.matricula);
		setOpenDialog(true);
	}

	function handleCursoChange(cursoId) {
		const curso = cursos.find((c) => c.id === cursoId);
		setSelectedCurso(curso || null);
	}

	function handleAnoChange(e) {
		setSelectedAno(e.target.value || "");
	}

	function handleSemestreChange(e) {
		setSelectedSemestre(e.target.value || "");
	}

	function handleFaseChange(e) {
		setFaseSelecionada(e.target.value || "");
	}

	function handleModalAnoChange(e) {
		setModalAno(e.target.value || "");
	}

	function handleModalSemestreChange(e) {
		setModalSemestre(e.target.value || "");
	}

	function handleModalFaseChange(e) {
		setModalFase(e.target.value || "");
	}

	function handleModalCursoChange(e) {
		const cursoId = e.target.value;
		const curso = cursos.find((c) => c.id === cursoId);
		setModalCurso(curso || null);
	}

	function handleNovoDicenteChange(e) {
		setNovoDicenteData({
			...novoDicenteData,
			[e.target.name]: e.target.value,
		});
	}

	function handleOpenDicenteModal() {
		setOpenDicenteModal(true);
	}

	function handleCloseDicenteModal() {
		setOpenDicenteModal(false);
		setNovoDicenteData({
			matricula: "",
			nome: "",
			email: "",
		});
	}

	function handleOpenUploadModal() {
		// Pré-popular com os valores da tela principal
		setModalCurso(selectedCurso);
		setModalAno(selectedAno);
		setModalSemestre(selectedSemestre);
		setModalFase(faseSelecionada);
		setOpenUploadModal(true);
	}

	function handleCloseUploadModal() {
		setOpenUploadModal(false);
		setUploadFile(null);
		setUploadResults(null);
		// Resetar os valores do modal
		setModalCurso(null);
		setModalAno("");
		setModalSemestre("");
		setModalFase("");
	}

	function handleFileChange(e) {
		const file = e.target.files[0];
		if (file && file.type === "application/pdf") {
			setUploadFile(file);
		} else {
			setMessageText("Por favor, selecione um arquivo PDF válido!");
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	async function handleUploadPDF() {
		if (!uploadFile) {
			setMessageText("Por favor, selecione um arquivo PDF!");
			setMessageSeverity("error");
			setOpenMessage(true);
			return;
		}

		if (!modalAno || !modalSemestre || !modalFase || !modalCurso) {
			setMessageText(
				"Por favor, selecione o curso, ano, semestre e a fase!",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
			return;
		}

		setUploading(true);
		const formData = new FormData();
		formData.append("pdf", uploadFile);

		// Adicionar ano, semestre, fase e curso aos dados
		formData.append("ano", modalAno);
		formData.append("semestre", modalSemestre);
		formData.append("fase", modalFase);
		formData.append("id_curso", modalCurso.id);

		try {
			const response = await axiosInstance.post(
				"/dicentes/processar-pdf",
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
					},
				},
			);

			setUploadResults(response);
			setMessageText(
				`PDF processado com sucesso! ${response.sucessos} dicentes inseridos, ${response.erros} erros.`,
			);
			setMessageSeverity("success");
			// Atualiza a lista de dicentes
			await getDicentes();
		} catch (error) {
			console.log("Erro ao fazer upload do PDF:", error);
			setMessageText("Falha ao processar PDF!");
			setMessageSeverity("error");
		} finally {
			setUploading(false);
			setOpenMessage(true);
		}
	}

	async function handleCreateDicente() {
		try {
			if (
				!novoDicenteData.matricula ||
				!novoDicenteData.nome ||
				!novoDicenteData.email
			) {
				setMessageText(
					"Por favor, preencha todos os campos obrigatórios!",
				);
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			// Converter matrícula para número
			const dicenteParaEnviar = {
				...novoDicenteData,
				matricula: parseInt(novoDicenteData.matricula),
			};

			await axiosInstance.post("/dicentes", {
				formData: dicenteParaEnviar,
			});

			setMessageText("Dicente criado com sucesso!");
			setMessageSeverity("success");
			handleCloseDicenteModal();
			// Atualiza a lista de dicentes
			await getDicentes();
		} catch (error) {
			console.log(
				"Não foi possível criar o dicente no banco de dados",
				error,
			);
			setMessageText("Falha ao criar dicente!");
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
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
			if (!dicenteDelete) return;

			await axiosInstance.delete(`/dicentes/${dicenteDelete}`);

			setMessageText("Dicente removido com sucesso!");
			setMessageSeverity("success");
			// Atualiza a lista
			await getDicentes();
		} catch (error) {
			console.log("Não foi possível remover o dicente no banco de dados");
			setMessageText("Falha ao remover dicente!");
			setMessageSeverity("error");
		} finally {
			setDicenteDelete(null);
			setOpenDialog(false);
			setOpenMessage(true);
		}
	}

	function handleNoDeleteClick() {
		setOpenDialog(false);
		setDicenteDelete(null);
	}

	// Gerar listas únicas a partir das ofertas TCC
	const anosUnicos = [
		...new Set(
			ofertasTcc
				.filter(
					(oferta) =>
						oferta &&
						typeof oferta.ano === "number" &&
						oferta.ano > 0,
				)
				.map((oferta) => oferta.ano),
		),
	].sort((a, b) => a - b);

	const semestresUnicos = [
		...new Set(
			ofertasTcc
				.filter(
					(oferta) =>
						oferta &&
						typeof oferta.semestre === "number" &&
						oferta.semestre > 0,
				)
				.map((oferta) => oferta.semestre),
		),
	].sort((a, b) => a - b);

	const fasesUnicas = [
		...new Set(
			ofertasTcc
				.filter(
					(oferta) =>
						oferta &&
						oferta.fase !== null &&
						oferta.fase !== undefined,
				)
				.map((oferta) => oferta.fase.toString()),
		),
	]
		.filter((fase) => fase && fase !== "undefined" && fase !== "null")
		.sort((a, b) => parseInt(a) - parseInt(b));

	const columns = [
		{ field: "matricula", headerName: "Matrícula", width: 150 },
		{ field: "nome", headerName: "Nome", width: 350 },
		{ field: "email", headerName: "Email", width: 300 },
		{
			field: "actions",
			headerName: "Ações",
			sortable: false,
			width: 150,
			renderCell: (params) => (
				<PermissionContext
					permissoes={[Permissoes.DICENTE.DELETAR]}
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
		<Box
			sx={{
				gap: 2,
				width: 1400,
			}}
		>
			<Typography variant="h5" component="h2">
				Gerenciamento de Dicentes
			</Typography>
			<FiltrosPesquisa
				cursoSelecionado={selectedCurso ? selectedCurso.id : ""}
				setCursoSelecionado={handleCursoChange}
				ano={selectedAno}
				setAno={setSelectedAno}
				semestre={selectedSemestre}
				setSemestre={setSelectedSemestre}
				fase={faseSelecionada}
				setFase={setFaseSelecionada}
				cursos={cursos}
				habilitarCurso={true}
				habilitarAno={true}
				habilitarSemestre={true}
				habilitarFase={true}
				mostrarTodosCursos={true}
				loading={loadingCursos || loadingOfertasTcc || loadingDicentes}
				// Passar os anos e semestres únicos das ofertas TCC
				anosDisponiveis={anosUnicos}
				semestresDisponiveis={semestresUnicos}
				fasesDisponiveis={fasesUnicas}
			/>
			<Stack spacing={2} sx={{ width: "100%" }}>
				<Stack
					direction="row"
					spacing={2}
					flexWrap="wrap"
					sx={{ width: "100%" }}
				>
					<Box
						display="flex"
						alignItems="center"
						sx={{ minWidth: 150 }}
					>
						{loadingDicentes ? (
							<Box display="flex" alignItems="center">
								<CircularProgress size={16} sx={{ mr: 1 }} />
								<Typography
									variant="body2"
									color="text.secondary"
								>
									Carregando...
								</Typography>
							</Box>
						) : (
							<Typography variant="body2" color="text.secondary">
								{`${dicentes.length} dicente${
									dicentes.length !== 1 ? "s" : ""
								} encontrado${
									dicentes.length !== 1 ? "s" : ""
								}`}
							</Typography>
						)}
					</Box>
				</Stack>

				<PermissionContext permissoes={[Permissoes.DICENTE.CRIAR]}>
					<Stack direction="row" spacing={2}>
						<PermissionContext
							permissoes={[Permissoes.DICENTE.CRIAR]}
							showError={false}
						>
							<Button
								variant="contained"
								color="primary"
								startIcon={<PersonAddIcon />}
								onClick={handleOpenDicenteModal}
							>
								Adicionar Dicente
							</Button>
						</PermissionContext>
						<PermissionContext
							permissoes={[Permissoes.DICENTE.CRIAR]}
							showError={false}
						>
							<Button
								variant="outlined"
								color="secondary"
								startIcon={<CloudUploadIcon />}
								onClick={handleOpenUploadModal}
							>
								Upload PDF Lista
							</Button>
						</PermissionContext>
					</Stack>
				</PermissionContext>

				{/* Modal para criar novo dicente */}
				<Dialog
					open={openDicenteModal}
					onClose={handleCloseDicenteModal}
					aria-labelledby="criar-dicente-title"
					maxWidth="sm"
					fullWidth
				>
					<DialogTitle id="criar-dicente-title">
						Criar Novo Dicente
					</DialogTitle>
					<DialogContent>
						<Stack spacing={2} sx={{ mt: 1 }}>
							<TextField
								name="matricula"
								label="Matrícula"
								value={novoDicenteData.matricula}
								onChange={handleNovoDicenteChange}
								fullWidth
								size="small"
								required
							/>
							<TextField
								name="nome"
								label="Nome"
								value={novoDicenteData.nome}
								onChange={handleNovoDicenteChange}
								fullWidth
								size="small"
								required
							/>
							<TextField
								name="email"
								label="Email"
								type="email"
								value={novoDicenteData.email}
								onChange={handleNovoDicenteChange}
								fullWidth
								size="small"
								required
							/>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseDicenteModal}>
							Cancelar
						</Button>
						<Button
							onClick={handleCreateDicente}
							variant="contained"
							color="primary"
						>
							Criar Dicente
						</Button>
					</DialogActions>
				</Dialog>

				{/* Modal para upload de PDF */}
				<Dialog
					open={openUploadModal}
					onClose={handleCloseUploadModal}
					aria-labelledby="upload-pdf-title"
					maxWidth="md"
					fullWidth
				>
					<DialogTitle id="upload-pdf-title">
						Upload de Lista de Presença (PDF)
					</DialogTitle>
					<DialogContent>
						<Stack spacing={3} sx={{ mt: 1 }}>
							<Typography variant="body2" color="text.secondary">
								Selecione um arquivo PDF de lista de presença
								para importar dicentes automaticamente. O
								arquivo deve conter dados no formato: NOME
								seguido da MATRÍCULA. Os dicentes serão
								vinculados ao curso, ano/semestre e fase
								selecionados abaixo.
							</Typography>

							{/* Selects para Curso, Ano/Semestre e Fase */}
							<Grid container spacing={3}>
								<Grid item xs={12} md={3}>
									<FormControl
										fullWidth
										required
										sx={{ minWidth: 200 }}
									>
										<InputLabel>Curso</InputLabel>
										<Select
											value={
												modalCurso ? modalCurso.id : ""
											}
											onChange={handleModalCursoChange}
											label="Curso"
											disabled={
												loadingCursos ||
												cursos.length === 0
											}
										>
											{cursos.map((curso) => (
												<MenuItem
													key={curso.id}
													value={curso.id}
												>
													{curso.nome}
												</MenuItem>
											))}
											{cursos.length === 0 &&
												!loadingCursos && (
													<MenuItem disabled>
														Nenhum curso cadastrado
													</MenuItem>
												)}
										</Select>
									</FormControl>
								</Grid>
								<Grid item xs={12} md={3}>
									<FormControl
										fullWidth
										required
										sx={{ minWidth: 200 }}
									>
										<InputLabel>Ano</InputLabel>
										<Select
											value={modalAno || ""}
											onChange={handleModalAnoChange}
											label="Ano"
											disabled={
												loadingOfertasTcc ||
												anosUnicos.length === 0
											}
										>
											{anosUnicos.map((ano) => (
												<MenuItem key={ano} value={ano}>
													{ano}
												</MenuItem>
											))}
											{anosUnicos.length === 0 &&
												!loadingOfertasTcc && (
													<MenuItem disabled>
														Nenhum ano cadastrado
													</MenuItem>
												)}
										</Select>
									</FormControl>
								</Grid>
								<Grid item xs={12} md={3}>
									<FormControl
										fullWidth
										required
										sx={{ minWidth: 200 }}
									>
										<InputLabel>Semestre</InputLabel>
										<Select
											value={modalSemestre || ""}
											onChange={handleModalSemestreChange}
											label="Semestre"
											disabled={
												loadingOfertasTcc ||
												semestresUnicos.length === 0
											}
										>
											{semestresUnicos.map((semestre) => (
												<MenuItem
													key={semestre}
													value={semestre}
												>
													{semestre}º Semestre
												</MenuItem>
											))}
											{semestresUnicos.length === 0 &&
												!loadingOfertasTcc && (
													<MenuItem disabled>
														Nenhum semestre
														cadastrado
													</MenuItem>
												)}
										</Select>
									</FormControl>
								</Grid>
								<Grid item xs={12} md={3}>
									<FormControl
										fullWidth
										required
										sx={{ minWidth: 200 }}
									>
										<InputLabel>Fase TCC</InputLabel>
										<Select
											value={modalFase || ""}
											onChange={handleModalFaseChange}
											label="Fase TCC"
											disabled={
												loadingOfertasTcc ||
												fasesUnicas.length === 0
											}
										>
											{fasesUnicas.map((fase) => (
												<MenuItem
													key={fase}
													value={fase}
												>
													Fase {fase}
												</MenuItem>
											))}
											{fasesUnicas.length === 0 &&
												!loadingOfertasTcc && (
													<MenuItem disabled>
														Nenhuma fase cadastrada
													</MenuItem>
												)}
										</Select>
									</FormControl>
								</Grid>
							</Grid>

							<Box>
								<input
									accept="application/pdf"
									style={{ display: "none" }}
									id="raised-button-file"
									type="file"
									onChange={handleFileChange}
								/>
								<label htmlFor="raised-button-file">
									<Button
										variant="outlined"
										component="span"
										startIcon={<CloudUploadIcon />}
										fullWidth
									>
										Selecionar Arquivo PDF
									</Button>
								</label>
							</Box>

							{uploadFile && (
								<Paper
									sx={{ p: 2, bgcolor: "background.default" }}
								>
									<Typography variant="body2">
										<strong>Arquivo selecionado:</strong>{" "}
										{uploadFile.name}
									</Typography>
									<Typography variant="body2">
										<strong>Tamanho:</strong>{" "}
										{(
											uploadFile.size /
											1024 /
											1024
										).toFixed(2)}{" "}
										MB
									</Typography>
								</Paper>
							)}

							{uploading && (
								<Box>
									<Typography variant="body2" sx={{ mb: 1 }}>
										Processando PDF...
									</Typography>
									<LinearProgress />
								</Box>
							)}

							{uploadResults && (
								<Paper
									sx={{
										p: 2,
										bgcolor: "success.light",
										color: "success.contrastText",
									}}
								>
									<Typography variant="h6" gutterBottom>
										Resultados do Processamento
									</Typography>
									<Stack
										direction="row"
										spacing={1}
										sx={{ mb: 2 }}
									>
										<Chip
											label={`Total: ${uploadResults.totalEncontrados}`}
											color="default"
											size="small"
										/>
										<Chip
											label={`Sucessos: ${uploadResults.sucessos}`}
											color="success"
											size="small"
										/>
										<Chip
											label={`Erros: ${uploadResults.erros}`}
											color="error"
											size="small"
										/>
									</Stack>

									{uploadResults.detalhes &&
										uploadResults.detalhes.length > 0 && (
											<Box
												sx={{
													maxHeight: 200,
													overflow: "auto",
												}}
											>
												{uploadResults.detalhes
													.slice(0, 10)
													.map((detalhe, index) => (
														<Box
															key={index}
															sx={{
																mb: 0.5,
																display: "flex",
																alignItems:
																	"center",
																gap: 1,
															}}
														>
															<Typography
																variant="body2"
																component="span"
															>
																<strong>
																	{
																		detalhe.matricula
																	}
																</strong>{" "}
																- {detalhe.nome}
																:
															</Typography>
															<Chip
																label={
																	detalhe.status ===
																	"dicente_e_orientacao_inseridos"
																		? "Novo dicente + orientação"
																		: detalhe.status ===
																		  "orientacao_inserida"
																		? "Orientação criada"
																		: detalhe.status ===
																		  "dicente_inserido_orientacao_ja_existe"
																		? "Novo dicente (orientação já existe)"
																		: detalhe.status ===
																		  "orientacao_ja_existe"
																		? "Orientação já existe"
																		: detalhe.status ===
																		  "dicente_ja_existe"
																		? "Dicente já existe"
																		: detalhe.status ===
																		  "inserido"
																		? "Inserido"
																		: detalhe.status ===
																		  "já_existe"
																		? "Já existe"
																		: detalhe.status
																}
																size="small"
																color={
																	detalhe.status ===
																	"dicente_e_orientacao_inseridos"
																		? "success"
																		: detalhe.status ===
																		  "orientacao_inserida"
																		? "success"
																		: detalhe.status ===
																		  "dicente_inserido_orientacao_ja_existe"
																		? "info"
																		: detalhe.status ===
																		  "orientacao_ja_existe"
																		? "warning"
																		: detalhe.status ===
																		  "dicente_ja_existe"
																		? "warning"
																		: detalhe.status ===
																		  "inserido"
																		? "success"
																		: detalhe.status ===
																		  "já_existe"
																		? "warning"
																		: "error"
																}
															/>
														</Box>
													))}
												{uploadResults.detalhes.length >
													10 && (
													<Typography
														variant="body2"
														color="text.secondary"
													>
														... e mais{" "}
														{uploadResults.detalhes
															.length - 10}{" "}
														registros
													</Typography>
												)}
											</Box>
										)}
								</Paper>
							)}
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseUploadModal}>
							{uploadResults ? "Fechar" : "Cancelar"}
						</Button>
						{uploadFile && !uploading && !uploadResults && (
							<Button
								onClick={handleUploadPDF}
								variant="contained"
								color="primary"
								startIcon={<CloudUploadIcon />}
								disabled={
									!modalCurso ||
									!modalAno ||
									!modalSemestre ||
									!modalFase
								}
							>
								Processar PDF
							</Button>
						)}
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
							Deseja realmente remover este dicente?
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
						Permissoes.DICENTE.VISUALIZAR,
						Permissoes.DICENTE.VISUALIZAR_TODOS,
					]}
				>
					<Box style={{ height: "500px" }}>
						<CustomDataGrid
							rows={dicentes}
							columns={columns}
							pageSize={10}
							checkboxSelection={false}
							disableSelectionOnClick
							getRowId={(row) => row.matricula}
						/>
					</Box>
				</PermissionContext>
			</Stack>
		</Box>
	);
}
