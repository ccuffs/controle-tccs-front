import { useEffect } from "react";
import {
	Box,
	Stepper,
	Step,
	StepLabel,
	Button,
	Typography,
	TextField,
	Paper,
	Alert,
	CircularProgress,
	LinearProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	DialogContentText,
	Chip,
} from "@mui/material";
import { formatarDataDefesaUTC, formatarData, formatarHora } from "../../controllers/disponibilidade-banca-controller";
import type { Convite } from "../../types/convite";
import VisualizarTemasTCC from "./VisualizarTemasTCC";
import ConviteOrientadorModal from "./ConviteOrientadorModal";
import ConviteBancaModal from "./ConviteBancaModal";
import SelecionarHorarioBanca from "./SelecionarHorarioBanca";
import { Button as BotaoDesign, useNotice } from "../ui";
import EtapaTemaTituloResumo from "../discente/etapas/EtapaTemaTituloResumo";
import { useJornadaTcc, steps, type ConviteLocal } from "./useJornadaTcc";
import type { ContextoTcc } from "./useJornadaTcc";

export type { ContextoTcc };

interface TccStepperProps {
	etapaInicial?: number;
	onEtapaChange?: (etapa: number) => void;
	/** Novo design: esconde título, cartão da oferta e o indicador de etapas (a tela "Meu TCC" os exibe). */
	modoJornada?: boolean;
	onContexto?: (contexto: ContextoTcc) => void;
}

