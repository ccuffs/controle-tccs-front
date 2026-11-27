import { useState, useEffect, useContext } from "react";
import axiosInstance from "../../auth/axios";
import { AuthContext } from "../../contexts/AuthContext";
import type { Convite } from "../../types/convite";


/*
 * Regras e estado da jornada do discente (antes no corpo de TccStepper.tsx).
 * Passo 0 do redesenho: só a separação, sem mudança de comportamento.
 */
export const steps = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * `TrabalhoLocal` usa um índice para acomodar o padrão
 * `{...trabalhoConclusao, ...formData}` usado ao longo do componente.
 */
export interface OfertaLocal {
	ano: number;
	semestre: number;
	id_curso: number;
	fase: number;
	curso?: { nome?: string };
}

export type ConviteLocal = Convite;

export interface DefesaLocal {
	id_tcc: number;
	membro_banca: string;
	fase: number;
	data_defesa?: string | null;
	avaliacao?: number | string | null;
	orientador?: boolean;
	membroBanca?: { nome?: string };
}

export interface DiscenteLocal {
	matricula: string;
	nome?: string;
	email?: string;
}

export interface TrabalhoLocal {
	id: number;
	ano: number;
	semestre: number;
	id_curso: number;
	fase: number;
	etapa?: number;
	tema?: string;
	titulo?: string;
	resumo?: string;
	seminario_andamento?: string;
	aprovado_tcc?: boolean;
	aprovado_projeto?: boolean;
	matricula?: string;
	[key: string]: unknown;
}

export interface FormDataStepper {
	tema: string;
	titulo: string;
	resumo: string;
	seminario_andamento: string;
}

export interface HorarioSelecionado {
	data: string;
	hora: string;
}

/** Informações do TCC expostas para a tela "Meu TCC" do novo design. */
export interface ContextoTcc {
	fase: number;
	ano: number | null;
	semestre: number | null;
	curso: string | null;
	idTcc: number | null;
	idCurso: number | null;
	/** Etapa gravada no banco (até onde o discente já chegou). */
	etapaSalva: number;
	/** Quantidade de etapas da fase no stepper (6 no TCC I, 9 no TCC II). */
	totalEtapas: number;
	aprovado: boolean;
	convitePendente: boolean;
	/** "concluido": TCC aprovado em período anterior; "anterior": TCC antigo aguardando escolha (continuar/importar). */
	situacao: "jornada" | "concluido" | "anterior";
}



interface ParametrosJornada {
	etapaInicial?: number;
	onEtapaChange?: (etapa: number) => void;
	onContexto?: (contexto: ContextoTcc) => void;
}

