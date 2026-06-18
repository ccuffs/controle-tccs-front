import React, { useState, useEffect, useContext } from "react";
import { useTheme } from "@mui/material/styles";
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
	Snackbar,
	CircularProgress,
	LinearProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	DialogContentText,
	Chip,
} from "@mui/material";

import axiosInstance from "../../auth/axios";
import { AuthContext } from "../../contexts/AuthContext";
import { formatarDataDefesaUTC } from "../../controllers/disponibilidade-banca-controller";

import VisualizarTemasTCC from "./VisualizarTemasTCC";
import ConviteOrientadorModal from "./ConviteOrientadorModal";
import ConviteBancaModal from "./ConviteBancaModal";
import SelecionarHorarioBanca from "./SelecionarHorarioBanca";

const steps = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function TccStepper({ etapaInicial = 0, onEtapaChange }) {
	const theme = useTheme();
	const { usuario } = useContext(AuthContext);
	const [activeStep, setActiveStep] = useState(etapaInicial);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [trabalhoConclusao, setTrabalhoConclusao] = useState(null);
	const [ofertaAtual, setOfertaAtual] = useState(null);
	const [formData, setFormData] = useState({
		tema: "",
		titulo: "",
		resumo: "",
		seminario_andamento: "",
	});
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");
	const [openConviteModal, setOpenConviteModal] = useState(false);
	const [conviteExistente, setConviteExistente] = useState(null);
	const [convitesBanca, setConvitesBanca] = useState([]);
	const [openConviteBancaModal, setOpenConviteBancaModal] = useState(false);
	const [openConviteBancaFinalModal, setOpenConviteBancaFinalModal] =
		useState(false);
	const [tccAnterior, setTccAnterior] = useState(null);
	const [openImportModal, setOpenImportModal] = useState(false);
	const [showCompletedMessage, setShowCompletedMessage] = useState(false);
	const [modalType, setModalType] = useState(""); // 'import', 'next_phase'
	const [selectedHorarioBancaFase1, setSelectedHorarioBancaFase1] =
		useState(null);
	const [selectedHorarioBancaFase2, setSelectedHorarioBancaFase2] =
		useState(null);
	const [defesasFase1, setDefesasFase1] = useState([]);
	const [defesasFase2, setDefesasFase2] = useState([]);
	const [bloquearAtualizacaoEtapa, setBloquearAtualizacaoEtapa] =
		useState(false);

	useEffect(() => {
		if (usuario) {
			carregarTrabalhoConclusao();
		}
	}, [usuario]);

	useEffect(() => {
		setActiveStep(etapaInicial);
	}, [etapaInicial]);

	const isEtapaFinalBloqueada = (tcc) => {
		if (!tcc) return false;
		const etapaNum = typeof tcc.etapa === "number" ? tcc.etapa : 0;
		return (
			(tcc.fase === 1 && etapaNum >= 6) ||
			(tcc.fase === 2 && etapaNum >= 9)
		);
	};

	// Ao navegar para a etapa 6 (index 5), recarregar as defesas para mostrar o resumo (horário e notas)
	useEffect(() => {
		if (activeStep === 5 && trabalhoConclusao) {
			carregarDefesas(trabalhoConclusao.id);
		}
	}, [activeStep, trabalhoConclusao]);

	// Ao navegar para a etapa 9 (index 8) na fase 2, recarregar as defesas para mostrar o resumo (horário e notas)
	useEffect(() => {
		if (
			activeStep === 8 &&
			trabalhoConclusao &&
			trabalhoConclusao.fase === 2
		) {
			carregarDefesas(trabalhoConclusao.id);
		}
	}, [activeStep, trabalhoConclusao]);

	// Ao carregar diretamente na etapa final (índice igual ao total de etapas válidas) na fase 2, recarregar as defesas
	useEffect(() => {
		if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
			const etapasValidas = getEtapasValidas();
			if (activeStep === etapasValidas.length) {
				carregarDefesas(trabalhoConclusao.id);
			}
		}
	}, [activeStep, trabalhoConclusao]);

	const carregarTrabalhoConclusao = async () => {
		try {
			setLoading(true);

			// Primeiro, buscar a última oferta TCC
			const responseOferta = await axiosInstance.get(
				"/ofertas-tcc/ultima",
			);

			console.log("Resposta da API da oferta:", responseOferta);

			// Verificar se a resposta tem a estrutura esperada
			const oferta = responseOferta.data || responseOferta;

			if (
				!oferta ||
				!oferta.ano ||
				!oferta.semestre ||
				!oferta.id_curso ||
				!oferta.fase
			) {
				throw new Error(
					"Resposta da API da oferta não contém dados válidos",
				);
			}

			console.log("Oferta extraída:", oferta);
			setOfertaAtual(oferta);

			// Buscar o discente pelo id_usuario
			const responseDiscente = await axiosInstance.get(
				`/dicentes/usuario/${usuario.id}`,
			);

			console.log("Resposta da API do discente:", responseDiscente);

			// Verificar se a resposta tem a estrutura esperada
			const discente = responseDiscente.data || responseDiscente;

			if (!discente || !discente.matricula) {
				throw new Error(
					"Resposta da API do discente não contém dados válidos",
				);
			}

			console.log("Discente extraído:", discente);

			if (discente && discente.matricula) {
				// Buscar o trabalho de conclusão do discente
				const responseTcc = await axiosInstance.get(
					`/trabalho-conclusao/discente/${discente.matricula}`,
				);

				if (responseTcc) {
					// Verificar se a resposta tem a estrutura esperada
					const tcc = responseTcc.data || responseTcc;

					if (!tcc || !tcc.id) {
						throw new Error(
							"Resposta da API do TCC não contém dados válidos",
						);
					}

					console.log("TCC extraído:", tcc);

					// Verificar se o TCC é da oferta atual ou anterior
					const isTccOfertaAtual =
						tcc.ano === oferta.ano &&
						tcc.semestre === oferta.semestre;

					if (!isTccOfertaAtual) {
						// TCC é de oferta anterior - aplicar regras de importação
						setTccAnterior(tcc);

						if (tcc.aprovado_tcc) {
							// 1.3 TCC já concluído - exibir mensagem
							setShowCompletedMessage(true);
							return;
						} else if (tcc.aprovado_projeto) {
							// 1.1 Projeto aprovado - perguntar se quer seguir com próxima fase
							setModalType("next_phase");
							setOpenImportModal(true);
							return;
						} else {
							// 1.2 Projeto não aprovado - perguntar se quer importar TCC anterior
							setModalType("import");
							setOpenImportModal(true);
							return;
						}
					} else {
						// TCC da oferta atual - carregar normalmente
						// Garantir que o id_curso esteja presente, mesmo que a API não o retorne
						const tccCompleto = {
							...tcc,
							id_curso: tcc.id_curso || oferta.id_curso,
							ano: tcc.ano || oferta.ano,
							semestre: tcc.semestre || oferta.semestre,
							fase: tcc.fase || oferta.fase,
						};

						setTrabalhoConclusao(tccCompleto);
						setBloquearAtualizacaoEtapa(
							isEtapaFinalBloqueada(tccCompleto),
						);
						setFormData({
							tema: tccCompleto.tema || "",
							titulo: tccCompleto.titulo || "",
							resumo: tccCompleto.resumo || "",
							seminario_andamento:
								tccCompleto.seminario_andamento || "",
						});

						// Usar a etapa do banco de dados
						const etapaBanco = tccCompleto.etapa || 0;
						setActiveStep(etapaBanco);
						if (onEtapaChange) {
							onEtapaChange(etapaBanco);
						}

						// Carregar convites existentes se houver
						await carregarConvites(tccCompleto.id);
					}
				} else {
					// Criar novo trabalho de conclusão se não existir
					await criarNovoTrabalhoConclusao(discente.matricula);
				}
			} else {
				setMessageText(
					"Usuário não possui matrícula de discente associada!",
				);
				setMessageSeverity("error");
				setOpenMessage(true);
			}
		} catch (error) {
			console.error("Erro ao carregar trabalho de conclusão:", error);
			setMessageText("Erro ao carregar dados do TCC!");
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	};

	const carregarConvites = async (idTcc) => {
		try {
			console.log("Carregando convites para TCC ID:", idTcc);
			const params = new URLSearchParams();
			params.append("id_tcc", idTcc);
			const response = await axiosInstance.get(
				`/convites?${params.toString()}`,
			);

			console.log("Resposta da API ao carregar convites:", response);

			const convites = response.data?.convites || response.convites || [];

			// Separar convites de orientação e banca
			const conviteOrientacao = convites.find(
				(convite) => convite.orientacao === true,
			);
			const convitesBancaArray = convites.filter(
				(convite) => convite.orientacao === false,
			);

			if (conviteOrientacao) {
				setConviteExistente(conviteOrientacao);
			}
			setConvitesBanca(convitesBancaArray);

			console.log("Convites carregados:", {
				conviteOrientacao,
				convitesBancaArray,
			});
		} catch (error) {
			console.error("Erro ao carregar convites:", error);
			// Não re-throw o erro para não interromper o fluxo principal
		}
	};

	const carregarDefesas = async (idTcc) => {
		try {
			const resp = await axiosInstance.get(`/defesas/tcc/${idTcc}`);
			const lista = resp.data?.defesas || resp.defesas || [];
			const defesasF1 = lista.filter((d) => d.fase === 1);
			const defesasF2 = lista.filter((d) => d.fase === 2);
			setDefesasFase1(defesasF1);
			setDefesasFase2(defesasF2);
		} catch (e) {
			setDefesasFase1([]);
			setDefesasFase2([]);
		}
	};

	// Função para verificar se já existe defesa agendada para uma fase específica
	const temDefesaAgendada = (fase) => {
		const defesas = fase === 1 ? defesasFase1 : defesasFase2;
		return (
			defesas && defesas.length > 0 && defesas.some((d) => d.data_defesa)
		);
	};

	// Função para obter dados da defesa agendada (data, hora) para uma fase específica
	const obterDadosDefesaAgendada = (fase) => {
		const defesas = fase === 1 ? defesasFase1 : defesasFase2;
		if (!defesas || defesas.length === 0) return null;

		const defesaAgendada = defesas.find((d) => d.data_defesa) || defesas[0];
		if (!defesaAgendada || !defesaAgendada.data_defesa) return null;

		const { dataStr, horaStr } = formatarDataDefesaUTC(defesaAgendada.data_defesa);
		return {
			dataStr,
			horaStr,
			defesa: defesaAgendada,
		};
	};

	const criarNovoTrabalhoConclusao = async (matricula) => {
		try {
			// Verificar se temos a oferta atual antes de criar o TCC
			if (!ofertaAtual) {
				throw new Error("Oferta TCC atual não encontrada");
			}

			const novoTcc = {
				matricula: matricula,
				tema: "",
				titulo: "",
				resumo: "",
				etapa: 0, // Começar na etapa 0 (visualização de temas)
				ano: ofertaAtual.ano,
				semestre: ofertaAtual.semestre,
				id_curso: ofertaAtual.id_curso,
				fase: ofertaAtual.fase,
			};

			console.log("Criando novo TCC com dados:", novoTcc);
			const response = await axiosInstance.post(
				"/trabalho-conclusao",
				novoTcc,
			);

			console.log("Resposta da API ao criar TCC:", response);
			console.log("Tipo da resposta:", typeof response);
			console.log("Estrutura da resposta:", Object.keys(response));

			// Verificar se a resposta tem a estrutura esperada
			const tccCriado = response.data || response;

			console.log("TCC criado extraído:", tccCriado);
			console.log("Tipo do TCC criado:", typeof tccCriado);
			console.log(
				"Estrutura do TCC criado:",
				tccCriado ? Object.keys(tccCriado) : "null",
			);

			if (!tccCriado || !tccCriado.id) {
				console.error("Resposta inválida da API:", response);
				throw new Error(
					"Resposta da API não contém dados válidos do TCC criado",
				);
			}

			// Garantir que o id_curso esteja presente, mesmo que a API não o retorne
			const tccCompletoCriado = {
				...tccCriado,
				id_curso: tccCriado.id_curso || ofertaAtual.id_curso,
				ano: tccCriado.ano || ofertaAtual.ano,
				semestre: tccCriado.semestre || ofertaAtual.semestre,
				fase: tccCriado.fase || ofertaAtual.fase,
			};

			setTrabalhoConclusao(tccCompletoCriado);
			setBloquearAtualizacaoEtapa(false);
			setActiveStep(0);
			if (onEtapaChange) {
				onEtapaChange(0);
			}

			// Carregar convites após criar o TCC
			await carregarConvites(tccCompletoCriado.id);

			// Verificar se o TCC foi realmente criado no banco
			try {
				const verificacao = await axiosInstance.get(
					`/trabalho-conclusao/${tccCriado.id}`,
				);
				console.log("Verificação da criação do TCC:", verificacao);
			} catch (verifError) {
				console.error("Erro ao verificar TCC criado:", verifError);
			}

			return tccCriado;
		} catch (error) {
			console.error("Erro ao criar trabalho de conclusão:", error);
			setMessageText("Erro ao criar novo TCC!");
			setMessageSeverity("error");
			setOpenMessage(true);
			throw error; // Re-throw para que o chamador possa tratar o erro
		}
	};

	// Função para determinar quais etapas são válidas baseado na fase do TCC
	const getEtapasValidas = () => {
		if (trabalhoConclusao && trabalhoConclusao.fase === 1) {
			return steps.slice(0, 6); // Fase 1 agora vai até a etapa 6 (seleção de horário da banca do projeto)
		}
		// Para fase 2, verificar se o projeto foi aprovado antes de incluir a etapa 7
		if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
			if (trabalhoConclusao.aprovado_projeto) {
				return steps; // Todas as etapas se o projeto foi aprovado
			} else {
				return steps.slice(0, 6); // Apenas até a etapa 6 se o projeto não foi aprovado
			}
		}
		return steps; // Fallback para outras situações
	};

	const validarEtapaAtual = () => {
		switch (activeStep) {
			case 0:
				// Na etapa 0, só pode avançar se tiver um convite aceito
				return conviteExistente && conviteExistente.aceito === true;
			case 1:
				return formData.tema && formData.tema.trim().length > 0;
			case 2:
				return formData.titulo && formData.titulo.trim().length > 0;
			case 3:
				return formData.resumo && formData.resumo.trim().length > 0;
			case 4:
				// Etapa 4 (convite para banca do projeto - fase 1) - precisa de 2 convites aceitos
				const convitesAceitosFase1 = convitesBanca.filter(
					(convite) => convite.aceito === true && convite.fase === 1,
				);
				return convitesAceitosFase1.length >= 2;
			case 5:
				// Etapa 6 (nova): Seleção de horário da banca do projeto (fase 1) ou Resumo (fase 2)
				if (trabalhoConclusao && trabalhoConclusao.fase === 1) {
					// Se já tem defesa agendada na fase 1, pode prosseguir
					if (temDefesaAgendada(1)) {
						return true;
					}
					// Senão, precisa ter horário selecionado
					return (
						selectedHorarioBancaFase1 &&
						selectedHorarioBancaFase1.data &&
						selectedHorarioBancaFase1.hora
					);
				}
				// Para fase 2, a etapa 6 é apenas informativa
				if (trabalhoConclusao && trabalhoConclusao.fase === 2)
					return true;
				return true;
			case 6:
				// Etapa 7 (fase 2): Seminário de Andamento obrigatório
				// Só pode prosseguir se estiver na fase 2 E o projeto foi aprovado
				if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
					// Verificar se o projeto foi aprovado
					if (!trabalhoConclusao.aprovado_projeto) {
						return false; // Não pode prosseguir se o projeto não foi aprovado
					}
					return (
						formData.seminario_andamento &&
						formData.seminario_andamento.trim().length > 0
					);
				}
				return true; // Para fase 1, não existe esta etapa
			case 7:
				// Etapa 8 (fase 2): precisa de 2 convites aceitos para banca final
				if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
					const convitesAceitosFase2 = convitesBanca.filter(
						(convite) =>
							convite.aceito === true && convite.fase === 2,
					);
					return convitesAceitosFase2.length >= 2;
				}
				return true;
			case 8:
				// Etapa 9 (fase 2): seleção de horário comum entre orientador e 2 membros aceitos
				// Se já tem defesa agendada na fase 2, pode prosseguir
				if (temDefesaAgendada(2)) {
					return true;
				}
				// Senão, precisa ter horário selecionado
				return (
					selectedHorarioBancaFase2 &&
					selectedHorarioBancaFase2.data &&
					selectedHorarioBancaFase2.hora
				);
			default:
				return true;
		}
	};

	const handleNext = async () => {
		// Validar se os campos da etapa atual estão preenchidos
		if (!validarEtapaAtual()) {
			setMessageText(
				"Por favor, preencha todos os campos obrigatórios antes de continuar.",
			);
			setMessageSeverity("warning");
			setOpenMessage(true);
			return;
		}

		try {
			const etapasValidas = getEtapasValidas();
			if (activeStep === etapasValidas.length - 1) {
				// Última etapa - salvar tudo
				const sucesso = await salvarTrabalhoConclusao();
				if (sucesso) {
					const novaEtapa = activeStep + 1;
					setActiveStep(novaEtapa);
					if (onEtapaChange) {
						onEtapaChange(novaEtapa);
					}
				}
			} else {
				// Salvar etapa atual e avançar para próxima etapa (incluindo etapa 0)
				const sucesso = await salvarEtapaAtual();
				if (sucesso) {
					const novaEtapa = activeStep + 1;
					setActiveStep(novaEtapa);
					if (onEtapaChange) {
						onEtapaChange(novaEtapa);
					}
				}
			}
		} catch (error) {
			console.error("Erro ao avançar etapa:", error);
			setMessageText(
				"Erro ao salvar dados. Verifique sua conexão e tente novamente.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	};

	const handleBack = async () => {
		const novaEtapa = activeStep - 1;
		setActiveStep(novaEtapa);

		// Ao voltar, apenas atualizar o estado local sem persistir no banco de dados
		// A etapa no banco só deve ser atualizada ao avançar (handleNext)
		if (onEtapaChange) {
			onEtapaChange(novaEtapa);
		}
	};

	const salvarEtapaAtual = async () => {
		if (!trabalhoConclusao || !trabalhoConclusao.id) {
			setMessageText(
				"Erro: Trabalho de conclusão não encontrado. Recarregue a página.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
			return false;
		}

		try {
			if (bloquearAtualizacaoEtapa) {
				// Não persistir nada no banco quando bloqueado
				return true;
			}
			setSaving(true);
			const novaEtapa = activeStep + 1;
			const dadosAtualizados = {
				...trabalhoConclusao,
				...formData,
				etapa: novaEtapa,
			};

			await axiosInstance.put(
				`/trabalho-conclusao/${trabalhoConclusao.id}`,
				dadosAtualizados,
			);
			setTrabalhoConclusao(dadosAtualizados);
			setBloquearAtualizacaoEtapa(
				isEtapaFinalBloqueada(dadosAtualizados),
			);

			setMessageText("Etapa salva com sucesso!");
			setMessageSeverity("success");
			setOpenMessage(true);

			return true;
		} catch (error) {
			console.error("Erro ao salvar etapa:", error);
			setMessageText("Erro ao salvar etapa atual!");
			setMessageSeverity("error");
			setOpenMessage(true);
			return false;
		} finally {
			setSaving(false);
		}
	};

	const salvarTrabalhoConclusao = async () => {
		if (!trabalhoConclusao || !trabalhoConclusao.id) {
			setMessageText(
				"Erro: Trabalho de conclusão não encontrado. Recarregue a página.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
			return false;
		}

		try {
			if (bloquearAtualizacaoEtapa) {
				// Não persistir nada no banco quando bloqueado
				return true;
			}
			setSaving(true);
			const etapasValidas = getEtapasValidas();
			const dadosAtualizados = {
				...trabalhoConclusao,
				...formData,
				etapa: etapasValidas.length,
			};

			// Se houver horário selecionado (fase 1 ou fase 2), agendar defesa antes de finalizar
			const horarioEscolhido =
				trabalhoConclusao.fase === 1
					? selectedHorarioBancaFase1
					: selectedHorarioBancaFase2;
			if (horarioEscolhido && trabalhoConclusao) {
				try {
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

					if (codigoOrientador && membrosAceitosFase.length === 2) {
						await axiosInstance.post("/defesas/agendar", {
							id_tcc: trabalhoConclusao.id,
							fase: trabalhoConclusao.fase,
							data: horarioEscolhido.data,
							hora: horarioEscolhido.hora,
							codigo_orientador: codigoOrientador,
							membros_banca: membrosAceitosFase,
						});
						// Recarregar defesas e refletir horário escolhido no estado local
						await carregarDefesas(trabalhoConclusao.id);
						if (trabalhoConclusao.fase === 2) {
							setSelectedHorarioBancaFase2(horarioEscolhido);
						} else {
							setSelectedHorarioBancaFase1(horarioEscolhido);
						}
					}
				} catch (e) {
					console.error("Erro ao agendar defesa:", e);
					setMessageText("Erro ao agendar defesa. Tente novamente.");
					setMessageSeverity("error");
					setOpenMessage(true);
					return false;
				}
			}

			await axiosInstance.put(
				`/trabalho-conclusao/${trabalhoConclusao.id}`,
				dadosAtualizados,
			);
			setTrabalhoConclusao(dadosAtualizados);
			setBloquearAtualizacaoEtapa(
				isEtapaFinalBloqueada(dadosAtualizados),
			);

			// Notificar componente pai sobre mudança de etapa
			if (onEtapaChange) {
				onEtapaChange(etapasValidas.length);
			}

			setMessageText("TCC salvo com sucesso!");
			setMessageSeverity("success");
			setOpenMessage(true);

			return true;
		} catch (error) {
			console.error("Erro ao salvar TCC:", error);
			setMessageText("Erro ao salvar TCC!");
			setMessageSeverity("error");
			setOpenMessage(true);
			return false;
		} finally {
			setSaving(false);
		}
	};

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleOpenConviteModal = () => {
		setOpenConviteModal(true);
	};

	const handleCloseConviteModal = () => {
		setOpenConviteModal(false);
	};

	const handleOpenConviteBancaModal = () => {
		setOpenConviteBancaModal(true);
	};

	const handleCloseConviteBancaModal = () => {
		setOpenConviteBancaModal(false);
	};

	const handleOpenConviteBancaFinalModal = () => {
		setOpenConviteBancaFinalModal(true);
	};

	const handleCloseConviteBancaFinalModal = () => {
		setOpenConviteBancaFinalModal(false);
	};

	const handleConviteEnviado = async () => {
		if (trabalhoConclusao) {
			await carregarConvites(trabalhoConclusao.id);
		}
		setMessageText("Convite enviado com sucesso!");
		setMessageSeverity("success");
		setOpenMessage(true);
	};

	const handleConviteBancaEnviado = async () => {
		if (trabalhoConclusao) {
			await carregarConvites(trabalhoConclusao.id);
		}
		setMessageText("Convites para banca enviados com sucesso!");
		setMessageSeverity("success");
		setOpenMessage(true);
	};

	const handleImportModalClose = () => {
		setOpenImportModal(false);
	};

	const handleImportData = async (opcaoSelecionada) => {
		setOpenImportModal(false);

		if (!tccAnterior || !ofertaAtual) return;

		try {
			setLoading(true);
			const responseDiscente = await axiosInstance.get(
				`/dicentes/usuario/${usuario.id}`,
			);

			console.log(
				"Resposta da API do discente na importação:",
				responseDiscente,
			);

			// Verificar se a resposta tem a estrutura esperada
			const discente = responseDiscente.data || responseDiscente;

			if (!discente || !discente.matricula) {
				throw new Error(
					"Resposta da API do discente não contém dados válidos",
				);
			}

			console.log("Discente extraído na importação:", discente);

			if (modalType === "next_phase") {
				// 1.1 Projeto aprovado - pergunta sobre próxima fase
				if (opcaoSelecionada) {
					// Sim: atualizar TCC existente para oferta atual (próxima fase)
					const dadosAtualizados = {
						...tccAnterior,
						ano: ofertaAtual.ano,
						semestre: ofertaAtual.semestre,
						id_curso: ofertaAtual.id_curso,
						fase: 2, // TCC II (próxima fase)
						aprovado_projeto: true, // Se está migrando para fase 2, o projeto foi aprovado
					};

					const response = await axiosInstance.put(
						`/trabalho-conclusao/${tccAnterior.id}`,
						dadosAtualizados,
					);

					const tccAtualizado =
						response.trabalho || response.data || response;
					// Garantir que o id_curso esteja presente, mesmo que a API não o retorne
					const tccAtualizadoCompleto = {
						...tccAtualizado,
						id_curso:
							tccAtualizado.id_curso || ofertaAtual.id_curso,
						ano: tccAtualizado.ano || ofertaAtual.ano,
						semestre:
							tccAtualizado.semestre || ofertaAtual.semestre,
						fase: tccAtualizado.fase || 2,
					};

					setTrabalhoConclusao(tccAtualizadoCompleto);
					setBloquearAtualizacaoEtapa(
						isEtapaFinalBloqueada(tccAtualizadoCompleto),
					);
					setFormData({
						tema: tccAtualizadoCompleto.tema || "",
						titulo: tccAtualizadoCompleto.titulo || "",
						resumo: tccAtualizadoCompleto.resumo || "",
						seminario_andamento:
							tccAtualizadoCompleto.seminario_andamento || "",
					});

					// Manter a etapa atual do TCC ou definir etapa apropriada para fase 2
					// Se o projeto foi aprovado na fase 1, continuar da etapa 6 (seminário de andamento)
					// Se não foi aprovado, continuar da etapa atual
					let etapaContinuacao = tccAnterior.etapa || 0;

					// Se o projeto foi aprovado e estamos migrando para fase 2,
					// continuar da etapa 6 (seminário de andamento)
					if (
						tccAnterior.aprovado_projeto &&
						tccAnterior.fase === 1
					) {
						etapaContinuacao = 6; // Etapa do seminário de andamento
					}

					setActiveStep(etapaContinuacao);
					if (onEtapaChange) {
						onEtapaChange(etapaContinuacao);
					}

					await carregarConvites(tccAnterior.id);

					setMessageText(
						`TCC atualizado para ${ofertaAtual.ano}/${ofertaAtual.semestre}! Você está na fase TCC II.`,
					);
					setMessageSeverity("success");
					setOpenMessage(true);
				} else {
					// Não: criar novo TCC em etapa 0
					try {
						const novoTcc = await criarNovoTrabalhoConclusao(
							discente.matricula,
						);

						// Atualizar o estado local com o novo TCC
						// Garantir que tenha todos os campos necessários
						const novoTccCompleto = {
							...novoTcc,
							id_curso: novoTcc.id_curso || ofertaAtual.id_curso,
							ano: novoTcc.ano || ofertaAtual.ano,
							semestre: novoTcc.semestre || ofertaAtual.semestre,
							fase: novoTcc.fase || ofertaAtual.fase,
						};

						setTrabalhoConclusao(novoTccCompleto);
						setFormData({
							tema: novoTccCompleto.tema || "",
							titulo: novoTccCompleto.titulo || "",
							resumo: novoTccCompleto.resumo || "",
							seminario_andamento:
								novoTccCompleto.seminario_andamento || "",
						});

						setMessageText(
							`Novo TCC criado para ${ofertaAtual.ano}/${ofertaAtual.semestre}!`,
						);
						setMessageSeverity("success");
						setOpenMessage(true);
					} catch (error) {
						console.error("Erro ao criar novo TCC:", error);
						setMessageText(
							"Erro ao criar novo TCC. Tente novamente.",
						);
						setMessageSeverity("error");
						setOpenMessage(true);
					}
				}
			} else if (modalType === "import") {
				// 1.2 Projeto não aprovado - pergunta sobre importar
				if (opcaoSelecionada) {
					// Sim: criar novo TCC copiando valores do anterior
					const novoTcc = {
						matricula: discente.matricula,
						tema: tccAnterior.tema || "",
						titulo: tccAnterior.titulo || "",
						resumo: tccAnterior.resumo || "",
						etapa: 0, // Sempre começar na etapa 0
						ano: ofertaAtual.ano,
						semestre: ofertaAtual.semestre,
						id_curso: ofertaAtual.id_curso,
						fase: ofertaAtual.fase,
					};

					const response = await axiosInstance.post(
						"/trabalho-conclusao",
						novoTcc,
					);

					console.log("Resposta da API ao importar TCC:", response);
					console.log("Tipo da resposta:", typeof response);
					console.log(
						"Estrutura da resposta:",
						Object.keys(response),
					);

					// Verificar se a resposta tem a estrutura esperada
					const tccImportado = response.data || response;

					console.log("TCC importado extraído:", tccImportado);
					console.log("Tipo do TCC importado:", typeof tccImportado);
					console.log(
						"Estrutura do TCC importado:",
						tccImportado ? Object.keys(tccImportado) : "null",
					);

					if (!tccImportado || !tccImportado.id) {
						console.error("Resposta inválida da API:", response);
						throw new Error(
							"Resposta da API não contém dados válidos do TCC importado",
						);
					}

					// Garantir que o id_curso esteja presente, mesmo que a API não o retorne
					const tccCompletoImportado = {
						...tccImportado,
						id_curso: tccImportado.id_curso || ofertaAtual.id_curso,
						ano: tccImportado.ano || ofertaAtual.ano,
						semestre: tccImportado.semestre || ofertaAtual.semestre,
						fase: tccImportado.fase || ofertaAtual.fase,
					};

					setTrabalhoConclusao(tccCompletoImportado);
					setBloquearAtualizacaoEtapa(
						isEtapaFinalBloqueada(tccCompletoImportado),
					);
					setFormData({
						tema: novoTcc.tema,
						titulo: novoTcc.titulo,
						resumo: novoTcc.resumo,
						seminario_andamento: novoTcc.seminario_andamento || "",
					});
					setActiveStep(0);
					if (onEtapaChange) {
						onEtapaChange(0);
					}

					await carregarConvites(tccImportado.id);

					// Verificar se o TCC foi realmente criado no banco
					try {
						const verificacao = await axiosInstance.get(
							`/trabalho-conclusao/${tccImportado.id}`,
						);
						console.log(
							"Verificação da criação do TCC importado:",
							verificacao,
						);
					} catch (verifError) {
						console.error(
							"Erro ao verificar TCC importado:",
							verifError,
						);
					}

					setMessageText(
						`TCC importado com sucesso para ${ofertaAtual.ano}/${ofertaAtual.semestre}!`,
					);
					setMessageSeverity("success");
					setOpenMessage(true);
				} else {
					// Não: criar novo TCC em etapa 0
					try {
						const novoTcc = await criarNovoTrabalhoConclusao(
							discente.matricula,
						);

						// Atualizar o estado local com o novo TCC
						// Garantir que tenha todos os campos necessários
						const novoTccCompleto = {
							...novoTcc,
							id_curso: novoTcc.id_curso || ofertaAtual.id_curso,
							ano: novoTcc.ano || ofertaAtual.ano,
							semestre: novoTcc.semestre || ofertaAtual.semestre,
							fase: novoTcc.fase || ofertaAtual.fase,
						};

						setTrabalhoConclusao(novoTccCompleto);
						setFormData({
							tema: novoTccCompleto.tema || "",
							titulo: novoTccCompleto.titulo || "",
							resumo: novoTccCompleto.resumo || "",
							seminario_andamento:
								novoTccCompleto.seminario_andamento || "",
						});

						setMessageText(
							`Novo TCC criado para ${ofertaAtual.ano}/${ofertaAtual.semestre}!`,
						);
						setMessageSeverity("success");
						setOpenMessage(true);
					} catch (error) {
						console.error("Erro ao criar novo TCC:", error);
						setMessageText(
							"Erro ao criar novo TCC. Tente novamente.",
						);
						setMessageSeverity("error");
						setOpenMessage(true);
					}
				}
			}
		} catch (error) {
			console.error("Erro ao processar ação:", error);
			setMessageText("Erro ao processar ação. Tente novamente.");
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	};

	const handleCloseMessage = (_, reason) => {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	};

	const renderStepContent = (step) => {
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
											{conviteExistente.Docente && (
												<Typography variant="body2">
													<strong>Orientador:</strong>{" "}
													{
														conviteExistente.Docente
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
										!conviteExistente.aceito ? (
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
											disabled={
												conviteExistente &&
												!conviteExistente.aceito
											}
										>
											{conviteExistente &&
											!conviteExistente.aceito
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
				return (
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6" gutterBottom>
							Etapa 2: Tema do TCC
						</Typography>
						<TextField
							fullWidth
							label="Tema do TCC *"
							value={formData.tema}
							onChange={(e) =>
								handleInputChange("tema", e.target.value)
							}
							multiline
							rows={3}
							placeholder="Descreva o tema do seu trabalho de conclusão de curso..."
							helperText="Descreva de forma clara e objetiva o tema que será abordado no seu TCC"
						/>
					</Box>
				);
			case 2:
				return (
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6" gutterBottom>
							Etapa 3: Título do TCC
						</Typography>
						<TextField
							fullWidth
							label="Título do TCC *"
							value={formData.titulo}
							onChange={(e) =>
								handleInputChange("titulo", e.target.value)
							}
							placeholder="Digite o título do seu trabalho de conclusão de curso..."
							helperText="O título deve ser claro, conciso e representativo do conteúdo do trabalho"
						/>
					</Box>
				);
			case 3:
				return (
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6" gutterBottom>
							Etapa 4: Resumo do TCC
						</Typography>
						<TextField
							fullWidth
							label="Resumo do TCC *"
							value={formData.resumo}
							onChange={(e) =>
								handleInputChange("resumo", e.target.value)
							}
							multiline
							rows={6}
							placeholder="Escreva um resumo do seu trabalho de conclusão de curso..."
							helperText="O resumo deve apresentar os objetivos, metodologia, resultados e conclusões principais do trabalho"
						/>
					</Box>
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
																		.Docente
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
			case 5:
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
				let dataStr = null;
				let horaStr = null;
				if (
					selectedHorarioBancaFase1 &&
					selectedHorarioBancaFase1.data &&
					selectedHorarioBancaFase1.hora
				) {
					dataStr = new Date(
						selectedHorarioBancaFase1.data,
					).toLocaleDateString("pt-BR");
					horaStr = selectedHorarioBancaFase1.hora;
				} else {
					const defesaAgendada =
						defesasFase1 && defesasFase1.length > 0
							? defesasFase1.find((d) => !!d.data_defesa) ||
								defesasFase1[0]
							: null;
					const dataHoraFormatada =
						defesaAgendada && defesaAgendada.data_defesa
							? new Date(defesaAgendada.data_defesa)
							: null;
					dataStr = dataHoraFormatada
						? dataHoraFormatada.toLocaleDateString("pt-BR")
						: null;
					horaStr = dataHoraFormatada
						? dataHoraFormatada.toLocaleTimeString("pt-BR", {
								hour: "2-digit",
								minute: "2-digit",
							})
						: null;
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
			case 7:
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
														{convite.Docente
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
													{convite.Docente?.nome ||
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
			case 8:
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
			</Box>
		);
	}

	if (!trabalhoConclusao && activeStep === 0) {
		return (
			<Box sx={{ width: "100%" }}>
				<Typography variant="h5" component="h2" gutterBottom>
					Processo do TCC
				</Typography>

				<Paper sx={{ p: 3, mb: 3 }}>
					<Stepper activeStep={activeStep} sx={{ mb: 4 }}>
						{steps.map((label, index) => {
							const stepProps = {};
							const labelProps = {};

							return (
								<Step key={label} {...stepProps}>
									<StepLabel {...labelProps}>
										{label}
									</StepLabel>
								</Step>
							);
						})}
					</Stepper>

					<Box>
						{renderStepContent(activeStep)}

						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								pt: 2,
							}}
						>
							<Box sx={{ flex: "1 1 auto" }} />
							<Button
								onClick={() => {
									const novaEtapa = activeStep + 1;
									setActiveStep(novaEtapa);
									if (onEtapaChange) {
										onEtapaChange(novaEtapa);
									}
								}}
								variant="contained"
								color="primary"
							>
								Próximo
							</Button>
						</Box>
					</Box>
				</Paper>
			</Box>
		);
	}

	return (
		<Box sx={{ width: "100%" }}>
			<Typography variant="h5" component="h2" gutterBottom>
				Processo do TCC
			</Typography>

			{ofertaAtual && (
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
						Ano: {ofertaAtual.ano} • Semestre:{" "}
						{ofertaAtual.semestre} • Curso:{" "}
						{ofertaAtual.Curso?.nome} • Fase: {ofertaAtual.fase}
					</Typography>
				</Paper>
			)}

			<Paper
				sx={{
					p: 3,
					mb: 3,
					backgroundColor: theme.palette.background.default,
				}}
			>
				<Stepper activeStep={activeStep} sx={{ mb: 4 }}>
					{getEtapasValidas().map((label, index) => {
						const stepProps = {};
						const labelProps = {};

						// Verificar se a etapa está completa
						const isStepComplete = (() => {
							switch (index) {
								case 0:
									return true; // Etapa 0 sempre completa (visualização)
								case 1:
									return (
										formData.tema &&
										formData.tema.trim().length > 0
									);
								case 2:
									return (
										formData.titulo &&
										formData.titulo.trim().length > 0
									);
								case 3:
									return (
										formData.resumo &&
										formData.resumo.trim().length > 0
									);
								case 4:
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
								case 5:
									// Etapa 6: Fase 1 requer horário selecionado; Fase 2 requer seminário preenchido
									if (trabalhoConclusao?.fase === 1) {
										return (
											selectedHorarioBancaFase1 &&
											selectedHorarioBancaFase1.data &&
											selectedHorarioBancaFase1.hora
										);
									}
									if (trabalhoConclusao?.fase === 2) {
										// Para fase 2, verificar se o projeto foi aprovado
										if (
											!trabalhoConclusao.aprovado_projeto
										) {
											return false; // Não pode completar se o projeto não foi aprovado
										}
										return (
											formData.seminario_andamento &&
											formData.seminario_andamento.trim()
												.length > 0
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
									return (
										selectedHorarioBancaFase2 &&
										selectedHorarioBancaFase2.data &&
										selectedHorarioBancaFase2.hora
									);
								default:
									return false;
							}
						})();

						return (
							<Step key={label} {...stepProps}>
								<StepLabel
									{...labelProps}
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

				{/* Botões de navegação na parte superior */}
				{activeStep !== getEtapasValidas().length && (
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							mb: 3,
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Box sx={{ display: "flex", gap: 1 }}>
							{activeStep > 0 && (
								<Button
									color="inherit"
									onClick={() => {
										if (onEtapaChange) {
											onEtapaChange(0);
										}
									}}
									variant="outlined"
									size="small"
								>
									Voltar para Temas
								</Button>
							)}
							<Button
								color="inherit"
								disabled={activeStep === 0}
								onClick={handleBack}
								variant="outlined"
								size="small"
							>
								Voltar
							</Button>
						</Box>
						{/* Só mostrar o botão se não estiver na etapa final ou se o projeto estiver aprovado na fase 2 */}
						{(() => {
							const isLastStep =
								activeStep === getEtapasValidas().length - 1;
							const canShowFinalizeButton =
								isLastStep &&
								(trabalhoConclusao?.fase !== 2 ||
									(trabalhoConclusao?.fase === 2 &&
										trabalhoConclusao?.aprovado_projeto));

							return canShowFinalizeButton ? (
								<Button
									onClick={handleNext}
									disabled={saving || !validarEtapaAtual()}
									variant="contained"
									color="primary"
									size="small"
								>
									{saving ? (
										<>
											<CircularProgress
												size={16}
												sx={{ mr: 1 }}
											/>
											Salvando...
										</>
									) : (
										"Finalizar"
									)}
								</Button>
							) : (
								<Button
									onClick={handleNext}
									disabled={saving || !validarEtapaAtual()}
									variant="contained"
									color="primary"
									size="small"
								>
									{saving ? (
										<>
											<CircularProgress
												size={16}
												sx={{ mr: 1 }}
											/>
											Salvando...
										</>
									) : (
										"Próximo"
									)}
								</Button>
							);
						})()}
					</Box>
				)}

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
										let dataStr = null;
										let horaStr = null;
										if (
											selectedHorarioBancaFase2 &&
											selectedHorarioBancaFase2.data &&
											selectedHorarioBancaFase2.hora
										) {
											dataStr = new Date(
												selectedHorarioBancaFase2.data,
											).toLocaleDateString("pt-BR");
											horaStr =
												selectedHorarioBancaFase2.hora;
										} else {
											const defesaAgendada =
												defesasFase2 &&
												defesasFase2.length > 0
													? defesasFase2.find(
															(d) =>
																!!d.data_defesa,
														) || defesasFase2[0]
													: null;
											const dataHoraFormatada =
												defesaAgendada &&
												defesaAgendada.data_defesa
													? new Date(
															defesaAgendada.data_defesa,
														)
													: null;
											dataStr = dataHoraFormatada
												? dataHoraFormatada.toLocaleDateString(
														"pt-BR",
													)
												: null;
											horaStr = dataHoraFormatada
												? dataHoraFormatada.toLocaleTimeString(
														"pt-BR",
														{
															hour: "2-digit",
															minute: "2-digit",
														},
													)
												: null;
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
										<Typography sx={{ mt: 2, mb: 1 }}>
											Todas as etapas foram concluídas!
										</Typography>
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
			</Paper>

			<Snackbar
				open={openMessage}
				autoHideDuration={6000}
				onClose={handleCloseMessage}
			>
				<Alert severity={messageSeverity} onClose={handleCloseMessage}>
					{messageText}
				</Alert>
			</Snackbar>

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
