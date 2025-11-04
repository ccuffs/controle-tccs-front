import React from "react";
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Stack,
	Typography,
	TextField,
	Button,
	Checkbox,
	FormControlLabel,
	Snackbar,
	Alert,
	Tooltip,
	CircularProgress,
	Chip,
	Card,
	CardContent,
	CardActions,
	Divider,
} from "@mui/material";

import FiltrosPesquisa from "../utils/FiltrosPesquisa";
import { useAvaliarDefesasOrientador } from "../../hooks/useAvaliarDefesasOrientador";

export default function AvaliarDefesasOrientador() {
	const theme = useTheme();

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
		cardsPorTcc,
		mapaTcc,
		// Estados de UI
		loading,
		openMessage,
		messageText,
		messageSeverity,
		handleCloseMessage,
		// Estados de edição
		avaliacoesEdicao,
		editandoTcc,
		comentariosTcc,
		aprovandoTcc,
		tccAprovadoLocal,
		edicaoAprovadoTcc,
		// Handlers
		handleAvaliacaoChange,
		handleComentarioChange,
		handleAprovadoTccChange,
		iniciarEdicao,
		cancelarEdicao,
		salvarAvaliacoesDoTcc,
		aprovarTcc,
	} = useAvaliarDefesasOrientador();

	return (
		<Box>
			<Stack spacing={2}>
				<Typography variant="h6" component="h3">
					Avaliar Defesas
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
					habilitarCurso
					habilitarAno
					habilitarSemestre
					habilitarFase
					habilitarFiltroOrientacao={false}
					mostrarTodosCursos={false}
					loading={loading}
				/>

				{loading ? (
					<Stack direction="row" alignItems="center" spacing={1}>
						<CircularProgress size={20} />
						<Typography>Carregando...</Typography>
					</Stack>
				) : (
					<>
						<Box>
							<Typography
								variant="body2"
								color="text.secondary"
								gutterBottom
							>
								Total de TCCs: {cardsPorTcc.length}
							</Typography>

							<Stack spacing={2}>
								{cardsPorTcc.map((card) => (
									<Card
										key={card.chaveUnica}
										variant="outlined"
										sx={{
											backgroundColor:
												theme.palette.background
													.default,
										}}
									>
										<CardContent>
											<Stack spacing={1}>
												<Typography
													variant="h6"
													component="h4"
												>
													{card.nomeDicente}
												</Typography>

												<Stack
													direction="row"
													spacing={2}
													flexWrap="wrap"
												>
													<Typography
														variant="body2"
														color="text.secondary"
													>
														<strong>
															Matrícula:
														</strong>{" "}
														{card.matriculaDicente}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
													>
														<strong>
															Título do TCC:
														</strong>{" "}
														{card.tituloTcc}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
													>
														<strong>Curso:</strong>{" "}
														{card.nomeCurso}
													</Typography>
													<Stack
														direction="row"
														spacing={1}
														alignItems="center"
													>
														<Typography
															variant="body2"
															color="text.secondary"
														>
															<strong>
																Fase:
															</strong>
														</Typography>
														<Chip
															label={
																card.fase === 1
																	? "Projeto"
																	: "TCC"
															}
															size="small"
															color={
																card.fase === 1
																	? "info"
																	: "primary"
															}
															variant="outlined"
														/>
													</Stack>
													<Stack
														direction="row"
														spacing={1}
														alignItems="center"
													>
														<Typography
															variant="body2"
															color="text.secondary"
														>
															<strong>
																Média:
															</strong>
														</Typography>
														{card.avaliacoesCompletas &&
														card.media !== null ? (
															<Chip
																label={card.media.toFixed(
																	2,
																)}
																size="small"
																color={
																	card.media >=
																	6
																		? "success"
																		: "error"
																}
																variant="outlined"
															/>
														) : (
															<Typography
																variant="body2"
																color="text.secondary"
															>
																Incompleta
															</Typography>
														)}
													</Stack>
													<Typography
														variant="body2"
														color="text.secondary"
													>
														<strong>
															Data da Defesa:
														</strong>{" "}
														{card.dataDefesa}
													</Typography>
													<FormControlLabel
														control={
															<Checkbox
																checked={Boolean(
																	card.fase ===
																		1
																		? card.aprovadoAutomatico
																		: editandoTcc[
																					card
																						.chaveUnica
																			  ]
																			? edicaoAprovadoTcc[
																					card
																						.idTcc
																				]
																			: (tccAprovadoLocal[
																					card
																						.idTcc
																				] ??
																				mapaTcc.get(
																					card.idTcc,
																				)
																					?.aprovado_tcc),
																)}
																disabled={
																	card.fase ===
																	1
																		? !card.avaliacoesCompletas
																		: !editandoTcc[
																				card
																					.chaveUnica
																			] // Para fase 2, habilitado apenas em modo edição
																}
																onChange={(
																	e,
																) => {
																	if (
																		card.fase ===
																			2 &&
																		editandoTcc[
																			card
																				.chaveUnica
																		]
																	) {
																		handleAprovadoTccChange(
																			card.idTcc,
																			e
																				.target
																				.checked,
																		);
																	}
																}}
																color={
																	(
																		card.fase ===
																		1
																			? card.aprovadoAutomatico
																			: editandoTcc[
																						card
																							.chaveUnica
																				  ]
																				? edicaoAprovadoTcc[
																						card
																							.idTcc
																					]
																				: (tccAprovadoLocal[
																						card
																							.idTcc
																					] ??
																					mapaTcc.get(
																						card.idTcc,
																					)
																						?.aprovado_tcc)
																	)
																		? "success"
																		: "default"
																}
															/>
														}
														label={`Aprovado ${
															card.fase === 1
																? "Projeto"
																: "TCC"
														}`}
													/>
												</Stack>

												<Divider sx={{ my: 2 }} />

												<Typography variant="subtitle1">
													Banca e Orientador
												</Typography>
												<Box
													sx={{
														display: "grid",
														gap: 2,
														gridTemplateColumns: {
															xs: "1fr",
															sm: "repeat(2, 1fr)",
															md: "repeat(3, 1fr)",
														},
														mt: 1,
													}}
												>
													{card.membros.map((m) => (
														<Stack
															key={m.chave}
															spacing={0.5}
														>
															<Typography
																variant="body2"
																sx={{
																	fontWeight: 500,
																}}
															>
																{
																	m.nomeMembroBanca
																}
															</Typography>
															<Box
																sx={{
																	width: 100,
																}}
															>
																<TextField
																	placeholder="Ex: 8.5"
																	size="small"
																	type="number"
																	value={
																		m.valorAvaliacao
																	}
																	onChange={(
																		e,
																	) =>
																		handleAvaliacaoChange(
																			card.idTcc,
																			m.membroBanca,
																			card.fase,
																			e
																				.target
																				.value,
																		)
																	}
																	inputProps={{
																		step: "0.1",
																		min: 0,
																	}}
																	disabled={
																		Boolean(
																			m.salvo,
																		) &&
																		!editandoTcc[
																			card
																				.chaveUnica
																		]
																	}
																/>
															</Box>
														</Stack>
													))}
												</Box>

												{/* Campo de comentários apenas para fase 2 (TCC) */}
												{card.fase === 2 && (
													<>
														<Divider
															sx={{ my: 2 }}
														/>
														<Typography variant="subtitle1">
															Comentários do TCC
														</Typography>
														<TextField
															fullWidth
															multiline
															rows={3}
															placeholder="Digite os comentários sobre o TCC..."
															value={
																comentariosTcc[
																	card.idTcc
																] || ""
															}
															onChange={(e) =>
																handleComentarioChange(
																	card.idTcc,
																	e.target
																		.value,
																)
															}
															disabled={
																!editandoTcc[
																	card
																		.chaveUnica
																]
															}
															sx={{ mt: 1 }}
														/>
													</>
												)}
											</Stack>
										</CardContent>
										<CardActions
											sx={{ justifyContent: "flex-end" }}
										>
											{editandoTcc[card.chaveUnica] ? (
												<Stack
													direction="row"
													spacing={1}
												>
													<Tooltip title="Salvar avaliações deste card">
														<span>
															<Button
																variant="contained"
																color="primary"
																onClick={() =>
																	salvarAvaliacoesDoTcc(
																		card.chaveUnica,
																	)
																}
															>
																Salvar
															</Button>
														</span>
													</Tooltip>
													<Button
														variant="outlined"
														color="error"
														onClick={() =>
															cancelarEdicao(
																card.chaveUnica,
															)
														}
													>
														Cancelar
													</Button>
												</Stack>
											) : (
												<>
													{/* Verifica se algum membro já tem avaliação salva */}
													{card.membros.some(
														(m) => m.salvo,
													) ? (
														<Stack
															direction="row"
															spacing={1}
														>
															<Button
																variant="outlined"
																color="primary"
																onClick={() =>
																	iniciarEdicao(
																		card.chaveUnica,
																	)
																}
															>
																Editar
															</Button>
															{/* Botão Aprovar TCC apenas para fase 2 */}
															{card.fase === 2 &&
																!(editandoTcc[
																	card
																		.chaveUnica
																]
																	? edicaoAprovadoTcc[
																			card
																				.idTcc
																		]
																	: (tccAprovadoLocal[
																			card
																				.idTcc
																		] ??
																		mapaTcc.get(
																			card.idTcc,
																		)
																			?.aprovado_tcc)) && (
																	<Button
																		variant="contained"
																		color="success"
																		onClick={() =>
																			aprovarTcc(
																				card.idTcc,
																			)
																		}
																		disabled={
																			aprovandoTcc[
																				card
																					.idTcc
																			]
																		}
																	>
																		{aprovandoTcc[
																			card
																				.idTcc
																		] ? (
																			<CircularProgress
																				size={
																					20
																				}
																			/>
																		) : (
																			"Aprovar TCC"
																		)}
																	</Button>
																)}
														</Stack>
													) : (
														<Stack
															direction="row"
															spacing={1}
														>
															<Button
																variant="contained"
																color="primary"
																onClick={() =>
																	salvarAvaliacoesDoTcc(
																		card.chaveUnica,
																	)
																}
															>
																Salvar
															</Button>
															<Button
																variant="outlined"
																color="error"
																onClick={() =>
																	cancelarEdicao(
																		card.chaveUnica,
																	)
																}
															>
																Cancelar
															</Button>
														</Stack>
													)}
												</>
											)}
										</CardActions>
									</Card>
								))}
							</Stack>
						</Box>
					</>
				)}

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