export function useJornadaTcc({ etapaInicial = 0, onEtapaChange, onContexto }: ParametrosJornada) {
	const { usuario } = useContext(AuthContext) ?? {};
	const [activeStep, setActiveStep] = useState(etapaInicial);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [trabalhoConclusao, setTrabalhoConclusao] = useState<TrabalhoLocal | null>(null);
	const [ofertaAtual, setOfertaAtual] = useState<OfertaLocal | null>(null);
	const [formData, setFormData] = useState<FormDataStepper>({
		tema: "",
		titulo: "",
		resumo: "",
		seminario_andamento: "",
	});
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState<"success" | "error" | "warning">(
		"success",
	);
	const [openConviteModal, setOpenConviteModal] = useState(false);
	const [conviteExistente, setConviteExistente] = useState<ConviteLocal | null>(null);
	const [convitesBanca, setConvitesBanca] = useState<ConviteLocal[]>([]);
	const [openConviteBancaModal, setOpenConviteBancaModal] = useState(false);
	const [openConviteBancaFinalModal, setOpenConviteBancaFinalModal] =
		useState(false);
	const [tccAnterior, setTccAnterior] = useState<TrabalhoLocal | null>(null);
	const [openImportModal, setOpenImportModal] = useState(false);
	const [showCompletedMessage, setShowCompletedMessage] = useState(false);
	const [modalType, setModalType] = useState(""); // 'import', 'next_phase'
	const [selectedHorarioBancaFase1, setSelectedHorarioBancaFase1] =
		useState<HorarioSelecionado | null>(null);
	const [selectedHorarioBancaFase2, setSelectedHorarioBancaFase2] =
		useState<HorarioSelecionado | null>(null);
	const [defesasFase1, setDefesasFase1] = useState<DefesaLocal[]>([]);
	const [defesasFase2, setDefesasFase2] = useState<DefesaLocal[]>([]);
	const [bloquearAtualizacaoEtapa, setBloquearAtualizacaoEtapa] =
		useState(false);

	useEffect(() => {
		if (usuario) {
			carregarTrabalhoConclusao();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usuario]);

	useEffect(() => {
		setActiveStep(etapaInicial);
	}, [etapaInicial]);

	// Novo design: informa à página "Meu TCC" a fase, a oferta e o andamento.
	useEffect(() => {
		if (!onContexto) return;
		const fase = Number(trabalhoConclusao?.fase || ofertaAtual?.fase || 1);
		onContexto({
			fase,
			ano: trabalhoConclusao?.ano ?? ofertaAtual?.ano ?? null,
			semestre: trabalhoConclusao?.semestre ?? ofertaAtual?.semestre ?? null,
			curso: ofertaAtual?.curso?.nome ?? null,
			idTcc: trabalhoConclusao?.id ?? null,
			idCurso: trabalhoConclusao?.id_curso ?? ofertaAtual?.id_curso ?? null,
			etapaSalva: Number(trabalhoConclusao?.etapa ?? 0),
			totalEtapas: getEtapasValidas().length,
			aprovado: Boolean(fase === 2 ? trabalhoConclusao?.aprovado_tcc : trabalhoConclusao?.aprovado_projeto),
			convitePendente: Boolean(conviteExistente && conviteExistente.data_feedback === null),
			situacao: showCompletedMessage && tccAnterior ? "concluido" : !trabalhoConclusao && tccAnterior ? "anterior" : "jornada",
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [trabalhoConclusao, ofertaAtual, conviteExistente, showCompletedMessage, tccAnterior]);

	const isEtapaFinalBloqueada = (tcc: TrabalhoLocal | null) => {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeStep, trabalhoConclusao]);

	// Ao carregar diretamente na etapa final (índice igual ao total de etapas válidas), recarregar as defesas
	useEffect(() => {
		if (trabalhoConclusao) {
			const etapasValidas = getEtapasValidas();
			if (activeStep === etapasValidas.length) {
				carregarDefesas(trabalhoConclusao.id);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeStep, trabalhoConclusao]);

	const carregarTrabalhoConclusao = async () => {
		try {
			setLoading(true);

			// Buscar a última oferta TCC (usada para determinar o semestre corrente)
			const oferta = await axiosInstance.get<OfertaLocal>(
				"/ofertas-tcc/ultima",
			);

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

			setOfertaAtual(oferta);

			// Buscar o discente pelo id_usuario
			const discente = await axiosInstance.get<DiscenteLocal>(
				`/dicentes/usuario/${usuario?.id}`,
			);

			if (!discente || !discente.matricula) {
				setMessageText(
					"Usuário não possui matrícula de discente associada!",
				);
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			// Buscar o TCC mais recente do discente.
			// O backend ordena por fase DESC, então se o estudante tem fase 1 e
			// fase 2 no mesmo semestre, a fase 2 é retornada (fase mais avançada).
			let tcc: TrabalhoLocal | null = null;
			try {
				tcc = await axiosInstance.get<TrabalhoLocal>(
					`/trabalho-conclusao/discente/${discente.matricula}`,
				);
			} catch (err: unknown) {
				const status =
					(err as { response?: { status?: number } })?.response
						?.status;
				if (status !== 404) {
					throw err;
				}
			}

			if (tcc?.id) {
				const mesmoSemestre =
					tcc.ano === oferta.ano && tcc.semestre === oferta.semestre;

				if (mesmoSemestre) {
					// Se for TCC de fase 2 sem aprovação, verificar se a fase 1
					// foi aprovada em registro separado e propagar automaticamente.
					if (tcc.fase === 2 && !tcc.aprovado_projeto) {
						try {
							const params = new URLSearchParams();
							params.append("matricula", discente.matricula);
							params.append("fase", "1");
							const respF1 = await axiosInstance.get<{
								trabalhos?: TrabalhoLocal[];
							}>(`/trabalho-conclusao?${params.toString()}`);
							const tccsF1 = respF1?.trabalhos || [];
							const fase1Aprovada = tccsF1.some(
								(t) => t.aprovado_projeto === true,
							);
							if (fase1Aprovada) {
								const etapaFase2 = Math.max(
									tcc.etapa || 0,
									6,
								);
								await axiosInstance.put(
									`/trabalho-conclusao/${tcc.id}`,
									{
										...tcc,
										aprovado_projeto: true,
										etapa: etapaFase2,
									},
								);
								tcc = {
									...tcc,
									aprovado_projeto: true,
									etapa: etapaFase2,
								};
							}
						} catch {
							// Se a verificação falhar, prosseguir com o TCC como está
						}
					}

					// TCC do semestre atual — carregar normalmente
					const tccCompleto: TrabalhoLocal = {
						...tcc,
						id_curso: tcc.id_curso || oferta.id_curso,
						ano: tcc.ano,
						semestre: tcc.semestre,
						fase: tcc.fase,
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

					const etapaBanco = tccCompleto.etapa || 0;
					setActiveStep(etapaBanco);
					if (onEtapaChange) {
						onEtapaChange(etapaBanco);
					}

					await carregarConvites(tccCompleto.id);
				} else {
					// TCC de semestre anterior — aplicar regras de importação
					setTccAnterior(tcc);

					if (tcc.aprovado_tcc) {
						// TCC já concluído em semestre anterior
						setShowCompletedMessage(true);
					} else if (tcc.aprovado_projeto) {
						// Projeto aprovado — oferecer continuação na próxima fase
						setModalType("next_phase");
						setOpenImportModal(true);
					} else {
						// Projeto não aprovado — oferecer importação de dados
						setModalType("import");
						setOpenImportModal(true);
					}
				}
			} else {
				// Nenhum TCC encontrado — criar novo para a oferta atual
				await criarNovoTrabalhoConclusao(discente.matricula);
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

	const carregarConvites = async (idTcc: number) => {
		try {
			console.log("Carregando convites para TCC ID:", idTcc);
			const params = new URLSearchParams();
			params.append("id_tcc", String(idTcc));
			const response = await axiosInstance.get<{ convites?: ConviteLocal[] }>(
				`/convites?${params.toString()}`,
			);

			console.log("Resposta da API ao carregar convites:", response);

			const convites = response.convites || [];

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

	const carregarDefesas = async (idTcc: number) => {
		try {
			const resp = await axiosInstance.get<{ defesas?: DefesaLocal[] }>(
				`/defesas/tcc/${idTcc}`,
			);
			const lista = resp.defesas || [];
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
	const temDefesaAgendada = (fase: number) => {
		const defesas = fase === 1 ? defesasFase1 : defesasFase2;
		return (
			defesas && defesas.length > 0 && defesas.some((d) => d.data_defesa)
		);
	};

	const criarNovoTrabalhoConclusao = async (matricula: string) => {
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
			const tccCriado = await axiosInstance.post<TrabalhoLocal>(
				"/trabalho-conclusao",
				novoTcc,
			);

			console.log("Resposta da API ao criar TCC:", tccCriado);
			console.log("Tipo da resposta:", typeof tccCriado);
			console.log("Estrutura da resposta:", Object.keys(tccCriado ?? {}));

			console.log("TCC criado extraído:", tccCriado);
			console.log("Tipo do TCC criado:", typeof tccCriado);
			console.log(
				"Estrutura do TCC criado:",
				tccCriado ? Object.keys(tccCriado) : "null",
			);

			if (!tccCriado || !tccCriado.id) {
				console.error("Resposta inválida da API:", tccCriado);
				throw new Error(
					"Resposta da API não contém dados válidos do TCC criado",
				);
			}

			// Garantir que o id_curso esteja presente, mesmo que a API não o retorne
			const tccCompletoCriado: TrabalhoLocal = {
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

	const validarEtapaAtual = (): boolean => {
		switch (activeStep) {
			case 0:
				// Na etapa 0, só pode avançar se tiver um convite aceito
				return Boolean(conviteExistente && conviteExistente.aceito === true);
			case 1:
				return Boolean(formData.tema && formData.tema.trim().length > 0);
			case 2:
				return Boolean(formData.titulo && formData.titulo.trim().length > 0);
			case 3:
				return Boolean(formData.resumo && formData.resumo.trim().length > 0);
			case 4: {
				// Etapa 4 (convite para banca do projeto - fase 1) - precisa de 2 convites aceitos
				const convitesAceitosFase1 = convitesBanca.filter(
					(convite) => convite.aceito === true && convite.fase === 1,
				);
				return convitesAceitosFase1.length >= 2;
			}
			case 5:
				// Etapa 6 (nova): Seleção de horário da banca do projeto (fase 1) ou Resumo (fase 2)
				if (trabalhoConclusao && trabalhoConclusao.fase === 1) {
					// Se já tem defesa agendada na fase 1, pode prosseguir
					if (temDefesaAgendada(1)) {
						return true;
					}
					// Senão, precisa ter horário selecionado
					return Boolean(
						selectedHorarioBancaFase1 &&
						selectedHorarioBancaFase1.data &&
						selectedHorarioBancaFase1.hora,
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
					return Boolean(
						formData.seminario_andamento &&
						formData.seminario_andamento.trim().length > 0,
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
				return Boolean(
					selectedHorarioBancaFase2 &&
					selectedHorarioBancaFase2.data &&
					selectedHorarioBancaFase2.hora,
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

	const salvarEtapaAtual = async (): Promise<boolean> => {
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
			const dadosAtualizados: TrabalhoLocal = {
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

	/**
	 * Tema, título e resumo em uma tela (redesenho, passo 2). A etapa gravada segue o
	 * preenchimento — sem tema: 1; sem título: 2; sem resumo: 3; tudo e "Continuar": 4 —
	 * e nunca volta para trás em relação à etapa já gravada.
	 */
	const salvarTemaTituloResumo = async (avancar: boolean): Promise<boolean> => {
		if (!trabalhoConclusao || !trabalhoConclusao.id) {
			setMessageText("Erro: Trabalho de conclusão não encontrado. Recarregue a página.");
			setMessageSeverity("error");
			setOpenMessage(true);
			return false;
		}
		const preenchido = (v?: string | null) => Boolean(v && v.trim());
		const etapaPorCampos = !preenchido(formData.tema) ? 1 : !preenchido(formData.titulo) ? 2 : !preenchido(formData.resumo) ? 3 : 4;
		if (avancar && etapaPorCampos < 4) {
			setMessageText("Preencha tema, título e resumo para continuar.");
			setMessageSeverity("warning");
			setOpenMessage(true);
			return false;
		}
		const etapaAlvo = avancar ? 4 : Math.min(etapaPorCampos, 3);
		const etapaGravada = Math.max(Number(trabalhoConclusao.etapa ?? 0), etapaAlvo);
		const irPara = (etapa: number) => {
			setActiveStep(etapa);
			if (onEtapaChange) onEtapaChange(etapa);
		};
		if (bloquearAtualizacaoEtapa) {
			// Mesmo comportamento de salvarEtapaAtual: nada é persistido quando bloqueado.
			if (avancar) irPara(4);
			return true;
		}
		try {
			setSaving(true);
			const dadosAtualizados: TrabalhoLocal = { ...trabalhoConclusao, ...formData, etapa: etapaGravada };
			await axiosInstance.put(`/trabalho-conclusao/${trabalhoConclusao.id}`, dadosAtualizados);
			setTrabalhoConclusao(dadosAtualizados);
			setBloquearAtualizacaoEtapa(isEtapaFinalBloqueada(dadosAtualizados));
			setMessageText(avancar ? "Dados do projeto salvos." : "Rascunho salvo.");
			setMessageSeverity("success");
			setOpenMessage(true);
			irPara(avancar ? 4 : Math.min(etapaGravada, 3));
			return true;
		} catch (error) {
			console.error("Erro ao salvar tema, título e resumo:", error);
			setMessageText("Erro ao salvar os dados do projeto!");
			setMessageSeverity("error");
			setOpenMessage(true);
			return false;
		} finally {
			setSaving(false);
		}
	};

	/** Grava os campos de texto sem mudar a etapa (rascunho do seminário de andamento). */
	const salvarRascunho = async (): Promise<boolean> => {
		if (!trabalhoConclusao || !trabalhoConclusao.id) {
			setMessageText("Erro: Trabalho de conclusão não encontrado. Recarregue a página.");
			setMessageSeverity("error");
			setOpenMessage(true);
			return false;
		}
		if (bloquearAtualizacaoEtapa) return true; // mesmo comportamento das demais gravações
		try {
			setSaving(true);
			const dadosAtualizados: TrabalhoLocal = { ...trabalhoConclusao, ...formData, etapa: trabalhoConclusao.etapa };
			await axiosInstance.put(`/trabalho-conclusao/${trabalhoConclusao.id}`, dadosAtualizados);
			setTrabalhoConclusao(dadosAtualizados);
			setMessageText("Rascunho salvo.");
			setMessageSeverity("success");
			setOpenMessage(true);
			return true;
		} catch (error) {
			console.error("Erro ao salvar rascunho:", error);
			setMessageText("Erro ao salvar o rascunho!");
			setMessageSeverity("error");
			setOpenMessage(true);
			return false;
		} finally {
			setSaving(false);
		}
	};

	const salvarTrabalhoConclusao = async (): Promise<boolean> => {
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
			const dadosAtualizados: TrabalhoLocal = {
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

	const handleInputChange = (field: keyof FormDataStepper, value: string) => {
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

	/** Reabre a escolha (continuar/importar) depois de o diálogo ter sido fechado. */
	const reabrirImportacao = () => setOpenImportModal(true);

	const handleImportData = async (opcaoSelecionada: boolean) => {
		setOpenImportModal(false);

		if (!tccAnterior || !ofertaAtual) return;

		try {
			setLoading(true);
			const discente = await axiosInstance.get<DiscenteLocal>(
				`/dicentes/usuario/${usuario?.id}`,
			);

			console.log(
				"Resposta da API do discente na importação:",
				discente,
			);

			if (!discente || !discente.matricula) {
				throw new Error(
					"Resposta da API do discente não contém dados válidos",
				);
			}

			console.log("Discente extraído na importação:", discente);

			if (modalType === "next_phase") {
				// 1.1 Projeto aprovado - pergunta sobre próxima fase
			if (opcaoSelecionada) {
				// Sim: manter o mesmo TCC, avançando para fase 2 / etapa 6 (seminário)
				const dadosAtualizados = {
					...tccAnterior,
					ano: ofertaAtual.ano,
					semestre: ofertaAtual.semestre,
					id_curso: ofertaAtual.id_curso,
					fase: 2,
					etapa: 6,
					aprovado_projeto: true,
				};

				const response = await axiosInstance.put<{
					trabalho?: TrabalhoLocal;
				}>(
					`/trabalho-conclusao/${tccAnterior.id}`,
					dadosAtualizados,
				);

				const tccAtualizado: TrabalhoLocal =
					response?.trabalho || (response as unknown as TrabalhoLocal) || dadosAtualizados;
				// Garantir que o id_curso esteja presente, mesmo que a API não o retorne
				const tccAtualizadoCompleto: TrabalhoLocal = {
					...tccAtualizado,
					id_curso:
						tccAtualizado.id_curso || ofertaAtual.id_curso,
					ano: tccAtualizado.ano || ofertaAtual.ano,
					semestre:
						tccAtualizado.semestre || ofertaAtual.semestre,
					fase: tccAtualizado.fase || 2,
					etapa: tccAtualizado.etapa ?? 6,
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

				const etapaContinuacao = 6;
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
						const novoTccCompleto: TrabalhoLocal = {
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
					// Sim: manter o mesmo TCC (mesmo id), apenas atualizando o
					// período para o semestre atual — mesmo padrão usado ao
					// avançar de fase (evita duplicar o registro do dicente).
					const dadosAtualizados = {
						...tccAnterior,
						ano: ofertaAtual.ano,
						semestre: ofertaAtual.semestre,
						id_curso: ofertaAtual.id_curso,
						fase: ofertaAtual.fase,
						etapa: 0, // Sempre começar na etapa 0
					};

					const response = await axiosInstance.put<{
						trabalho?: TrabalhoLocal;
					}>(`/trabalho-conclusao/${tccAnterior.id}`, dadosAtualizados);

					const tccImportado: TrabalhoLocal =
						response?.trabalho || (response as unknown as TrabalhoLocal) || dadosAtualizados;

					console.log("Resposta da API ao importar TCC:", tccImportado);

					if (!tccImportado || !tccImportado.id) {
						console.error("Resposta inválida da API:", tccImportado);
						throw new Error(
							"Resposta da API não contém dados válidos do TCC importado",
						);
					}

					// Garantir que o id_curso esteja presente, mesmo que a API não o retorne
					const tccCompletoImportado: TrabalhoLocal = {
						...tccImportado,
						id_curso: tccImportado.id_curso || ofertaAtual.id_curso,
						ano: tccImportado.ano || ofertaAtual.ano,
						semestre: tccImportado.semestre || ofertaAtual.semestre,
						fase: tccImportado.fase || ofertaAtual.fase,
						etapa: tccImportado.etapa ?? 0,
					};

					setTrabalhoConclusao(tccCompletoImportado);
					setBloquearAtualizacaoEtapa(
						isEtapaFinalBloqueada(tccCompletoImportado),
					);
					setFormData({
						tema: tccCompletoImportado.tema || "",
						titulo: tccCompletoImportado.titulo || "",
						resumo: tccCompletoImportado.resumo || "",
						seminario_andamento: "",
					});
					setActiveStep(0);
					if (onEtapaChange) {
						onEtapaChange(0);
					}

					await carregarConvites(tccCompletoImportado.id);

					setMessageText(
						`TCC atualizado para ${ofertaAtual.ano}/${ofertaAtual.semestre}!`,
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
						const novoTccCompleto: TrabalhoLocal = {
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

	const handleCloseMessage = (_event: unknown, reason?: string) => {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	};


	return {
		salvarTemaTituloResumo,
		salvarRascunho,
		reabrirImportacao,
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
	};
}
