import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	TextField,
	Typography,
	Box,
	Alert,
	CircularProgress,
	Chip,
	OutlinedInput,
	ListItemText,
	Checkbox,
} from "@mui/material";
import axiosInstance from "../auth/axios";

export default function ConviteBancaModal({
	open,
	onClose,
	idTcc,
	idCurso,
	onConviteEnviado,
	convitesExistentes = [],
	conviteOrientacao = null, // Convite de orientação para excluir orientador da lista
	tipoConvite = "banca_projeto", // "banca_projeto" ou "banca_trabalho"
	docentesPreSelecionados = [], // Docentes que devem vir pré-selecionados
}) {
	const [docentesBanca, setDocentesBanca] = useState([]);
	const [orientadoresSelecionados, setOrientadoresSelecionados] = useState(
		[],
	);
	const [mensagem, setMensagem] = useState("");
	const [loading, setLoading] = useState(false);
	const [loadingDocentesBanca, setLoadingDocentesBanca] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (open && idCurso) {
			carregarDocentesBanca();
		}
	}, [open, idCurso]);

	useEffect(() => {
		if (open) {
			// Lógica de pré-seleção inteligente
			let selecionadosIniciais = [];

			if (
				tipoConvite === "banca_trabalho" &&
				docentesPreSelecionados.length > 0 &&
				convitesExistentes
			) {
				// Para etapa 7 (banca final), verificar se já há convites respondidos na fase 2
				const convitesRespondidosFase2 = convitesExistentes.filter(
					(c) => c.data_feedback,
				);

				if (convitesRespondidosFase2.length === 0) {
					// Se não há convites respondidos, manter pré-seleção apenas para docentes não convidados na fase 2
					const docentesJaConvidadosFase2 = convitesExistentes.map(
						(c) => c.codigo_docente,
					);
					selecionadosIniciais = docentesPreSelecionados.filter(
						(codigo) => !docentesJaConvidadosFase2.includes(codigo),
					);
				}
				// Se há convites respondidos, não pré-selecionar ninguém (selecionadosIniciais = [])
			} else {
				// Para outras situações, usar pré-seleção normal
				selecionadosIniciais = docentesPreSelecionados || [];
			}

			setOrientadoresSelecionados(selecionadosIniciais);
			setMensagem("");
			setError("");
		}
	}, [open, docentesPreSelecionados, convitesExistentes, tipoConvite]);

	const carregarDocentesBanca = async () => {
		try {
			setLoadingDocentesBanca(true);
			const response = await axiosInstance.get(
				`/banca-curso/curso/${idCurso}`,
			);

			// Extrair os docentes da banca
			const docentesBanca =
				response.data?.docentesBanca || response.docentesBanca || [];
			const docentes = docentesBanca
				.map((banca) => banca.docente)
				.filter(Boolean);

			setDocentesBanca(docentes);
		} catch (error) {
			console.error("Erro ao carregar docentes de banca do curso:", error);
			setError("Erro ao carregar lista de docentes de banca do curso");
		} finally {
			setLoadingDocentesBanca(false);
		}
	};

	// Filtrar convites de banca (orientacao = false)
	// Usar convitesExistentes diretamente (já filtrados pelo componente pai)
	const convitesBanca = convitesExistentes || [];

	// Contar convites pendentes (sem data_feedback)
	const convitesPendentes = convitesBanca.filter(
		(convite) => !convite.data_feedback,
	);

	// Contar convites aceitos
	const convitesAceitos = convitesBanca.filter(
		(convite) => convite.aceito === true,
	);

	// Determinar se o botão deve estar desabilitado
	const deveBotaoEstarDesabilitado =
		convitesPendentes.length === 2 || // 2 pendentes
		convitesAceitos.length === 2 || // 2 aceitos
		(convitesAceitos.length === 1 && convitesPendentes.length === 1); // 1 aceito + 1 pendente

	// Para o formulário, só mostrar se ainda pode enviar convites
	const podeEnviarMaisConvites = !deveBotaoEstarDesabilitado;

	// Calcular quantos convites ainda pode enviar
	// Apenas convites aceitos ocupam vagas permanentemente, recusados liberam a vaga
	const convitesDisponiveis = 2 - convitesAceitos.length;

	const handleEnviarConvites = async () => {
		if (orientadoresSelecionados.length === 0) {
			setError("Por favor, selecione pelo menos um orientador");
			return;
		}

		// Verificar se ainda pode enviar baseado em aceitos + pendentes + nova seleção
		const totalConvitesAposEnvio =
			convitesPendentes.length +
			convitesAceitos.length +
			orientadoresSelecionados.length;

		if (totalConvitesAposEnvio > 2) {
			setError(
				`Você só pode ter no máximo 2 convites simultâneos. Atualmente: ${
					convitesAceitos.length
				} aceito(s) + ${
					convitesPendentes.length
				} pendente(s). Máximo para enviar agora: ${
					2 - convitesPendentes.length - convitesAceitos.length
				}.`,
			);
			return;
		}

		try {
			setLoading(true);
			setError("");

			// Enviar convites para cada orientador selecionado
			for (const codigoDocente of orientadoresSelecionados) {
				const dadosConvite = {
					id_tcc: idTcc,
					codigo_docente: codigoDocente,
					mensagem_envio:
						mensagem ||
						`Convite para banca de avaliação - ${
							tipoConvite === "banca_projeto"
								? "Projeto"
								: "Trabalho Final"
						}`,
					orientacao: false, // Sempre false para convites de banca
					fase: tipoConvite === "banca_projeto" ? 1 : 2, // Fase 1 para projeto, Fase 2 para trabalho final
				};

				await axiosInstance.post("/convites", {
					formData: dadosConvite,
				});
			}

			if (onConviteEnviado) {
				onConviteEnviado();
			}

			handleClose();
		} catch (error) {
			console.error("Erro ao enviar convites:", error);
			if (error.response?.data?.message) {
				setError(error.response.data.message);
			} else {
				setError("Erro ao enviar convites. Tente novamente.");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setOrientadoresSelecionados([]);
		setMensagem("");
		setError("");
		onClose();
	};

	const handleChangeOrientadores = (event) => {
		const value = event.target.value;

		// Calcular limite de seleção baseado em convites simultâneos (aceitos + pendentes)
		const limiteSelecao =
			2 - convitesAceitos.length - convitesPendentes.length;

		// Limitar seleção baseado no máximo de convites simultâneos
		if (value.length <= limiteSelecao) {
			setOrientadoresSelecionados(
				typeof value === "string" ? value.split(",") : value,
			);
		} else {
			setError(
				`Você só pode selecionar até ${limiteSelecao} orientador(es). Atualmente tem ${convitesAceitos.length} aceito(s) + ${convitesPendentes.length} pendente(s).`,
			);
		}
	};

	// Obter nomes dos docentes de banca já convidados
	const getDocenteBancaNome = (codigo) => {
		const docente = docentesBanca.find((o) => o.codigo === codigo);
		return docente ? docente.nome : codigo;
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle>
				{tipoConvite === "banca_projeto"
					? "Convite para Banca de Avaliação do Projeto"
					: "Convite para Banca de Avaliação do Trabalho Final"}
			</DialogTitle>
			<DialogContent>
				<Box sx={{ mt: 2 }}>
					{!idCurso && (
						<Alert severity="warning" sx={{ mb: 2 }}>
							Não foi possível identificar o curso. Entre em
							contato com o suporte.
						</Alert>
					)}

					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					{/* Informações sobre convites existentes */}
					{convitesBanca.length > 0 && (
						<Alert severity="info" sx={{ mb: 2 }}>
							<Typography variant="subtitle2" gutterBottom>
								Status dos Convites de Banca:
							</Typography>

							{convitesPendentes.length > 0 && (
								<Box sx={{ mb: 1 }}>
									<Typography variant="body2">
										<strong>
											Pendentes (
											{convitesPendentes.length}):
										</strong>
									</Typography>
									{convitesPendentes.map((convite, index) => (
										<Chip
											key={index}
											label={`${getDocenteBancaNome(
												convite.codigo_docente,
											)} - Aguardando resposta`}
											color="warning"
											size="small"
											sx={{ mr: 1, mb: 0.5 }}
										/>
									))}
								</Box>
							)}

							{convitesAceitos.length > 0 && (
								<Box sx={{ mb: 1 }}>
									<Typography variant="body2">
										<strong>
											Aceitos ({convitesAceitos.length}):
										</strong>
									</Typography>
									{convitesAceitos.map((convite, index) => (
										<Chip
											key={index}
											label={`${getDocenteBancaNome(
												convite.codigo_docente,
											)} - Aceito`}
											color="success"
											size="small"
											sx={{ mr: 1, mb: 0.5 }}
										/>
									))}
								</Box>
							)}

							<Typography variant="body2" sx={{ mt: 1 }}>
								Você tem {convitesDisponiveis} vaga(s)
								disponível(is) na banca.
								{convitesAceitos.length === 2 &&
									" Você já tem 2 convites aceitos! 🎉"}
								{convitesPendentes.length > 0 &&
									` (${convitesPendentes.length} convite(s) aguardando resposta)`}
							</Typography>
						</Alert>
					)}

					{!deveBotaoEstarDesabilitado ? (
						<>
							<FormControl fullWidth sx={{ mb: 2 }}>
																	<InputLabel>
										Selecione os Docentes para a Banca
									</InputLabel>
								<Select
									multiple
									value={orientadoresSelecionados}
									onChange={handleChangeOrientadores}
									input={
										<OutlinedInput label="Selecione os Docentes para a Banca" />
									}
									renderValue={(selected) => (
										<Box
											sx={{
												display: "flex",
												flexWrap: "wrap",
												gap: 0.5,
											}}
										>
											{selected.map((codigo) => (
												<Chip
													key={codigo}
													label={getDocenteBancaNome(
														codigo,
													)}
													size="small"
												/>
											))}
										</Box>
									)}
									disabled={
										loadingDocentesBanca ||
										!idCurso ||
										convitesAceitos.length +
											convitesPendentes.length >=
											2
									}
								>
									{loadingDocentesBanca ? (
										<MenuItem disabled>
											<CircularProgress
												size={20}
												sx={{ mr: 1 }}
											/>
											Carregando docentes de banca...
										</MenuItem>
									) : (
										(Array.isArray(docentesBanca)
											? docentesBanca
											: []
										).map((docente) => {
											// Verificar se é o orientador atual
											const ehOrientador =
												conviteOrientacao &&
												conviteOrientacao.codigo_docente ===
													docente.codigo &&
												conviteOrientacao.aceito ===
													true;

											// Verificar se o docente já tem convite pendente, aceito ou recusado para banca
											const jaConvidado =
												convitesBanca.some(
													(convite) =>
														convite.codigo_docente ===
															docente.codigo &&
														(!convite.data_feedback ||
															convite.aceito ||
															// Para etapa 7 (banca final), também excluir docentes que recusaram
															(tipoConvite ===
																"banca_trabalho" &&
																convite.data_feedback &&
																!convite.aceito)),
												);

											// Verificar se foi especificamente recusado na fase atual
											const foiRecusado =
												convitesBanca.some(
													(convite) =>
														convite.codigo_docente ===
															docente.codigo &&
														convite.data_feedback &&
														!convite.aceito &&
														tipoConvite ===
															"banca_trabalho",
												);

											const isDisabled =
												jaConvidado || ehOrientador;
											const secondaryText = ehOrientador
												? "Orientador do TCC"
												: foiRecusado
													? "Recusou convite anterior"
													: jaConvidado
														? "Já convidado"
														: "";

											return (
												<MenuItem
													key={docente.codigo}
													value={docente.codigo}
													disabled={isDisabled}
												>
													<Checkbox
														checked={
															orientadoresSelecionados.indexOf(
																docente.codigo,
															) > -1
														}
													/>
													<ListItemText
														primary={`${docente.nome} - ${docente.codigo}`}
														secondary={
															secondaryText
														}
													/>
												</MenuItem>
											);
										})
									)}
								</Select>
							</FormControl>

							<TextField
								fullWidth
								multiline
								rows={4}
								label="Mensagem do Convite"
								value={mensagem}
								onChange={(e) => setMensagem(e.target.value)}
								placeholder="Escreva uma mensagem personalizada para os membros da banca..."
								sx={{ mb: 2 }}
								helperText={`Você pode selecionar até ${
									2 -
									convitesAceitos.length -
									convitesPendentes.length
								} docente(s) para enviar convites simultaneamente.`}
							/>
						</>
					) : (
						<Alert severity="info">
							<Typography variant="body2">
								{convitesAceitos.length === 2
									? "Sua banca está completa com 2 membros confirmados!"
									: convitesPendentes.length === 2
										? "Você tem 2 convites pendentes. Aguarde as respostas antes de enviar novos convites."
										: "Você tem 1 convite aceito e 1 pendente. Aguarde a resposta do convite pendente."}
							</Typography>
						</Alert>
					)}

					{convitesAceitos.length === 2 && (
						<Alert severity="success" sx={{ mt: 2 }}>
							<Typography variant="body2">
								<strong>Excelente!</strong> Você já tem 2
								membros confirmados para sua banca de avaliação.
								Agora você pode prosseguir para a próxima etapa.
							</Typography>
						</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={loading}>
					Fechar
				</Button>
				<Button
					onClick={handleEnviarConvites}
					variant="contained"
					disabled={
						loading ||
						deveBotaoEstarDesabilitado ||
						orientadoresSelecionados.length === 0
					}
				>
					{loading ? (
						<CircularProgress size={20} />
					) : deveBotaoEstarDesabilitado ? (
						convitesAceitos.length === 2 ? (
							"Banca Completa"
						) : convitesPendentes.length === 2 ? (
							"Aguardando Respostas"
						) : (
							"Aguardando Confirmação"
						)
					) : (
						`Enviar ${convitesDisponiveis} Convite(s)`
					)}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
