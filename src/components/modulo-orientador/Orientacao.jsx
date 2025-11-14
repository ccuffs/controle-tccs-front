import React from "react";
import { ptBR } from "date-fns/locale";
import {
	Alert,
	Box,
	Button,
	Snackbar,
	Stack,
	Select,
	FormControl,
	InputLabel,
	Typography,
	Paper,
	CircularProgress,
	MenuItem,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Chip,
	Grid,
	LinearProgress,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataGrid } from "@mui/x-data-grid";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";

import PermissionContext from "../../contexts/PermissionContext";
import { Permissoes } from "../../enums/permissoes";

import FiltrosPesquisa from "../utils/FiltrosPesquisa";
import SelecionarHorarioBanca from "../modulo-dicente/SelecionarHorarioBanca";
import { useOrientacao } from "../../hooks/useOrientacao";
import orientacaoController from "../../controllers/orientacao-controller";

export default function Orientacao({ isOrientadorView = false }) {
	const {
		// Estados de permissão
		isProfessor,
		isAdmin,
		// Estados de dados
		dicentes,
		cursos,
		orientadoresCurso,
		ofertasTcc,
		orientacoes,
		trabalhosPorMatricula,
		convitesPorTcc,
		areasTcc,
		docentesBanca,
		docentesDisponiveis,
		// Estados de filtros
		cursoSelecionado,
		setCursoSelecionado,
		ano,
		setAno,
		semestre,
		setSemestre,
		fase,
		setFase,
		anosUnicos,
		semestresUnicos,
		fasesUnicas,
		// Estados de loading
		loadingCursos,
		loadingOfertasTcc,
		loadingDicentes,
		loadingTrabalhos,
		loadingAreas,
		loadingEdit,
		// Estados de mensagem
		openMessage,
		messageText,
		messageSeverity,
		handleCloseMessage,
		// Estados de upload
		openUploadModal,
		uploadFile,
		uploading,
		uploadResults,
		modalAno,
		setModalAno,
		modalSemestre,
		setModalSemestre,
		modalFase,
		setModalFase,
		modalCurso,
		setModalCurso,
		handleOpenUploadModal,
		handleCloseUploadModal,
		handleFileChange,
		handleUploadPDF,
		// Estados de edição
		openEditModal,
		selectedDicente,
		editData,
		mostrarSeletorHorario,
		setMostrarSeletorHorario,
		defesasAtual,
		convitesBancaAtual,
		convitesBancaFase1,
		convitesBancaFase2,
		selectedHorarioBanca,
		setSelectedHorarioBanca,
		handleOpenEditModal,
		handleCloseEditModal,
		handleEditDataChange,
		handleSaveEdit,
		// Funções auxiliares
		getOrientadorAtual,
		getOrientacaoAtual,
		getOrientadorNome,
		todosOsFiltrosSelecionados,
	} = useOrientacao(isOrientadorView);

	// Configuração das colunas do DataGrid
	const columns = [
		{ field: "matricula", headerName: "Matrícula", width: 150 },
		{ field: "nome", headerName: "Nome do Dicente", width: 350 },
		{ field: "email", headerName: "Email", width: 300 },
		{
			field: "orientador",
			headerName: "Orientador",
			width: 250,
			sortable: false,
			renderCell: (params) => {
				const orientadorNome = getOrientadorNome(params.row.matricula);
				return (
					<Typography variant="body2" color="text.secondary">
						{orientadorNome}
					</Typography>
				);
			},
		},
		{
			field: "acoes",
			headerName: "Ações",
			width: 120,
			sortable: false,
			renderCell: (params) => {
				return (
					<PermissionContext
						permissoes={[Permissoes.ORIENTACAO.EDITAR]}
						showError={false}
					>
						<Button
							variant="outlined"
							size="small"
							startIcon={<EditIcon />}
							onClick={(e) => {
								e.stopPropagation();
								handleOpenEditModal(params.row);
							}}
							disabled={!todosOsFiltrosSelecionados}
						>
							Editar
						</Button>
					</PermissionContext>
				);
			},
		},
		// Coluna Etapa/Nota - exibe quando ano e semestre estão selecionados
		...(ano && semestre
			? [
					{
						field: "etapaNota",
						headerName: "Etapa / Nota",
						width: 220,
						sortable: false,
						renderCell: (params) => {
							const tcc =
								trabalhosPorMatricula[params.row.matricula];
							const etapa = tcc?.etapa ?? null;
							const convites = tcc?.id
								? convitesPorTcc[tcc.id] || []
								: [];
							const defesas = tcc?.Defesas || tcc?.defesas || [];

							let showWarn = false;
							let tooltipText = "";

							let showSuccess = false;
							let successTooltip = "";

							if (etapa === 0) {
								const temConviteOrientacao =
									orientacaoController.temConviteOrientacao(
										convites,
									);
								const temOrientadorDefinido =
									!!getOrientadorAtual(params.row.matricula);
								if (
									!temConviteOrientacao &&
									!temOrientadorDefinido
								) {
									showWarn = true;
									tooltipText =
										"O estudante não enviou convite para orientação";
								} else if (
									temConviteOrientacao ||
									temOrientadorDefinido
								) {
									showSuccess = true;
									successTooltip = temOrientadorDefinido
										? "Orientador definido"
										: "Convite para orientação enviado";
								}
							} else if (
								etapa === 5 ||
								etapa === 7 ||
								(etapa === 8 && parseInt(tcc?.fase) === 2)
							) {
								const faseAtualTcc =
									tcc?.fase != null
										? parseInt(tcc.fase)
										: null;
								const temConviteBancaFase =
									orientacaoController.temConviteBancaNaFase(
										convites,
										faseAtualTcc,
										fase,
									);
								if (!temConviteBancaFase) {
									showWarn = true;
									tooltipText =
										"O estudante não enviou convite para banca";
								} else {
									showSuccess = true;
									successTooltip =
										"Convite para banca enviado";
								}
							} else if (etapa >= 1 && etapa <= 4) {
								const temOrientadorDefinido =
									!!getOrientadorAtual(params.row.matricula);
								if (temOrientadorDefinido) {
									showSuccess = true;
									successTooltip = "Orientador definido";
								}
							} else if (
								etapa === 6 ||
								etapa === 8 ||
								etapa === 9
							) {
								const faseAtualTcc =
									tcc?.fase != null
										? parseInt(tcc.fase)
										: null;
								const temConviteBancaFase =
									orientacaoController.temConviteBancaNaFase(
										convites,
										faseAtualTcc,
										fase,
									);
								if (temConviteBancaFase) {
									showSuccess = true;
									successTooltip =
										"Convites de banca enviados";
								}
							}

							const faseAtual =
								tcc?.fase != null ? parseInt(tcc.fase) : null;
							const defesasFase = Array.isArray(defesas)
								? defesas.filter((d) =>
										fase
											? parseInt(d.fase) === faseAtual
											: true,
									)
								: [];
							const media =
								orientacaoController.calcularMediaDefesa(
									defesasFase,
									faseAtual,
								);

							return (
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
									}}
								>
									<Typography variant="body2">
										{etapa != null
											? `Etapa ${etapa}`
											: "Etapa —"}
									</Typography>
									{showWarn && (
										<Tooltip title={tooltipText}>
											<WarningAmberIcon
												color="warning"
												fontSize="small"
											/>
										</Tooltip>
									)}
									{!showWarn && showSuccess && (
										<Tooltip title={successTooltip}>
											<CheckCircleIcon
												color="success"
												fontSize="small"
											/>
										</Tooltip>
									)}
									<Typography
										variant="body2"
										color={
											media != null
												? "text.primary"
												: "text.secondary"
										}
									>
										{media != null
											? `Nota ${media.toFixed(1)}`
											: "Nota —"}
									</Typography>
								</Box>
							);
						},
					},
				]
			: []),
	];

	return (
		<Box sx={{ width: 1400 }}>
			<Stack spacing={2} sx={{ width: "100%" }}>
				<Typography variant="h5" component="h2">
					{isOrientadorView
						? "Meus Trabalhos de Orientação"
						: "Gerenciamento de Orientações"}
				</Typography>

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
					loading={
						loadingCursos || loadingOfertasTcc || loadingDicentes
					}
					// Passar os anos e semestres únicos das ofertas TCC
					anosDisponiveis={anosUnicos}
					semestresDisponiveis={semestresUnicos}
					fasesDisponiveis={fasesUnicas}
					habilitarFiltroOrientacao={false}
				/>

				{/* Contador de dicentes em uma nova linha abaixo dos filtros */}
				<Box>
					{loadingDicentes ? (
						<Box display="flex" alignItems="center">
							<CircularProgress size={16} sx={{ mr: 1 }} />
							<Typography variant="body2" color="text.secondary">
								Carregando...
							</Typography>
						</Box>
					) : todosOsFiltrosSelecionados ? (
						<Typography variant="body2" color="text.secondary">
							{`${dicentesFiltrados.length} dicente${
								dicentesFiltrados.length !== 1 ? "s" : ""
							} encontrado${
								dicentesFiltrados.length !== 1 ? "s" : ""
							}`}
						</Typography>
					) : (
						<Typography variant="body2" color="text.secondary">
							{isOrientadorView
								? "Selecione curso, ano e semestre para visualizar seus orientandos"
								: "Selecione todos os filtros para visualizar dicentes"}
						</Typography>
					)}
				</Box>

				{!isOrientadorView && (
					<PermissionContext
						permissoes={[
							Permissoes.ORIENTACAO.CRIAR,
							Permissoes.ORIENTACAO.EDITAR,
						]}
						showError={false}
					>
						<Stack direction="row" spacing={2}>
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
				)}

				{/* Modal para upload de PDF - apenas no modo admin */}
				{!isOrientadorView && (
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
								<Typography
									variant="body2"
									color="text.secondary"
								>
									Selecione um arquivo PDF de lista de
									presença para importar dicentes
									automaticamente. O arquivo deve conter dados
									no formato: NOME seguido da MATRÍCULA. Os
									dicentes serão vinculados ao curso,
									ano/semestre e fase selecionados abaixo.
								</Typography>

								{/* Filtros para Curso, Ano/Semestre e Fase */}
								<FiltrosPesquisa
									cursoSelecionado={
										modalCurso ? modalCurso.id : ""
									}
									setCursoSelecionado={(valor) => {
										const curso = cursos.find(
											(c) => c.id === valor,
										);
										setModalCurso(curso || null);
									}}
									ano={modalAno}
									setAno={setModalAno}
									semestre={modalSemestre}
									setSemestre={setModalSemestre}
									fase={modalFase}
									setFase={setModalFase}
									cursos={cursos}
									loading={loadingCursos || loadingOfertasTcc}
									anosDisponiveis={anosUnicos}
									semestresDisponiveis={semestresUnicos}
									fasesDisponiveis={fasesUnicas}
									habilitarFiltroTodasFases={false}
									habilitarFiltroOrientacao={false}
								/>

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
										sx={{
											p: 2,
											bgcolor: "background.default",
										}}
									>
										<Typography variant="body2">
											<strong>
												Arquivo selecionado:
											</strong>{" "}
											{uploadFile.name}
										</Typography>
										<Typography variant="body2">
											<strong>Tamanho:</strong>{" "}
											{orientacaoController.formatarTamanhoArquivo(
												uploadFile.size,
											)}{" "}
											MB
										</Typography>
									</Paper>
								)}

								{uploading && (
									<Box>
										<Typography
											variant="body2"
											sx={{ mb: 1 }}
										>
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
											uploadResults.detalhes.length >
												0 && (
												<Box
													sx={{
														maxHeight: 200,
														overflow: "auto",
													}}
												>
													{uploadResults.detalhes
														.slice(0, 10)
														.map(
															(
																detalhe,
																index,
															) => (
																<Box
																	key={index}
																	sx={{
																		mb: 0.5,
																		display:
																			"flex",
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
																		-{" "}
																		{
																			detalhe.nome
																		}
																		:
																	</Typography>
																	<Chip
																		label={orientacaoController.obterLabelStatusUpload(
																			detalhe.status,
																		)}
																		size="small"
																		color={orientacaoController.obterCorStatusUpload(
																			detalhe.status,
																		)}
																	/>
																</Box>
															),
														)}
													{uploadResults.detalhes
														.length > 10 && (
														<Typography
															variant="body2"
															color="text.secondary"
														>
															... e mais{" "}
															{uploadResults
																.detalhes
																.length -
																10}{" "}
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
				)}

				{/* Modal de edição de orientação */}
				<Dialog
					open={openEditModal}
					onClose={handleCloseEditModal}
					aria-labelledby="edit-orientation-title"
					maxWidth="md"
					fullWidth
				>
					<DialogTitle id="edit-orientation-title">
						Editar Orientação - {selectedDicente?.nome}
					</DialogTitle>
					<DialogContent>
						{loadingEdit ? (
							<Box display="flex" justifyContent="center" p={3}>
								<CircularProgress />
							</Box>
						) : (
							<Stack spacing={3} sx={{ mt: 1 }}>
								{/* Informações do dicente */}
								<Paper
									sx={{ p: 2, bgcolor: "background.default" }}
								>
									<Typography variant="h6" gutterBottom>
										Informações do Dicente
									</Typography>
									<Grid container spacing={2}>
										<Grid item xs={12} md={4}>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												<strong>Matrícula:</strong>{" "}
												{selectedDicente?.matricula}
											</Typography>
										</Grid>
										<Grid item xs={12} md={4}>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												<strong>Fase:</strong> {fase}
											</Typography>
										</Grid>
										<Grid item xs={12} md={4}>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												<strong>Período:</strong> {ano}/
												{semestre}
											</Typography>
										</Grid>
									</Grid>
								</Paper>

								{/* Orientador e Etapa */}
								<Grid container spacing={3}>
									<Grid item xs={12}>
										{isOrientadorView ? (
											// No modo orientador, mostrar como campo de texto desabilitado
											<TextField
												fullWidth
												label="Orientador"
												value={(() => {
													const orientadorAtual =
														docentesDisponiveis.find(
															(docente) =>
																docente.codigo ===
																editData.orientador,
														);
													return (
														orientadorAtual?.nome ||
														usuario?.nome ||
														"Orientador não definido"
													);
												})()}
												disabled
												sx={{
													minWidth: 400,
													width: 720,
													maxWidth: "100%",
												}}
												helperText="Como orientador, você não pode alterar esta informação"
											/>
										) : (
											// No modo admin/professor, permitir edição
											<FormControl
												sx={{
													minWidth: 400,
													width: 720,
													maxWidth: "100%",
												}}
											>
												<InputLabel>
													Orientador
												</InputLabel>
												<Select
													value={editData.orientador}
													onChange={(e) =>
														handleEditDataChange(
															"orientador",
															e.target.value,
														)
													}
													label="Orientador"
													displayEmpty
												>
													<MenuItem value=""></MenuItem>
													{docentesDisponiveis.map(
														(docente) => (
															<MenuItem
																key={
																	docente.codigo
																}
																value={
																	docente.codigo
																}
															>
																{docente.nome}
															</MenuItem>
														),
													)}
												</Select>
											</FormControl>
										)}
									</Grid>
									<Grid item xs={12}>
										<FormControl fullWidth>
											<InputLabel>Etapa</InputLabel>
											<Select
												value={editData.etapa}
												onChange={(e) =>
													handleEditDataChange(
														"etapa",
														e.target.value,
													)
												}
												label="Etapa"
											>
												{(() => {
													const tccAtual =
														trabalhosPorMatricula[
															selectedDicente
																?.matricula
														];
													const faseTcc =
														tccAtual?.fase;
													const maxEtapa =
														orientacaoController.obterEtapaMaxima(
															faseTcc,
														);
													const etapas = [];
													for (
														let i = 0;
														i <= maxEtapa;
														i++
													) {
														etapas.push(
															<MenuItem
																key={i}
																value={i}
															>
																Etapa {i}
															</MenuItem>,
														);
													}
													return etapas;
												})()}
											</Select>
										</FormControl>
									</Grid>
								</Grid>

								{/* Banca de Defesa - exibir a partir da etapa 5 OU se houver histórico */}
								{(() => {
									const temHistoricoConvites =
										convitesBancaFase1.length > 0 ||
										convitesBancaFase2.length > 0 ||
										convitesBancaAtual.length > 0;
									const temHistoricoDefesas =
										defesasAtual.length > 0;

									return orientacaoController.deveMostrarCamposBanca(
										editData.etapa,
										temHistoricoConvites,
										temHistoricoDefesas,
									);
								})() && (
									<Paper
										sx={{
											p: 2,
											bgcolor: "background.default",
										}}
									>
										<Typography variant="h6" gutterBottom>
											{orientacaoController.obterTipoDefesa(
												editData.etapa,
											) === "TCC"
												? "Banca de Defesa de TCC"
												: "Banca de Defesa de Projeto"}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
											gutterBottom
										>
											{(() => {
												const tccAtual =
													trabalhosPorMatricula[
														selectedDicente
															?.matricula
													];
												const faseAtual = parseInt(
													tccAtual?.fase,
												);
												const edicaoHabilitada =
													orientacaoController.isEdicaoBancaHabilitada(
														editData.etapa,
														faseAtual,
													);

												return orientacaoController.obterMensagemAjudaBanca(
													editData.etapa,
													faseAtual,
													edicaoHabilitada,
												);
											})()}
										</Typography>

										{/* Data e Hora da Defesa - apenas para etapas 5 e 8 */}
										{(() => {
											const tccAtual =
												trabalhosPorMatricula[
													selectedDicente?.matricula
												];
											return orientacaoController.isEdicaoBancaHabilitada(
												editData.etapa,
												tccAtual?.fase,
											);
										})() && (
											<>
												<Box sx={{ mb: 3 }}>
													<LocalizationProvider
														dateAdapter={
															AdapterDateFns
														}
														adapterLocale={ptBR}
													>
														<DateTimePicker
															label="Data e Hora da Defesa"
															value={
																editData.dataHoraDefesa
															}
															onChange={(
																newValue,
															) => {
																const tccAtual =
																	trabalhosPorMatricula[
																		selectedDicente
																			?.matricula
																	];
																const edicaoHabilitada =
																	orientacaoController.isEdicaoBancaHabilitada(
																		editData.etapa,
																		tccAtual?.fase,
																	);

																if (
																	edicaoHabilitada
																) {
																	handleEditDataChange(
																		"dataHoraDefesa",
																		newValue,
																	);
																}
															}}
															disabled={(() => {
																const tccAtual =
																	trabalhosPorMatricula[
																		selectedDicente
																			?.matricula
																	];
																return !orientacaoController.isEdicaoBancaHabilitada(
																	editData.etapa,
																	tccAtual?.fase,
																);
															})()}
															renderInput={(
																params,
															) => (
																<TextField
																	{...params}
																	fullWidth
																	helperText={(() => {
																		const tccAtual =
																			trabalhosPorMatricula[
																				selectedDicente
																					?.matricula
																			];
																		const faseAtual =
																			parseInt(
																				tccAtual?.fase,
																			);
																		const edicaoHabilitada =
																			orientacaoController.isEdicaoBancaHabilitada(
																				editData.etapa,
																				faseAtual,
																			);

																		return orientacaoController.obterHelperTextDataDefesa(
																			edicaoHabilitada,
																			faseAtual,
																			editData.dataHoraDefesa,
																			editData.membroBanca1,
																			editData.membroBanca2,
																		);
																	})()}
																	error={
																		editData.dataHoraDefesa &&
																		(!editData.membroBanca1 ||
																			!editData.membroBanca2)
																	}
																/>
															)}
															ampm={false}
															format="dd/MM/yyyy HH:mm"
														/>
													</LocalizationProvider>
												</Box>

												{/* Botão para mostrar/ocultar seletor de horário baseado em disponibilidades */}
												{editData.orientador &&
													editData.membroBanca1 &&
													editData.membroBanca2 && (
														<Box sx={{ mb: 2 }}>
															<Button
																variant="outlined"
																onClick={() =>
																	setMostrarSeletorHorario(
																		!mostrarSeletorHorario,
																	)
																}
																size="small"
															>
																{mostrarSeletorHorario
																	? "Ocultar Horários Disponíveis"
																	: "Ver Horários Disponíveis dos Docentes"}
															</Button>
														</Box>
													)}

												{/* Seletor de horário baseado em disponibilidades */}
												{mostrarSeletorHorario &&
													editData.orientador &&
													editData.membroBanca1 &&
													editData.membroBanca2 && (
														<Box
															sx={{
																mb: 3,
																p: 2,
																bgcolor:
																	"background.default",
																borderRadius: 1,
															}}
														>
															<Typography
																variant="h6"
																gutterBottom
															>
																Horários Comuns
																Disponíveis
															</Typography>
															<SelecionarHorarioBanca
																oferta={{
																	ano: parseInt(
																		ano,
																	),
																	semestre:
																		parseInt(
																			semestre,
																		),
																	id_curso:
																		parseInt(
																			cursoSelecionado,
																		),
																	fase: (() => {
																		const tccAtual =
																			trabalhosPorMatricula[
																				selectedDicente
																					?.matricula
																			];
																		return parseInt(
																			tccAtual?.fase,
																		);
																	})(),
																}}
																codigoOrientador={
																	editData.orientador
																}
																codigosMembrosBanca={[
																	editData.membroBanca1,
																	editData.membroBanca2,
																]}
																onChange={(
																	slot,
																) => {
																	setSelectedHorarioBanca(
																		slot,
																	);
																	if (slot) {
																		// Converter data e hora para datetime
																		const dataHora =
																			new Date(
																				`${slot.data}T${slot.hora}`,
																			);
																		handleEditDataChange(
																			"dataHoraDefesa",
																			dataHora,
																		);
																	}
																}}
																selectedSlot={
																	selectedHorarioBanca
																}
															/>
														</Box>
													)}
											</>
										)}

										{/* Campos de seleção de membros da banca - apenas para etapas 5 e 8 */}
										{(() => {
											const tccAtual =
												trabalhosPorMatricula[
													selectedDicente?.matricula
												];
											return orientacaoController.isEdicaoBancaHabilitada(
												editData.etapa,
												tccAtual?.fase,
											);
										})() && (
											<Grid container spacing={3}>
												<Grid item xs={12} md={6}>
													<FormControl
														sx={{ minWidth: 400 }}
														fullWidth
														error={
															editData.dataHoraDefesa &&
															!editData.membroBanca1
														}
													>
														<InputLabel>
															{`1º Membro da Banca de ${orientacaoController.obterTipoDefesa(
																editData.etapa,
															)}${editData.dataHoraDefesa ? " *" : ""}`}
														</InputLabel>
														<Select
															value={
																editData.membroBanca1
															}
															onChange={(e) => {
																const tccAtual =
																	trabalhosPorMatricula[
																		selectedDicente
																			?.matricula
																	];
																const edicaoHabilitada =
																	orientacaoController.isEdicaoBancaHabilitada(
																		editData.etapa,
																		tccAtual?.fase,
																	);

																if (
																	edicaoHabilitada
																) {
																	handleEditDataChange(
																		"membroBanca1",
																		e.target
																			.value,
																	);
																}
															}}
															disabled={(() => {
																const tccAtual =
																	trabalhosPorMatricula[
																		selectedDicente
																			?.matricula
																	];
																return !orientacaoController.isEdicaoBancaHabilitada(
																	editData.etapa,
																	tccAtual?.fase,
																);
															})()}
															label={`1º Membro da Banca de ${orientacaoController.obterTipoDefesa(
																editData.etapa,
															)}${editData.dataHoraDefesa ? " *" : ""}`}
															displayEmpty
														>
															<MenuItem value=""></MenuItem>
															{orientacaoController
																.filtrarDocentesDisponiveis(
																	docentesBanca,
																	editData.orientador,
																	editData.membroBanca2,
																)
																.map((item) => (
																	<MenuItem
																		key={
																			item
																				.docente
																				?.codigo
																		}
																		value={
																			item
																				.docente
																				?.codigo
																		}
																	>
																		{
																			item
																				.docente
																				?.nome
																		}
																	</MenuItem>
																))}
														</Select>
													</FormControl>
												</Grid>
												<Grid item xs={12} md={6}>
													<FormControl
														sx={{ minWidth: 400 }}
														fullWidth
														error={
															editData.dataHoraDefesa &&
															!editData.membroBanca2
														}
													>
														<InputLabel>
															{`2º Membro da Banca de ${orientacaoController.obterTipoDefesa(
																editData.etapa,
															)}${editData.dataHoraDefesa ? " *" : ""}`}
														</InputLabel>
														<Select
															value={
																editData.membroBanca2
															}
															onChange={(e) => {
																const tccAtual =
																	trabalhosPorMatricula[
																		selectedDicente
																			?.matricula
																	];
																const edicaoHabilitada =
																	orientacaoController.isEdicaoBancaHabilitada(
																		editData.etapa,
																		tccAtual?.fase,
																	);

																if (
																	edicaoHabilitada
																) {
																	handleEditDataChange(
																		"membroBanca2",
																		e.target
																			.value,
																	);
																}
															}}
															disabled={(() => {
																const tccAtual =
																	trabalhosPorMatricula[
																		selectedDicente
																			?.matricula
																	];
																return !orientacaoController.isEdicaoBancaHabilitada(
																	editData.etapa,
																	tccAtual?.fase,
																);
															})()}
															label={`2º Membro da Banca de ${orientacaoController.obterTipoDefesa(
																editData.etapa,
															)}${editData.dataHoraDefesa ? " *" : ""}`}
															displayEmpty
														>
															<MenuItem value=""></MenuItem>
															{orientacaoController
																.filtrarDocentesDisponiveis(
																	docentesBanca,
																	editData.orientador,
																	editData.membroBanca1,
																)
																.map((item) => (
																	<MenuItem
																		key={
																			item
																				.docente
																				?.codigo
																		}
																		value={
																			item
																				.docente
																				?.codigo
																		}
																	>
																		{
																			item
																				.docente
																				?.nome
																		}
																	</MenuItem>
																))}
														</Select>
													</FormControl>
												</Grid>
											</Grid>
										)}

										{/* Informações sobre convites existentes por fase */}
										{(() => {
											const tccAtual =
												trabalhosPorMatricula[
													selectedDicente?.matricula
												];
											const faseAtual = parseInt(
												tccAtual?.fase,
											);
											const etapaAtual = parseInt(
												editData.etapa,
											);

											return (
												<>
													{/* Convites de Fase 1 - sempre somente leitura */}
													{convitesBancaFase1.length >
														0 && (
														<Box
															sx={{
																mb: 2,
																p: 1,
																bgcolor:
																	"grey.100",
																borderRadius: 1,
															}}
														>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																<strong>
																	Banca de
																	Defesa de
																	Projeto
																	(histórico):
																</strong>
															</Typography>
															{convitesBancaFase1.map(
																(
																	convite,
																	index,
																) => (
																	<Typography
																		key={
																			index
																		}
																		variant="body2"
																		color="text.secondary"
																	>
																		•{" "}
																		{docentesDisponiveis.find(
																			(
																				d,
																			) =>
																				d.codigo ===
																				convite.codigo_docente,
																		)
																			?.nome ||
																			convite.codigo_docente}{" "}
																		-
																		{convite.aceito
																			? " Aceito"
																			: " Pendente"}
																		{convite.aceito &&
																			` (${new Date(
																				convite.data_feedback,
																			).toLocaleDateString()})`}
																	</Typography>
																),
															)}
														</Box>
													)}

													{/* Convites de Fase 2 - editáveis quando etapa 8 */}
													{faseAtual === 2 &&
														convitesBancaFase2.length >
															0 && (
															<Box
																sx={{
																	mb: 2,
																	p: 1,
																	bgcolor:
																		etapaAtual ===
																		8
																			? "info.light"
																			: "grey.100",
																	borderRadius: 1,
																}}
															>
																<Typography
																	variant="body2"
																	color={
																		etapaAtual ===
																		8
																			? "info.contrastText"
																			: "text.secondary"
																	}
																>
																	<strong>
																		{etapaAtual ===
																		8
																			? "Banca de Defesa de TCC:"
																			: "Banca de Defesa de TCC (histórico):"}
																	</strong>
																</Typography>
																{convitesBancaFase2.map(
																	(
																		convite,
																		index,
																	) => (
																		<Typography
																			key={
																				index
																			}
																			variant="body2"
																			color={
																				etapaAtual ===
																				8
																					? "info.contrastText"
																					: "text.secondary"
																			}
																		>
																			•{" "}
																			{docentesDisponiveis.find(
																				(
																					d,
																				) =>
																					d.codigo ===
																					convite.codigo_docente,
																			)
																				?.nome ||
																				convite.codigo_docente}{" "}
																			-
																			{convite.aceito
																				? " Aceito"
																				: " Pendente"}
																			{convite.aceito &&
																				` (${new Date(
																					convite.data_feedback,
																				).toLocaleDateString()})`}
																		</Typography>
																	),
																)}
															</Box>
														)}

													{/* Convites da fase atual (para compatibilidade) */}
													{faseAtual === 1 &&
														convitesBancaAtual.length >
															0 && (
															<Box
																sx={{
																	mb: 2,
																	p: 1,
																	bgcolor:
																		"info.light",
																	borderRadius: 1,
																}}
															>
																<Typography
																	variant="body2"
																	color="info.contrastText"
																>
																	<strong>
																		Banca de
																		Defesa
																		de
																		Projeto:
																	</strong>
																</Typography>
																{convitesBancaAtual.map(
																	(
																		convite,
																		index,
																	) => (
																		<Typography
																			key={
																				index
																			}
																			variant="body2"
																			color="info.contrastText"
																		>
																			•{" "}
																			{docentesDisponiveis.find(
																				(
																					d,
																				) =>
																					d.codigo ===
																					convite.codigo_docente,
																			)
																				?.nome ||
																				convite.codigo_docente}{" "}
																			-
																			{convite.aceito
																				? " Aceito"
																				: " Pendente"}
																			{convite.aceito &&
																				` (${new Date(
																					convite.data_feedback,
																				).toLocaleDateString()})`}
																		</Typography>
																	),
																)}
															</Box>
														)}
												</>
											);
										})()}
									</Paper>
								)}

								{/* Tema */}
								<TextField
									fullWidth
									label="Tema"
									value={editData.tema}
									onChange={(e) =>
										handleEditDataChange(
											"tema",
											e.target.value,
										)
									}
									multiline
									rows={2}
									helperText="Descreva o tema do trabalho de conclusão"
								/>

								{/* Título */}
								<TextField
									fullWidth
									label="Título"
									value={editData.titulo}
									onChange={(e) =>
										handleEditDataChange(
											"titulo",
											e.target.value,
										)
									}
									multiline
									rows={2}
									helperText="Título do trabalho de conclusão"
								/>

								{/* Resumo */}
								<TextField
									fullWidth
									label="Resumo"
									value={editData.resumo}
									onChange={(e) =>
										handleEditDataChange(
											"resumo",
											e.target.value,
										)
									}
									multiline
									rows={4}
									helperText="Resumo do trabalho de conclusão"
								/>

								{/* Seminário de Andamento - apenas para fase 2 */}
								{(() => {
									const tccAtual =
										trabalhosPorMatricula[
											selectedDicente?.matricula
										];
									return parseInt(tccAtual?.fase) === 2;
								})() && (
									<TextField
										fullWidth
										label="Seminário de Andamento"
										value={editData.seminarioAndamento}
										onChange={(e) =>
											handleEditDataChange(
												"seminarioAndamento",
												e.target.value,
											)
										}
										multiline
										rows={4}
										helperText="Informações sobre o seminário de andamento (disponível apenas para Fase 2)"
									/>
								)}
							</Stack>
						)}
					</DialogContent>
					<DialogActions>
						<Button
							onClick={handleCloseEditModal}
							disabled={loadingEdit}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleSaveEdit}
							variant="contained"
							color="primary"
							startIcon={<SaveIcon />}
							disabled={loadingEdit}
						>
							{loadingEdit ? "Salvando..." : "Salvar"}
						</Button>
					</DialogActions>
				</Dialog>

				{/* (Opcional) Dica de filtros removida para exibir todos os dicentes por padrão */}

				{/* DataGrid de dicentes e orientações */}
				<PermissionContext
					permissoes={[
						Permissoes.ORIENTACAO.VISUALIZAR,
						Permissoes.ORIENTACAO.VISUALIZAR_TODAS,
					]}
				>
					<Box style={{ height: "500px" }}>
						<DataGrid
							rows={dicentesFiltrados}
							columns={columns}
							pageSize={10}
							checkboxSelection={false}
							disableRowSelectionOnClick
							getRowId={(row) => row.matricula}
							initialState={{
								sorting: {
									sortModel: [{ field: "nome", sort: "asc" }],
								},
							}}
						/>
					</Box>
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
			</Stack>
		</Box>
	);
}