export default function TccStepper({ etapaInicial = 0, onEtapaChange, modoJornada = false, onContexto }: TccStepperProps) {
	const {
		theme,
		activeStep,
		setActiveStep,
		loading,
		saving,
		trabalhoConclusao,
		ofertaAtual,
		formData,
		openMessage,
		messageText,
		messageSeverity,
		openConviteModal,
		conviteExistente,
		convitesBanca,
		openConviteBancaModal,
		openConviteBancaFinalModal,
		tccAnterior,
		openImportModal,
		showCompletedMessage,
		modalType,
		selectedHorarioBancaFase1,
		setSelectedHorarioBancaFase1,
		selectedHorarioBancaFase2,
		setSelectedHorarioBancaFase2,
		defesasFase1,
		defesasFase2,
		temDefesaAgendada,
		obterDadosDefesaAgendada,
		getEtapasValidas,
		validarEtapaAtual,
		handleNext,
		handleBack,
		handleInputChange,
		handleOpenConviteModal,
		handleCloseConviteModal,
		handleOpenConviteBancaModal,
		handleCloseConviteBancaModal,
		handleOpenConviteBancaFinalModal,
		handleCloseConviteBancaFinalModal,
		handleConviteEnviado,
		handleConviteBancaEnviado,
		handleImportModalClose,
		handleImportData,
		handleCloseMessage,
		salvarTemaTituloResumo,
	} = useJornadaTcc({ etapaInicial, onEtapaChange, onContexto });

	// Avisos no Snackbar único do app (useNotice), como nas demais telas do novo design.
	const notificar = useNotice();
	useEffect(() => {
		if (!openMessage) return;
		notificar(messageText, messageSeverity);
		handleCloseMessage(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openMessage]);

	const renderStepContent = (step: number) => {
		switch (step) {
			case 0:
				return (
					<Box sx={{ mt: 2 }}>
						{/* Seção de Convite para Orientador - Posicionada acima do VisualizarTemasTCC */}
						{trabalhoConclusao && (
							<Paper
								sx={{
									p: 3,
									mb: 3,
									backgroundColor:
										theme.palette.background.default,
								}}
							>
								<Typography variant="h6" gutterBottom>
									Convite para Orientador
								</Typography>

								{conviteExistente ? (
									<Box>
										<Alert
											severity={
												conviteExistente.aceito
													? "success"
													: "warning"
											}
											sx={{ mb: 2 }}
										>
											<Typography variant="body2">
												<strong>
													Status do Convite:
												</strong>{" "}
												{conviteExistente.aceito
													? "Aceito"
													: "Pendente"}
											</Typography>
											{conviteExistente.data_envio && (
												<Typography variant="body2">
													<strong>Enviado em:</strong>{" "}
													{new Date(
														conviteExistente.data_envio,
													).toLocaleDateString(
														"pt-BR",
													)}
												</Typography>
											)}
											{conviteExistente.docente && (
												<Typography variant="body2">
													<strong>Orientador:</strong>{" "}
													{
														conviteExistente.docente
															.nome
													}
												</Typography>
											)}
										</Alert>

										<Button
											variant="outlined"
											onClick={handleOpenConviteModal}
											disabled={conviteExistente.aceito}
										>
											{conviteExistente.aceito
												? "Convite Aceito"
												: "Ver Detalhes do Convite"}
										</Button>
									</Box>
								) : (
									<Box>
										{conviteExistente &&
										!(conviteExistente as ConviteLocal).aceito ? (
											<Alert
												severity="info"
												sx={{ mb: 2 }}
											>
												<Typography variant="body2">
													Você já possui um convite
													pendente para um orientador.
													Aguarde a resposta antes de
													prosseguir com o TCC.
												</Typography>
											</Alert>
										) : (
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ mb: 2 }}
											>
												Para prosseguir com o TCC, você
												precisa enviar um convite para
												um orientador.
											</Typography>
										)}

										<Button
											variant="contained"
											onClick={handleOpenConviteModal}
											disabled={Boolean(
												conviteExistente &&
												!(conviteExistente as ConviteLocal).aceito,
											)}
										>
											{conviteExistente &&
											!(conviteExistente as ConviteLocal).aceito
												? "Convite Pendente"
												: "Enviar Convite para Orientador"}
										</Button>
									</Box>
								)}
							</Paper>
						)}

						<VisualizarTemasTCC />
					</Box>
				);
			case 1:
			case 2:
			case 3:
				return (
					<EtapaTemaTituloResumo
						dados={{ tema: formData.tema ?? "", titulo: formData.titulo ?? "", resumo: formData.resumo ?? "" }}
						onChange={(campo, valor) => handleInputChange(campo, valor)}
					/>
				);
			case 4:
				return (
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6" gutterBottom>
							Etapa 5: Convite para Banca de Avaliação do Projeto
						</Typography>

						{trabalhoConclusao && (
							<Paper
								sx={{
									p: 3,
									mb: 3,
									backgroundColor:
										theme.palette.background.default,
								}}
							>
								<Typography variant="h6" gutterBottom>
									Composição da Banca de Avaliação do Projeto
								</Typography>

								{/* Filtrar apenas convites da fase 1 (banca do projeto) */}
								{(() => {
									const convitesBancaFase1 =
										convitesBanca.filter(
											(c) => c.fase === 1,
										);
									const convitesAceitosFase1 =
										convitesBancaFase1.filter(
											(c) => c.aceito === true,
										);

									return (
										<>
											{/* Mostrar mensagem explicativa apenas se não há convites aceitos ainda */}
											{convitesAceitosFase1.length ===
												0 && (
												<Alert
													severity="info"
													sx={{ mb: 2 }}
												>
													<Typography variant="body2">
														Para prosseguir, você
														precisa convidar 2
														docentes para compor a
														banca de avaliação do
														seu projeto. Você pode
														enviar até 2 convites
														por vez.
													</Typography>
												</Alert>
											)}

											{convitesBancaFase1.length > 0 ? (
												<Box>
													{/* Mostrar status detalhado dos convites da fase 1 */}
													<Typography
														variant="subtitle1"
														gutterBottom
													>
														Status dos Convites para
														Banca do Projeto:
													</Typography>

													{convitesBancaFase1.map(
														(convite, index) => (
															<Alert
																key={index}
																severity={
																	convite.aceito ===
																	true
																		? "success"
																		: convite.data_feedback &&
																			  !convite.aceito
																			? "error"
																			: "warning"
																}
																sx={{ mb: 2 }}
															>
																<Typography variant="body2">
																	<strong>
																		Docente:
																	</strong>{" "}
																	{convite
																		.docente
																		?.nome ||
																		convite.codigo_docente}
																</Typography>
																<Typography variant="body2">
																	<strong>
																		Status:
																	</strong>{" "}
																	{convite.aceito ===
																	true
																		? "Aceito"
																		: convite.data_feedback &&
																			  !convite.aceito
																			? "Recusado"
																			: "Pendente"}
																</Typography>
																{convite.data_envio && (
																	<Typography variant="body2">
																		<strong>
																			Enviado
																			em:
																		</strong>{" "}
																		{new Date(
																			convite.data_envio,
																		).toLocaleDateString(
																			"pt-BR",
																		)}
																	</Typography>
																)}
																{convite.data_feedback && (
																	<Typography variant="body2">
																		<strong>
																			Respondido
																			em:
																		</strong>{" "}
																		{new Date(
																			convite.data_feedback,
																		).toLocaleDateString(
																			"pt-BR",
																		)}
																	</Typography>
																)}
																{convite.mensagem_feedback &&
																	convite.data_feedback && (
																		<Typography variant="body2">
																			<strong>
																				Mensagem
																				do
																				docente:
																			</strong>{" "}
																			{
																				convite.mensagem_feedback
																			}
																		</Typography>
																	)}
																{convite.mensagem_envio && (
																	<Typography
																		variant="body2"
																		sx={{
																			mt: 1,
																			fontStyle:
																				"italic",
																		}}
																	>
																		<strong>
																			Sua
																			mensagem:
																		</strong>{" "}
																		"
																		{
																			convite.mensagem_envio
																		}
																		"
																	</Typography>
																)}
															</Alert>
														),
													)}

													{/* Resumo visual com chips para fase 1 */}
													<Box sx={{ mb: 2 }}>
														<Typography
															variant="body2"
															color="text.secondary"
															gutterBottom
														>
															Resumo:
														</Typography>
														<Box
															sx={{
																display: "flex",
																flexWrap:
																	"wrap",
																gap: 1,
															}}
														>
															<Chip
																label={`${convitesAceitosFase1.length} Aceito(s)`}
																color="success"
																size="small"
															/>
															<Chip
																label={`${
																	convitesBancaFase1.filter(
																		(c) =>
																			!c.data_feedback,
																	).length
																} Pendente(s)`}
																color="warning"
																size="small"
															/>
															<Chip
																label={`${
																	convitesBancaFase1.filter(
																		(c) =>
																			c.data_feedback &&
																			!c.aceito,
																	).length
																} Recusado(s)`}
																color="error"
																size="small"
															/>
														</Box>
													</Box>

													{convitesAceitosFase1.length ===
													2 ? (
														<Alert
															severity="success"
															sx={{ mb: 2 }}
														>
															<Typography variant="body2">
																🎉 Excelente!
																Sua banca de
																avaliação está
																completa com 2
																membros
																confirmados.
																Agora você pode
																prosseguir para
																a próxima etapa.
															</Typography>
														</Alert>
													) : (
														<Button
															variant="contained"
															onClick={
																handleOpenConviteBancaModal
															}
															disabled={
																convitesBancaFase1.filter(
																	(c) =>
																		!c.data_feedback,
																).length >= 2
															}
														>
															{convitesBancaFase1.filter(
																(c) =>
																	!c.data_feedback,
															).length >= 2
																? "Limite de Convites Atingido"
																: `Enviar ${
																		2 -
																		convitesAceitosFase1.length
																	} Convite(s) para Banca do Projeto`}
														</Button>
													)}
												</Box>
											) : (
												<Box>
													<Typography
														variant="body2"
														color="text.secondary"
														sx={{ mb: 2 }}
													>
														Você ainda não enviou
														convites para a banca de
														avaliação do projeto.
													</Typography>
													<Button
														variant="contained"
														onClick={
															handleOpenConviteBancaModal
														}
													>
														Enviar 2 Convites para
														Banca do Projeto
													</Button>
												</Box>
											)}
										</>
									);
								})()}
							</Paper>
						)}
					</Box>
				);
			case 5: {
				// Etapa 6: Selecionar horário da banca do Projeto (Fase 1)
				if (!trabalhoConclusao) return null;
				if (trabalhoConclusao.fase === 1) {
					const codigoOrientadorF1 = conviteExistente?.aceito
						? conviteExistente.codigo_docente
						: null;
					const membrosAceitosFase1 = convitesBanca
						.filter(
							(c) =>
								c.aceito === true &&
								!!c.data_feedback &&
								c.fase === 1,
						)
						.map((c) => c.codigo_docente);

					// Verificar se já existe defesa agendada para fase 1
					const jaTemDefesaFase1 = temDefesaAgendada(1);
					const dadosDefesaFase1 = obterDadosDefesaAgendada(1);

					return (
						<Box sx={{ mt: 2 }}>
							<Typography variant="h6" gutterBottom>
								Etapa 6: Selecionar Horário da Banca do Projeto
							</Typography>

							{/* Se já tem defesa agendada, mostrar apenas o resumo */}
							{jaTemDefesaFase1 && dadosDefesaFase1 ? (
								<Paper sx={{ p: 3, mb: 2 }}>
									<Alert severity="success" sx={{ mb: 2 }}>
										<Typography variant="body2">
											✅{" "}
											<strong>
												Horário já selecionado!
											</strong>{" "}
											A defesa da banca do projeto já foi
											agendada.
										</Typography>
									</Alert>

									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Horário da Defesa do Projeto
									</Typography>
									<Alert severity="info" sx={{ mb: 2 }}>
										<Typography variant="body2">
											<strong>Data:</strong>{" "}
											{dadosDefesaFase1.dataStr}
										</Typography>
										<Typography variant="body2">
											<strong>Horário:</strong>{" "}
											{dadosDefesaFase1.horaStr}
										</Typography>
									</Alert>

									{/* Mostrar notas da banca se disponíveis */}
									{defesasFase1 &&
										defesasFase1.length > 0 && (
											<Box>
												<Typography
													variant="subtitle1"
													gutterBottom
												>
													Avaliações da Banca
												</Typography>
												{defesasFase1.map((d, idx) => (
													<Alert
														key={idx}
														severity={
															d.avaliacao != null
																? "info"
																: "warning"
														}
														sx={{ mb: 1 }}
													>
														<Typography variant="body2">
															<strong>
																Docente:
															</strong>{" "}
															{d.membroBanca
																?.nome ||
																d.membro_banca}
														</Typography>
														<Typography variant="body2">
															<strong>
																Nota:
															</strong>{" "}
															{d.avaliacao != null
																? Number(
																		d.avaliacao,
																	).toFixed(1)
																: "Aguardando avaliação"}
														</Typography>
													</Alert>
												))}
											</Box>
										)}
								</Paper>
							) : (
								/* Se não tem defesa agendada, mostrar seleção de horário */
								<Box>
									{!codigoOrientadorF1 && (
										<Alert
											severity="warning"
											sx={{ mb: 2 }}
										>
											O convite ao orientador ainda não
											foi aceito.
										</Alert>
									)}
									{membrosAceitosFase1.length !== 2 && (
										<Alert
											severity="warning"
											sx={{ mb: 2 }}
										>
											É necessário ter 2 docentes
											convidados com convite aceito para a
											banca do projeto.
										</Alert>
									)}
									{codigoOrientadorF1 &&
										membrosAceitosFase1.length === 2 && (
											<SelecionarHorarioBanca
												oferta={{
													ano: trabalhoConclusao.ano,
													semestre:
														trabalhoConclusao.semestre,
													id_curso:
														trabalhoConclusao.id_curso,
													fase: 1,
												}}
												codigoOrientador={
													codigoOrientadorF1
												}
												codigosMembrosBanca={
													membrosAceitosFase1
												}
												selectedSlot={
													selectedHorarioBancaFase1
												}
												onChange={
													setSelectedHorarioBancaFase1
												}
											/>
										)}
								</Box>
							)}
						</Box>
					);
				}
				// Fase 2: nesta etapa, exibir DADOS DA FASE 1 (banca do projeto)
				// Preferir o horário selecionado localmente da fase 1; se não houver, usar o registro de defesa agendada da fase 1
				let dataStr: string | null = null;
				let horaStr: string | null = null;
				if (
					selectedHorarioBancaFase1 &&
					selectedHorarioBancaFase1.data &&
					selectedHorarioBancaFase1.hora
				) {
					// Slot selecionado localmente: data é "YYYY-MM-DD" (string pura).
					// NÃO usar new Date() pois ele interpreta como meia-noite UTC e
					// toLocaleDateString() aplica o offset do fuso, podendo mostrar
					// o dia anterior para usuários em UTC-3.
					dataStr = formatarData(selectedHorarioBancaFase1.data);
					horaStr = formatarHora(selectedHorarioBancaFase1.hora);
				} else {
					const defesaAgendada =
						defesasFase1 && defesasFase1.length > 0
							? defesasFase1.find((d) => !!d.data_defesa) ||
								defesasFase1[0]
							: null;
					// data_defesa vem do banco como "wall-clock UTC":
					// 17:00 armazenado = 17:00 para exibir.
					// formatarDataDefesaUTC usa getters UTC para evitar que
					// toLocaleTimeString subtraia o offset e mostre 14:00.
					if (defesaAgendada && defesaAgendada.data_defesa) {
						const formatted = formatarDataDefesaUTC(defesaAgendada.data_defesa);
						dataStr = formatted.dataStr;
						horaStr = formatted.horaStr;
					}
				}

				// Notas da banca de FASE 1
				const notasBanca = defesasFase1 || [];

				// Verificar se o projeto foi aprovado para mostrar status
				const projetoAprovado = trabalhoConclusao.aprovado_projeto;

				return (
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6" gutterBottom>
							Etapa 6: Resumo da Banca do Projeto (Fase 1)
						</Typography>

						{/* Status de aprovação do projeto */}
						{projetoAprovado ? (
							<Alert severity="success" sx={{ mb: 2 }}>
								<Typography variant="body2">
									🎉 <strong>Parabéns!</strong> Seu projeto de
									TCC foi aprovado pela banca de avaliação!
								</Typography>
							</Alert>
						) : (
							<Alert severity="warning" sx={{ mb: 2 }}>
								<Typography variant="body2">
									⚠️ <strong>Atenção:</strong> Seu projeto de
									TCC ainda não foi aprovado pela banca de
									avaliação. Você só poderá prosseguir para a
									próxima etapa após a aprovação.
								</Typography>
							</Alert>
						)}
						<Paper sx={{ p: 3 }}>
							<Typography variant="subtitle1" gutterBottom>
								Horário Selecionado
							</Typography>
							{dataStr && horaStr ? (
								<Alert severity="success" sx={{ mb: 2 }}>
									<Typography variant="body2">
										Defesa agendada para{" "}
										<strong>{dataStr}</strong> às{" "}
										<strong>{horaStr}</strong>.
									</Typography>
								</Alert>
							) : (
								<Alert severity="warning" sx={{ mb: 2 }}>
									<Typography variant="body2">
										Nenhum horário de fase 1 encontrado.
									</Typography>
								</Alert>
							)}

							<Typography variant="subtitle1" gutterBottom>
								Notas da Banca
							</Typography>
							{notasBanca.length > 0 ? (
								<Box>
									{notasBanca.map((d, idx) => (
										<Alert
											key={idx}
											severity={
												d.avaliacao != null
													? "info"
													: "warning"
											}
											sx={{ mb: 1 }}
										>
											<Typography variant="body2">
												<strong>Docente:</strong>{" "}
												{d.membroBanca?.nome ||
													d.membro_banca}
											</Typography>
											<Typography variant="body2">
												<strong>Nota:</strong>{" "}
												{d.avaliacao != null
													? Number(
															d.avaliacao,
														).toFixed(1)
													: "Sem Nota"}
											</Typography>
										</Alert>
									))}
								</Box>
							) : (
								<Alert severity="info">
									<Typography variant="body2">
										Ainda não há registros de notas para a
										banca.
									</Typography>
								</Alert>
							)}
						</Paper>
					</Box>
				);
			}
			case 6:
				// Etapa 7: Seminário de Andamento (Fase 2)
				if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
					return (
						<Box sx={{ mt: 2 }}>
							<Typography variant="h6" gutterBottom>
								Etapa 7: Seminário de Andamento
							</Typography>
							<Alert severity="info" sx={{ mb: 2 }}>
								<Typography variant="body2">
									Descreva as atividades, progresso e
									resultados do seminário de andamento.
								</Typography>
							</Alert>
							<TextField
								fullWidth
								label="Seminário de Andamento *"
								value={formData.seminario_andamento}
								onChange={(e) =>
									handleInputChange(
										"seminario_andamento",
										e.target.value,
									)
								}
								multiline
								rows={6}
								placeholder="Descreva as atividades, progresso e resultados do seminário de andamento..."
								helperText="Apresente o desenvolvimento do trabalho, metodologia aplicada, resultados parciais e próximos passos"
							/>
						</Box>
					);
				} else {
					// Para fase 1, esta etapa não existe
					return (
						<Box sx={{ mt: 2 }}>
							<Alert severity="info" sx={{ mb: 2 }}>
								<Typography variant="h6" gutterBottom>
									Etapa Não Aplicável
								</Typography>
								<Typography variant="body2">
									Esta etapa é específica para estudantes na
									fase TCC II.
								</Typography>
							</Alert>
						</Box>
					);
				}
			case 7: {
				// Etapa 8: Convite para Banca de Avaliação do Trabalho Final - apenas para fase 2 (foi movida)
				if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
					// Separar convites por fase
					const convitesFase1 = convitesBanca.filter(
						(c) => c.fase === 1,
					); // Convites da etapa 5 (banca do projeto)
					const convitesFase2 = convitesBanca.filter(
						(c) => c.fase === 2,
					); // Convites da etapa 8 (banca final)
					const convitesAceitosFase2 = convitesFase2.filter(
						(c) => c.aceito === true,
					);

					return (
						<Box sx={{ mt: 2 }}>
							<Typography variant="h6" gutterBottom>
								Etapa 8: Convite para Banca de Avaliação do
								Trabalho Final
							</Typography>

							<Paper sx={{ p: 3, mb: 3 }}>
								<Typography variant="h6" gutterBottom>
									Composição da Banca de Avaliação Final
								</Typography>

								<Alert severity="info" sx={{ mb: 2 }}>
									<Typography variant="body2">
										<strong>Nova Etapa:</strong> Para a
										avaliação final do seu trabalho, você
										precisa convidar 2 docentes para uma
										nova banca. Os docentes que participaram
										da banca do projeto (etapa 5) vêm
										pré-selecionados como sugestão.
									</Typography>
								</Alert>

								{/* Histórico de convites da fase 1 (etapa 5) */}
								{convitesFase1.length > 0 && (
									<Box sx={{ mb: 3 }}>
										<Typography
											variant="subtitle2"
											color="text.secondary"
											gutterBottom
										>
											📚 Histórico - Banca do Projeto
											(Etapa 5):
										</Typography>
										{convitesFase1.map((convite, index) => (
											<Alert
												key={`fase1-${index}`}
												severity={
													convite.aceito
														? "success"
														: "info"
												}
												sx={{ mb: 1, opacity: 0.7 }}
											>
												<Typography variant="caption">
													<strong>
														{convite.docente
															?.nome ||
															convite.codigo_docente}
													</strong>{" "}
													-{" "}
													{convite.aceito
														? "Participou da banca do projeto"
														: convite.data_feedback
															? "Recusou participar"
															: "Convite pendente"}{" "}
													{convite.data_feedback &&
														`em ${new Date(
															convite.data_feedback,
														).toLocaleDateString(
															"pt-BR",
														)}`}
												</Typography>
											</Alert>
										))}
									</Box>
								)}

								{/* Convites da fase 2 para banca final */}
								{convitesFase2.length > 0 ? (
									<Box>
										<Typography
											variant="subtitle1"
											gutterBottom
										>
											📋 Convites para Banca de Avaliação
											Final:
										</Typography>

										{convitesFase2.map((convite, index) => (
											<Alert
												key={`fase2-${index}`}
												severity={
													convite.aceito === true
														? "success"
														: convite.data_feedback &&
															  !convite.aceito
															? "error"
															: "warning"
												}
												sx={{ mb: 2 }}
											>
												<Typography variant="body2">
													<strong>Docente:</strong>{" "}
													{convite.docente?.nome ||
														convite.codigo_docente}
												</Typography>
												<Typography variant="body2">
													<strong>Status:</strong>{" "}
													{convite.aceito === true
														? "Aceito"
														: convite.data_feedback &&
															  !convite.aceito
															? "Recusado"
															: "Pendente"}
												</Typography>
												{convite.data_envio && (
													<Typography variant="body2">
														<strong>
															Enviado em:
														</strong>{" "}
														{new Date(
															convite.data_envio,
														).toLocaleDateString(
															"pt-BR",
														)}
													</Typography>
												)}
												{convite.data_feedback && (
													<Typography variant="body2">
														<strong>
															Respondido em:
														</strong>{" "}
														{new Date(
															convite.data_feedback,
														).toLocaleDateString(
															"pt-BR",
														)}
													</Typography>
												)}
												{convite.mensagem_feedback &&
													convite.data_feedback && (
														<Typography variant="body2">
															<strong>
																Mensagem do
																docente:
															</strong>{" "}
															{
																convite.mensagem_feedback
															}
														</Typography>
													)}
												{convite.mensagem_envio && (
													<Typography
														variant="body2"
														sx={{
															mt: 1,
															fontStyle: "italic",
														}}
													>
														<strong>
															Sua mensagem:
														</strong>{" "}
														"
														{convite.mensagem_envio}
														"
													</Typography>
												)}
											</Alert>
										))}

										{/* Resumo dos convites da fase 2 */}
										<Box sx={{ mb: 2 }}>
											<Typography
												variant="body2"
												color="text.secondary"
												gutterBottom
											>
												Status da Banca Final:
											</Typography>
											<Box
												sx={{
													display: "flex",
													flexWrap: "wrap",
													gap: 1,
												}}
											>
												<Chip
													label={`${convitesAceitosFase2.length} Aceito(s)`}
													color="success"
													size="small"
												/>
												<Chip
													label={`${
														convitesFase2.filter(
															(c) =>
																!c.data_feedback,
														).length
													} Pendente(s)`}
													color="warning"
													size="small"
												/>
												<Chip
													label={`${
														convitesFase2.filter(
															(c) =>
																c.data_feedback &&
																!c.aceito,
														).length
													} Recusado(s)`}
													color="error"
													size="small"
												/>
											</Box>
										</Box>

										{convitesAceitosFase2.length === 2 ? (
											<Alert
												severity="success"
												sx={{ mb: 2 }}
											>
												<Typography variant="body2">
													🎉 Excelente! Sua banca de
													avaliação final está
													completa com 2 membros
													confirmados. Agora você pode
													finalizar seu TCC.
												</Typography>
											</Alert>
										) : (
											<Button
												variant="contained"
												onClick={
													handleOpenConviteBancaFinalModal
												}
												disabled={
													convitesFase2.filter(
														(c) => !c.data_feedback,
													).length >= 2
												}
											>
												{convitesFase2.filter(
													(c) => !c.data_feedback,
												).length >= 2
													? "Aguardando Respostas"
													: `Enviar ${
															2 -
															convitesAceitosFase2.length
														} Convite(s) para Banca Final`}
											</Button>
										)}
									</Box>
								) : (
									<Box>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ mb: 2 }}
										>
											Inicie o processo de convites para a
											banca de avaliação final.
										</Typography>
										<Button
											variant="contained"
											onClick={
												handleOpenConviteBancaFinalModal
											}
										>
											Enviar 2 Convites para Banca Final
										</Button>
									</Box>
								)}
							</Paper>
						</Box>
					);
				} else {
					// Para fase 1, esta etapa não existe
					return (
						<Box sx={{ mt: 2 }}>
							<Alert severity="info" sx={{ mb: 2 }}>
								<Typography variant="h6" gutterBottom>
									Etapa Não Aplicável
								</Typography>
								<Typography variant="body2">
									A etapa de Convite para Banca Final é
									específica para estudantes na fase TCC II.
									Como você está na fase TCC I, esta etapa não
									está disponível.
								</Typography>
							</Alert>
						</Box>
					);
				}
			}
			case 8: {
				// Etapa 9: Selecionar horário de banca comum a orientador + 2 membros aceitos
				if (!trabalhoConclusao) {
					return null;
				}
				// Recuperar orientador aceito (conviteOrientacao) e 2 membros aceitos da fase correta
				const codigoOrientador = conviteExistente?.aceito
					? conviteExistente.codigo_docente
					: null;
				const membrosAceitosFase = convitesBanca
					.filter((c) => c.aceito === true && !!c.data_feedback)
					.filter((c) =>
						trabalhoConclusao.fase === 2
							? c.fase === 2
							: c.fase === 1,
					)
					.map((c) => c.codigo_docente);

				// Verificar se já existe defesa agendada para fase 2
				const jaTemDefesaFase2 = temDefesaAgendada(2);
				const dadosDefesaFase2 = obterDadosDefesaAgendada(2);

				return (
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6" gutterBottom>
							Etapa 9: Selecionar Horário da Banca Final
						</Typography>

						{/* Se já tem defesa agendada, mostrar apenas o resumo */}
						{jaTemDefesaFase2 && dadosDefesaFase2 ? (
							<Paper sx={{ p: 3, mb: 2 }}>
								<Alert severity="success" sx={{ mb: 2 }}>
									<Typography variant="body2">
										✅{" "}
										<strong>Horário já selecionado!</strong>{" "}
										A defesa final já foi agendada.
									</Typography>
								</Alert>

								<Typography variant="subtitle1" gutterBottom>
									Horário da Defesa Final
								</Typography>
								<Alert severity="info" sx={{ mb: 2 }}>
									<Typography variant="body2">
										<strong>Data:</strong>{" "}
										{dadosDefesaFase2.dataStr}
									</Typography>
									<Typography variant="body2">
										<strong>Horário:</strong>{" "}
										{dadosDefesaFase2.horaStr}
									</Typography>
								</Alert>

								{/* Mostrar notas da banca se disponíveis */}
								{defesasFase2 && defesasFase2.length > 0 && (
									<Box>
										<Typography
											variant="subtitle1"
											gutterBottom
										>
											Avaliações da Banca Final
										</Typography>
										{defesasFase2.map((d, idx) => (
											<Alert
												key={idx}
												severity={
													d.avaliacao != null
														? "info"
														: "warning"
												}
												sx={{ mb: 1 }}
											>
												<Typography variant="body2">
													<strong>Docente:</strong>{" "}
													{d.membroBanca?.nome ||
														d.membro_banca}
												</Typography>
												<Typography variant="body2">
													<strong>Nota:</strong>{" "}
													{d.avaliacao != null
														? Number(
																d.avaliacao,
															).toFixed(1)
														: "Aguardando avaliação"}
												</Typography>
											</Alert>
										))}
									</Box>
								)}
							</Paper>
						) : (
							/* Se não tem defesa agendada, mostrar seleção de horário */
							<Box>
								{!codigoOrientador && (
									<Alert severity="warning" sx={{ mb: 2 }}>
										O convite ao orientador ainda não foi
										aceito.
									</Alert>
								)}
								{membrosAceitosFase.length !== 2 && (
									<Alert severity="warning" sx={{ mb: 2 }}>
										É necessário ter 2 docentes convidados
										com convite aceito.
									</Alert>
								)}
								{codigoOrientador &&
									membrosAceitosFase.length === 2 && (
										<SelecionarHorarioBanca
											oferta={{
												ano: trabalhoConclusao.ano,
												semestre:
													trabalhoConclusao.semestre,
												id_curso:
													trabalhoConclusao.id_curso,
												fase: trabalhoConclusao.fase,
											}}
											codigoOrientador={codigoOrientador}
											codigosMembrosBanca={
												membrosAceitosFase
											}
											selectedSlot={
												selectedHorarioBancaFase2
											}
											onChange={
												setSelectedHorarioBancaFase2
											}
										/>
									)}
							</Box>
						)}
					</Box>
				);
			}
			default:
				return "Etapa desconhecida";
		}
	};

	if (loading) {
		return (
			<Box sx={{ width: "100%" }}>
				<LinearProgress />
				<Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
					<CircularProgress />
				</Box>
			</Box>
		);
	}

	// Exibir mensagem de TCC concluído
	if (showCompletedMessage && tccAnterior) {
		return (
			<Box sx={{ width: "100%" }}>
				<Typography variant="h5" component="h2" gutterBottom>
					TCC Concluído
				</Typography>

				<Paper sx={{ p: 3, textAlign: "center" }}>
					<Alert severity="success" sx={{ mb: 3 }}>
						<Typography variant="h6" gutterBottom>
							🎉 Parabéns! Seu TCC foi concluído com sucesso!
						</Typography>
						<Typography variant="body1">
							Você já concluiu seu Trabalho de Conclusão de Curso
							no período de {tccAnterior.ano}/
							{tccAnterior.semestre}.
						</Typography>
					</Alert>

					<Paper sx={{ p: 2, bgcolor: "grey.50", mb: 3 }}>
						<Typography variant="subtitle1" gutterBottom>
							Dados do seu TCC:
						</Typography>

						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								gap: 1,
								mb: 2,
							}}
						>
							<Chip label="TCC Aprovado" color="success" />
							<Chip
								label={`${tccAnterior.ano}/${tccAnterior.semestre}`}
								color="info"
							/>
							<Chip
								label={`Fase ${tccAnterior.fase}`}
								color="primary"
							/>
						</Box>

						{tccAnterior.titulo && (
							<Box sx={{ mb: 2 }}>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									Título:
								</Typography>
								<Typography variant="body1" fontWeight="medium">
									{tccAnterior.titulo}
								</Typography>
							</Box>
						)}

						{tccAnterior.tema && (
							<Box sx={{ mb: 2 }}>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									Tema:
								</Typography>
								<Typography variant="body2">
									{tccAnterior.tema}
								</Typography>
							</Box>
						)}
					</Paper>

					<Typography variant="body2" color="text.secondary">
						Como você já concluiu seu TCC, não é necessário realizar
						novamente o processo. Entre em contato com a coordenação
						caso tenha dúvidas.
					</Typography>
				</Paper>

			</Box>
		);
	}

	if (!trabalhoConclusao && activeStep === 0) {
		return (
			<Box sx={{ width: "100%" }}>
				{!modoJornada && (
					<Typography variant="h5" component="h2" gutterBottom>
						Processo do TCC
					</Typography>
				)}

				<Paper sx={{ p: 3, mb: 3 }}>
					<Stepper activeStep={activeStep} sx={{ mb: 4, display: modoJornada ? "none" : undefined }}>
						{steps.map((label) => {
							return (
								<Step key={label}>
									<StepLabel>
										{label}
									</StepLabel>
								</Step>
							);
						})}
					</Stepper>

					<Box>
						{renderStepContent(activeStep)}

						<div className="jornada-acoes">
							<span />
							<BotaoDesign
								onClick={() => {
									const novaEtapa = activeStep + 1;
									setActiveStep(novaEtapa);
									if (onEtapaChange) {
										onEtapaChange(novaEtapa);
									}
								}}
							>
								Continuar
							</BotaoDesign>
						</div>
					</Box>
				</Paper>
			</Box>
		);
	}

	return (
		<Box sx={{ width: "100%" }}>
			{!modoJornada && (
				<Typography variant="h5" component="h2" gutterBottom>
					Processo do TCC
				</Typography>
			)}

		{ofertaAtual && !modoJornada && (
			<Paper
				sx={{
					p: 2,
					mb: 2,
					bgcolor: "primary.light",
					color: "primary.contrastText",
				}}
			>
				<Typography variant="h6" gutterBottom>
					Oferta TCC Atual
				</Typography>
				<Typography variant="body2">
					Ano: {trabalhoConclusao?.ano || ofertaAtual.ano} •
					Semestre:{" "}
					{trabalhoConclusao?.semestre || ofertaAtual.semestre} •
					Curso: {ofertaAtual.curso?.nome} • Fase:{" "}
					{trabalhoConclusao?.fase || ofertaAtual.fase}
				</Typography>
			</Paper>
		)}

			<Paper
				elevation={modoJornada ? 0 : 1}
				sx={
					modoJornada
						? { p: 0, mb: 0, backgroundColor: "transparent", backgroundImage: "none" }
						: { p: 3, mb: 3, backgroundColor: theme.palette.background.default }
				}
			>
				<Stepper activeStep={activeStep} sx={{ mb: 4, display: modoJornada ? "none" : undefined }}>
					{getEtapasValidas().map((label, index) => {
						// Verificar se a etapa está completa
						const isStepComplete = (() => {
							switch (index) {
								case 0:
									return true; // Etapa 0 sempre completa (visualização)
								case 1:
									return Boolean(
										formData.tema &&
										formData.tema.trim().length > 0,
									);
								case 2:
									return Boolean(
										formData.titulo &&
										formData.titulo.trim().length > 0,
									);
								case 3:
									return Boolean(
										formData.resumo &&
										formData.resumo.trim().length > 0,
									);
								case 4: {
									// Etapa 4 (convite para banca do projeto - fase 1) - precisa de 2 convites aceitos
									const convitesAceitosBancaFase1 =
										convitesBanca.filter(
											(convite) =>
												convite.aceito === true &&
												convite.fase === 1,
										);
									return (
										convitesAceitosBancaFase1.length >= 2
									);
								}
								case 5:
									// Etapa 6: Fase 1 requer horário selecionado; Fase 2 requer seminário preenchido
									if (trabalhoConclusao?.fase === 1) {
										return Boolean(
											selectedHorarioBancaFase1 &&
											selectedHorarioBancaFase1.data &&
											selectedHorarioBancaFase1.hora,
										);
									}
									if (trabalhoConclusao?.fase === 2) {
										// Para fase 2, verificar se o projeto foi aprovado
										if (
											!trabalhoConclusao.aprovado_projeto
										) {
											return false; // Não pode completar se o projeto não foi aprovado
										}
										return Boolean(
											formData.seminario_andamento &&
											formData.seminario_andamento.trim()
												.length > 0,
										);
									}
									return true;
								case 6:
									// Etapa 6 (convite para banca final - fase 2) - só existe na fase 2
									if (
										trabalhoConclusao &&
										trabalhoConclusao.fase === 2
									) {
										const convitesAceitosBancaFase2 =
											convitesBanca.filter(
												(convite) =>
													convite.aceito === true &&
													convite.fase === 2,
											);
										return (
											convitesAceitosBancaFase2.length >=
											2
										);
									}
									return true; // Para fase 1, não existe
								case 7:
									// Etapa 8 (fase 2): requer horário selecionado
									return Boolean(
										selectedHorarioBancaFase2 &&
										selectedHorarioBancaFase2.data &&
										selectedHorarioBancaFase2.hora,
									);
								default:
									return false;
							}
						})();

						return (
							<Step key={label}>
								<StepLabel
									error={
										activeStep === index && !isStepComplete
									}
								>
									{label}
								</StepLabel>
							</Step>
						);
					})}
				</Stepper>

				{activeStep === getEtapasValidas().length ? (
					<Box>
						{/* Só mostrar a tela de conclusão se o projeto estiver aprovado na fase 2 */}
						{trabalhoConclusao?.fase === 2 &&
						trabalhoConclusao?.aprovado_projeto ? (
							<>
								<Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
									Banca Final Agendada
								</Typography>
								<Paper sx={{ p: 3, mb: 2 }}>
									{(() => {
										// Mostrar data/hora da defesa final
										let dataStr: string | null = null;
										let horaStr: string | null = null;
										if (
											selectedHorarioBancaFase2 &&
											selectedHorarioBancaFase2.data &&
											selectedHorarioBancaFase2.hora
										) {
											// Slot selecionado localmente: data é "YYYY-MM-DD" (string pura).
											// NÃO usar new Date() pois ele interpreta como meia-noite UTC e
											// toLocaleDateString() aplica o offset do fuso, podendo mostrar
											// o dia anterior para usuários em UTC-3.
											dataStr = formatarData(selectedHorarioBancaFase2.data);
											horaStr = formatarHora(selectedHorarioBancaFase2.hora);
										} else {
											const defesaAgendada =
												defesasFase2 &&
												defesasFase2.length > 0
													? defesasFase2.find(
															(d) =>
																!!d.data_defesa,
														) || defesasFase2[0]
													: null;
											// data_defesa vem do banco como "wall-clock UTC":
											// 17:00 armazenado = 17:00 para exibir.
											// formatarDataDefesaUTC usa getters UTC para evitar que
											// toLocaleTimeString subtraia o offset e mostre 14:00.
											if (defesaAgendada && defesaAgendada.data_defesa) {
												const formatted = formatarDataDefesaUTC(defesaAgendada.data_defesa);
												dataStr = formatted.dataStr;
												horaStr = formatted.horaStr;
											}
										}

										return (
											<>
												<Typography
													variant="subtitle1"
													gutterBottom
												>
													Horário Selecionado
												</Typography>
												{dataStr && horaStr ? (
													<Alert
														severity="success"
														sx={{ mb: 2 }}
													>
														<Typography variant="body2">
															Defesa agendada para{" "}
															<strong>
																{dataStr}
															</strong>{" "}
															às{" "}
															<strong>
																{horaStr}
															</strong>
															.
														</Typography>
													</Alert>
												) : (
													<Alert
														severity="warning"
														sx={{ mb: 2 }}
													>
														<Typography variant="body2">
															Nenhum horário
															encontrado.
														</Typography>
													</Alert>
												)}

												<Typography
													variant="subtitle1"
													gutterBottom
												>
													Notas da Banca
												</Typography>
												{(defesasFase2 || []).length >
												0 ? (
													<Box>
														{(
															defesasFase2 || []
														).map((d, idx) => (
															<Alert
																key={idx}
																severity={
																	d.avaliacao !=
																	null
																		? "info"
																		: "warning"
																}
																sx={{ mb: 1 }}
															>
																<Typography variant="body2">
																	<strong>
																		Docente:
																	</strong>{" "}
																	{d
																		.membroBanca
																		?.nome ||
																		d.membro_banca}
																</Typography>
																<Typography variant="body2">
																	<strong>
																		Nota:
																	</strong>{" "}
																	{d.avaliacao !=
																	null
																		? Number(
																				d.avaliacao,
																			).toFixed(
																				1,
																			)
																		: "Sem Nota"}
																</Typography>
															</Alert>
														))}
													</Box>
												) : (
													<Alert severity="info">
														<Typography variant="body2">
															Ainda não há
															registros de notas
															para a banca final.
														</Typography>
													</Alert>
												)}
											</>
										);
									})()}
								</Paper>
								<Button onClick={() => setActiveStep(0)}>
									Reiniciar
								</Button>
							</>
						) : (
							<>
								{trabalhoConclusao?.fase === 2 &&
								!trabalhoConclusao?.aprovado_projeto ? (
									<>
										<Typography
											variant="h6"
											sx={{ mt: 1, mb: 2 }}
										>
											Aguardando Aprovação do Projeto
										</Typography>
										<Paper sx={{ p: 3, mb: 2 }}>
											<Alert
												severity="warning"
												sx={{ mb: 2 }}
											>
												<Typography variant="body2">
													<strong>Status:</strong> Seu
													projeto de TCC ainda não foi
													aprovado pela banca de
													avaliação.
												</Typography>
											</Alert>
											<Typography
												variant="body2"
												sx={{ mb: 2 }}
											>
												Você completou todas as etapas
												disponíveis até o momento. Para
												continuar com o processo do TCC,
												é necessário aguardar a
												aprovação do seu projeto pela
												banca de avaliação.
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												Após a aprovação, novas etapas
												serão disponibilizadas para
												você.
											</Typography>
										</Paper>
									</>
								) : (
									<>
										<Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
											Todas as etapas foram concluídas!
										</Typography>
										<Alert severity="success" sx={{ mb: 2 }}>
											<Typography variant="body2">
												Parabéns! Você concluiu todas as etapas do TCC I. Aguarde a realização da banca de avaliação do projeto.
											</Typography>
										</Alert>

										{/* Agenda e composição da banca do projeto (fase 1) */}
										{(() => {
											const dadosDefesa = obterDadosDefesaAgendada(1);
											return dadosDefesa ? (
												<Paper sx={{ p: 3, mb: 2 }}>
													<Typography variant="subtitle1" gutterBottom fontWeight="medium">
														Agenda da Banca do Projeto
													</Typography>
													<Alert severity="info" sx={{ mb: 2 }}>
														<Typography variant="body2">
															<strong>Data:</strong> {dadosDefesa.dataStr}
														</Typography>
														<Typography variant="body2">
															<strong>Horário:</strong> {dadosDefesa.horaStr}
														</Typography>
													</Alert>

													{defesasFase1 && defesasFase1.length > 0 && (
														<>
															<Typography variant="subtitle1" gutterBottom fontWeight="medium">
																Composição da Banca
															</Typography>
															{defesasFase1.map((d, idx) => (
																<Alert
																	key={idx}
																	severity="info"
																	sx={{ mb: 1 }}
																>
																	<Typography variant="body2">
																		<strong>Membro:</strong>{" "}
																		{d.membroBanca?.nome || d.membro_banca}
																	</Typography>
																	{d.avaliacao != null && (
																		<Typography variant="body2">
																			<strong>Nota:</strong>{" "}
																			{Number(d.avaliacao).toFixed(1)}
																		</Typography>
																	)}
																</Alert>
															))}
														</>
													)}
												</Paper>
											) : (
												<Alert severity="info" sx={{ mb: 2 }}>
													<Typography variant="body2">
														Nenhum horário de banca agendado encontrado.
													</Typography>
												</Alert>
											);
										})()}
									</>
								)}
								<Button onClick={() => setActiveStep(0)}>
									Reiniciar
								</Button>
							</>
						)}
					</Box>
				) : (
					<Box>
						{saving && (
							<Box sx={{ mb: 2 }}>
								<LinearProgress />
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ mt: 1 }}
								>
									Salvando dados...
								</Typography>
							</Box>
						)}

						{renderStepContent(activeStep)}

						{/* Mensagem de ajuda para etapa 0 */}
						{activeStep === 0 && !validarEtapaAtual() && (
							<Alert severity="info" sx={{ mt: 2 }}>
								<Typography variant="body2">
									Para prosseguir, você precisa ter um convite
									aceito por um orientador.
								</Typography>
							</Alert>
						)}

						{/* Mensagem de ajuda para etapa 4 (banca) */}
						{activeStep === 4 &&
							!validarEtapaAtual() &&
							convitesBanca.length > 0 && (
								<Alert severity="warning" sx={{ mt: 2 }}>
									<Typography variant="body2">
										<strong>
											Aguardando confirmação da banca:
										</strong>{" "}
										Para prosseguir, você precisa ter 2
										convites aceitos.
										{convitesBanca.filter(
											(c) => c.aceito === true,
										).length > 0
											? ` Você já tem ${
													convitesBanca.filter(
														(c) =>
															c.aceito === true,
													).length
												} convite(s) aceito(s), falta(m) ${
													2 -
													convitesBanca.filter(
														(c) =>
															c.aceito === true,
													).length
												}.`
											: " Ainda não há convites aceitos."}
									</Typography>
								</Alert>
							)}

						{/* Mensagem de ajuda para etapa 6 (fase 1) ou 8 (fase 2) */}
						{activeStep === 5 &&
							trabalhoConclusao?.fase === 1 &&
							!validarEtapaAtual() && (
								<Alert severity="warning" sx={{ mt: 2 }}>
									<Typography variant="body2">
										<strong>
											Seleção de horário obrigatória:
										</strong>{" "}
										escolha um horário comum entre
										orientador e os 2 membros aceitos da
										banca do projeto.
									</Typography>
								</Alert>
							)}

						{activeStep === 7 &&
							trabalhoConclusao?.fase === 2 &&
							!validarEtapaAtual() && (
								<Alert severity="warning" sx={{ mt: 2 }}>
									<Typography variant="body2">
										<strong>
											Aguardando confirmação da banca
											final:
										</strong>{" "}
										Para finalizar seu TCC, você precisa ter
										2 convites aceitos para a banca de
										avaliação final.
										{(() => {
											const convitesFase2Atuais =
												convitesBanca.filter(
													(c) => c.fase === 2,
												);
											const convitesAceitosFase2 =
												convitesFase2Atuais.filter(
													(c) => c.aceito === true,
												);
											return convitesAceitosFase2.length >
												0
												? ` Você já tem ${
														convitesAceitosFase2.length
													} convite(s) aceito(s) para a banca final, falta(m) ${
														2 -
														convitesAceitosFase2.length
													}.`
												: " Ainda não há convites aceitos para a banca final.";
										})()}
									</Typography>
								</Alert>
							)}
					</Box>
				)}
				{/* Navegação da jornada: abaixo do conteúdo; no celular, fixa acima da navegação inferior. */}
				{activeStep !== getEtapasValidas().length && (
					<div className="jornada-acoes">
						<BotaoDesign
							variant="secondary"
							onClick={() => {
								if (activeStep >= 1 && activeStep <= 3) {
									// Tema, título e resumo é uma tela só: voltar leva à etapa anterior a ela.
									setActiveStep(0);
									if (onEtapaChange) onEtapaChange(0);
								} else handleBack();
							}}
							disabled={activeStep === 0 || saving}
						>
							Voltar
						</BotaoDesign>
						{activeStep >= 1 && activeStep <= 3 ? (
							<div style={{ display: "flex", gap: 8 }}>
								<BotaoDesign variant="secondary" icon="save" onClick={() => void salvarTemaTituloResumo(false)} disabled={saving}>
									Salvar
								</BotaoDesign>
								<BotaoDesign
									onClick={() => void salvarTemaTituloResumo(true)}
									disabled={saving || ![formData.tema, formData.titulo, formData.resumo].every((v) => v && v.trim())}
								>
									{saving ? "Salvando…" : "Continuar"}
								</BotaoDesign>
							</div>
						) : (() => {
							const ultima = activeStep === getEtapasValidas().length - 1;
							const finalizar =
								ultima && (trabalhoConclusao?.fase !== 2 || (trabalhoConclusao?.fase === 2 && trabalhoConclusao?.aprovado_projeto));
							return (
								<BotaoDesign onClick={handleNext} disabled={saving || !validarEtapaAtual()} icon={finalizar ? "check" : undefined}>
									{saving ? "Salvando…" : finalizar ? "Finalizar" : "Continuar"}
								</BotaoDesign>
							);
						})()}
					</div>
				)}

			</Paper>


			{/* Modal de Convite para Orientador */}
			{trabalhoConclusao && (
				<ConviteOrientadorModal
					open={openConviteModal}
					onClose={handleCloseConviteModal}
					idTcc={trabalhoConclusao.id}
					idCurso={trabalhoConclusao.id_curso}
					onConviteEnviado={handleConviteEnviado}
					conviteExistente={conviteExistente}
					fase={trabalhoConclusao.fase || 1}
				/>
			)}

			{/* Modal de Convite para Banca */}
			{trabalhoConclusao && (
				<ConviteBancaModal
					open={openConviteBancaModal}
					onClose={handleCloseConviteBancaModal}
					idTcc={trabalhoConclusao.id}
					idCurso={trabalhoConclusao.id_curso}
					onConviteEnviado={handleConviteBancaEnviado}
					convitesExistentes={convitesBanca.filter(
						(c) => c.fase === 1,
					)} // Apenas convites da fase 1 (banca do projeto)
					conviteOrientacao={conviteExistente}
					tipoConvite="banca_projeto"
					docentesPreSelecionados={[]} // Etapa 5 não tem pré-seleção
				/>
			)}

			{/* Modal de Convite para Banca Final */}
			{trabalhoConclusao && (
				<ConviteBancaModal
					open={openConviteBancaFinalModal}
					onClose={handleCloseConviteBancaFinalModal}
					idTcc={trabalhoConclusao.id}
					idCurso={trabalhoConclusao.id_curso}
					onConviteEnviado={handleConviteBancaEnviado}
					convitesExistentes={convitesBanca.filter(
						(c) => c.fase === 2,
					)} // Apenas convites da fase 2 (banca final)
					conviteOrientacao={conviteExistente}
					tipoConvite="banca_trabalho"
					docentesPreSelecionados={convitesBanca
						.filter((c) => c.fase === 1 && c.aceito === true)
						.map((c) => c.codigo_docente)} // Docentes aceitos na fase 1
				/>
			)}

			{/* Modal de Importação de Dados */}
			<Dialog
				open={openImportModal}
				onClose={handleImportModalClose}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					{modalType === "next_phase"
						? "Projeto Aprovado Encontrado"
						: "TCC Anterior Encontrado"}
				</DialogTitle>
				<DialogContent>
					{tccAnterior && (
						<Box>
							<DialogContentText sx={{ mb: 2 }}>
								{modalType === "next_phase" ? (
									<>
										Seu projeto de TCC foi aprovado em{" "}
										{tccAnterior.ano}/{tccAnterior.semestre}
										. Deseja continuar para a próxima fase
										(TCC II) na oferta atual{" "}
										{ofertaAtual?.ano}/
										{ofertaAtual?.semestre}?
									</>
								) : (
									<>
										Encontramos um TCC seu de{" "}
										{tccAnterior.ano}/{tccAnterior.semestre}
										. Deseja importar os dados deste TCC
										para a oferta atual {ofertaAtual?.ano}/
										{ofertaAtual?.semestre}?
									</>
								)}
							</DialogContentText>

							<Paper sx={{ p: 2, bgcolor: "grey.50" }}>
								<Typography variant="subtitle2" gutterBottom>
									Dados do TCC Anterior:
								</Typography>

								<Box sx={{ mb: 1 }}>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										Status:
									</Typography>
									<Box
										sx={{
											display: "flex",
											gap: 1,
											mt: 0.5,
										}}
									>
										<Chip
											label={
												tccAnterior.aprovado_projeto
													? "Projeto Aprovado"
													: "Projeto Não Aprovado"
											}
											color={
												tccAnterior.aprovado_projeto
													? "success"
													: "default"
											}
											size="small"
										/>
										<Chip
											label={`Fase ${tccAnterior.fase}`}
											color="info"
											size="small"
										/>
									</Box>
								</Box>

								{tccAnterior.tema && (
									<Box sx={{ mb: 1 }}>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											Tema:
										</Typography>
										<Typography variant="body2">
											{tccAnterior.tema}
										</Typography>
									</Box>
								)}

								{tccAnterior.titulo && (
									<Box sx={{ mb: 1 }}>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											Título:
										</Typography>
										<Typography variant="body2">
											{tccAnterior.titulo}
										</Typography>
									</Box>
								)}
							</Paper>

							{modalType === "next_phase" && (
								<Alert severity="success" sx={{ mt: 2 }}>
									<Typography variant="body2">
										Ao continuar, você será direcionado para
										a fase TCC II mantendo seus dados
										anteriores.
									</Typography>
								</Alert>
							)}

							{modalType === "import" && (
								<Alert severity="info" sx={{ mt: 2 }}>
									<Typography variant="body2">
										Ao importar, um novo TCC será criado com
										os dados do TCC anterior.
									</Typography>
								</Alert>
							)}
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => handleImportData(false)}
						color="inherit"
					>
						{modalType === "next_phase"
							? "Criar Novo TCC"
							: "Não Importar"}
					</Button>
					<Button
						onClick={() => handleImportData(true)}
						variant="contained"
						color="primary"
					>
						{modalType === "next_phase"
							? "Continuar TCC II"
							: "Importar Dados"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
