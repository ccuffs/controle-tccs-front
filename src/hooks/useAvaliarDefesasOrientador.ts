import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import avaliarDefesasService, { gerarAtaDefesaHtml } from "../services/avaliar-defesas-service";
import avaliarDefesasController from "../controllers/avaliar-defesas-controller";

export function useAvaliarDefesasOrientador() {
	const { usuario } = useAuth();

	const [cursos, setCursos] = useState<unknown[]>([]);
	const [cursoSelecionado, setCursoSelecionado] = useState<string | number>("");
	const [ano, setAno] = useState<string | number>(
		avaliarDefesasController.getAnoSemestreAtual().ano,
	);
	const [semestre, setSemestre] = useState<string | number>(
		avaliarDefesasController.getAnoSemestreAtual().semestre,
	);
	const [fase, setFase] = useState<string | number>("");

	const [orientacoes, setOrientacoes] = useState<
		ReturnType<typeof avaliarDefesasController.filtrarOrientacoes>
	>([]);
	const [defesas, setDefesas] = useState<
		ReturnType<typeof avaliarDefesasController.filtrarDefesas>
	>([]);

	const [loading, setLoading] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState<"success" | "error" | "warning">(
		"success",
	);

	// estado local para edições: avaliacao por par (id_tcc, membro_banca)
	const [avaliacoesEdicao, setAvaliacoesEdicao] = useState<Record<string, string>>({});
	// controle de edição por TCC e backup para cancelar
	const [editandoTcc, setEditandoTcc] = useState<Record<string, boolean>>({});
	const [backupAvaliacoes, setBackupAvaliacoes] = useState<
		Record<string, Record<string, string>>
	>({});
	// estado para comentários de TCC (apenas fase 2)
	const [comentariosTcc, setComentariosTcc] = useState<Record<number, string>>({});
	const [backupComentarios, setBackupComentarios] = useState<Record<string, string>>({});
	// estado para controle de aprovação de TCCs (fase 2)
	const [aprovandoTcc, setAprovandoTcc] = useState<Record<string, boolean>>({});
	// aprovação local imediata pós-sucesso (para refletir checkbox/botão)
	const [tccAprovadoLocal, setTccAprovadoLocal] = useState<Record<string, boolean>>({});
	// estado para edição do checkbox de aprovação TCC
	const [edicaoAprovadoTcc, setEdicaoAprovadoTcc] = useState<Record<string, boolean>>({});

	// Carregar cursos do orientador ao montar o componente
	useEffect(() => {
		getCursosOrientador();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Carregar dados quando filtros mudarem
	useEffect(() => {
		if (cursoSelecionado) {
			carregarDados();
		} else {
			setOrientacoes([]);
			setDefesas([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cursoSelecionado, ano, semestre, fase]);

	async function getCursosOrientador() {
		try {
			const codigoDocente = usuario?.id;
			if (!codigoDocente) return;
			const cursosOrientador =
				await avaliarDefesasService.getCursosOrientador(codigoDocente);
			const cursosExtraidos = cursosOrientador.map(
				(orientacao) => orientacao.curso,
			);
			setCursos(cursosExtraidos);
			if (cursosExtraidos.length === 1) {
				setCursoSelecionado(cursosExtraidos[0]?.id ?? "");
			}
		} catch (error) {
			setCursos([]);
			setMessageText(
				error instanceof Error
					? error.message
					: "Erro ao carregar cursos do orientador.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	async function carregarDados() {
		setLoading(true);
		try {
			const codigoDocente = usuario?.id;
			if (!codigoDocente) return;

			// Buscar orientações (TCCs) do orientador
			const paramsOrientacoes = {
				codigo_docente: codigoDocente,
				orientador: true,
			};
			const [orientacoesResp, respDefesas, datasDefesa, periodosLetivos] =
				await Promise.all([
					avaliarDefesasService.getOrientacoes(paramsOrientacoes),
					avaliarDefesasService.getDefesas(),
					avaliarDefesasService
						.getDatasDefesa(
							cursoSelecionado
								? { id_curso: cursoSelecionado }
								: undefined,
						)
						.catch(() => []),
					avaliarDefesasService.getAnoSemestres().catch(() => []),
				]);

			// Orientações do curso (sem filtrar pelo período atual do TCC:
			// a defesa pode pertencer a um semestre anterior ao do trabalho).
			const orientacoesFiltradas =
				avaliarDefesasController.filtrarOrientacoes(
					orientacoesResp,
					cursoSelecionado,
				);
			setOrientacoes(orientacoesFiltradas);

			const janelasPeriodo = [...datasDefesa, ...periodosLetivos];

			const idsTcc = new Set(orientacoesFiltradas.map((t) => t.id));
			const mapaTccsCurso =
				avaliarDefesasController.criarMapaTcc(orientacoesFiltradas);
			const defesasFiltradas = avaliarDefesasController.filtrarDefesas(
				respDefesas,
				idsTcc,
				fase,
				ano,
				semestre,
				mapaTccsCurso,
				janelasPeriodo,
			);
			setDefesas(defesasFiltradas);

			// Inicializar estados de edição conforme dados atuais
			const novoAvals =
				avaliarDefesasController.inicializarAvaliacoesEdicao(
					defesasFiltradas,
				);
			setAvaliacoesEdicao(novoAvals);

			// Inicializar comentários de TCC (apenas fase 2)
			const novoComentarios =
				avaliarDefesasController.inicializarComentariosTcc(
					orientacoesFiltradas,
				);
			setComentariosTcc(novoComentarios);
		} catch (error) {
			setMessageText("Erro ao carregar dados de defesas/orientações.");
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	}

	const mapaTcc = useMemo(() => {
		return avaliarDefesasController.criarMapaTcc(orientacoes);
	}, [orientacoes]);

	function handleAvaliacaoChange(
		idTcc: number,
		membro: string,
		fase: number | string | undefined,
		valor: string,
	) {
		setAvaliacoesEdicao((prev) => ({
			...prev,
			[`${idTcc}|${membro}|${fase}`]: valor,
		}));
	}

	function handleComentarioChange(idTcc: number, valor: string) {
		setComentariosTcc((prev) => ({
			...prev,
			[idTcc]: valor,
		}));
	}

	function handleAprovadoTccChange(idTcc: number, aprovado: boolean) {
		setEdicaoAprovadoTcc((prev) => ({
			...prev,
			[idTcc]: aprovado,
		}));
	}

	function handleCloseMessage(_event: unknown, reason?: string) {
		if (reason === "clickaway") return;
		setOpenMessage(false);
	}

	function iniciarEdicao(chaveUnica: string) {
		const idTcc = avaliarDefesasController.extrairIdTcc(chaveUnica);
		const faseCard = avaliarDefesasController.extrairFase(chaveUnica) ?? undefined;
		const prefix = `${idTcc}|`;

		// Criar snapshot de avaliações
		const snapshot = avaliarDefesasController.criarSnapshotAvaliacoes(
			avaliacoesEdicao,
			prefix,
			fase,
			faseCard,
		);
		setBackupAvaliacoes((prev) => ({ ...prev, [chaveUnica]: snapshot }));

		// Backup do parecer para qualquer fase
		const tcc = mapaTcc.get(parseInt(idTcc));
		if (tcc) {
			setBackupComentarios((prev) => ({
				...prev,
				[chaveUnica]: comentariosTcc[Number(idTcc)] || "",
			}));

			// Backup do estado de aprovação TCC apenas para fase 2
			if (tcc.fase === 2) {
				const aprovadoAtual = tccAprovadoLocal[idTcc] ?? tcc.aprovado_tcc;
				setEdicaoAprovadoTcc((prev) => ({
					...prev,
					[idTcc]: Boolean(aprovadoAtual),
				}));
			}
		}

		setEditandoTcc((prev) => ({ ...prev, [chaveUnica]: true }));
	}

	function cancelarEdicao(chaveUnica: string) {
		const snapshot = backupAvaliacoes[chaveUnica] || {};
		const idTcc = avaliarDefesasController.extrairIdTcc(chaveUnica);
		const faseCard = avaliarDefesasController.extrairFase(chaveUnica) ?? undefined;
		const prefix = `${idTcc}|`;

		// Verifica se há notas registradas para este TCC
		const temNotas = avaliarDefesasController.temNotasRegistradas(
			avaliacoesEdicao,
			prefix,
			fase,
			faseCard,
		);

		if (temNotas && Object.keys(snapshot).length > 0) {
			// Se há notas registradas e backup, restaura os valores
			const novo = avaliarDefesasController.restaurarAvaliacoes(
				avaliacoesEdicao,
				snapshot,
				prefix,
				fase,
				faseCard,
			);
			setAvaliacoesEdicao(novo);
		} else {
			// Se não há notas registradas, apenas limpa os campos
			const novo = avaliarDefesasController.limparAvaliacoes(
				avaliacoesEdicao,
				prefix,
				fase,
				faseCard,
			);
			setAvaliacoesEdicao(novo);
		}

		setBackupAvaliacoes((prev) => {
			const novo = { ...prev };
			delete novo[chaveUnica];
			return novo;
		});

		// Restaurar comentário de TCC se existir backup
		const comentarioBackup = backupComentarios[chaveUnica];
		if (comentarioBackup !== undefined) {
			setComentariosTcc((prev) => ({
				...prev,
				[Number(idTcc)]: comentarioBackup,
			}));
		}

		setBackupComentarios((prev) => {
			const novo = { ...prev };
			delete novo[chaveUnica];
			return novo;
		});

		// Limpar estado de edição de aprovação TCC
		setEdicaoAprovadoTcc((prev) => {
			const novo = { ...prev };
			delete novo[idTcc];
			return novo;
		});

		setEditandoTcc((prev) => ({ ...prev, [chaveUnica]: false }));
	}

	// Dados para Cards: quando fase está vazia (Todas), um card por defesa/fase
	// caso contrário, um card por TCC com inputs para todos os membros da banca
	const cardsPorTcc = useMemo(() => {
		let resultado;

		if (fase === "" || fase === null || fase === undefined) {
			// Quando "Todas" as fases estão selecionadas
			resultado = avaliarDefesasController.gerarCardsTodasFases(
				defesas,
				mapaTcc,
				avaliacoesEdicao,
			);
		} else {
			// Lógica original: agrupar por TCC quando uma fase específica está selecionada
			resultado = avaliarDefesasController.gerarCardsFaseEspecifica(
				defesas,
				mapaTcc,
				avaliacoesEdicao,
				fase,
			);
		}

		return avaliarDefesasController.ordenarCards(resultado);
	}, [defesas, mapaTcc, avaliacoesEdicao, fase]);

	// Salvar avaliações apenas do card informado (TCC ou TCC+Fase específica)
	async function salvarAvaliacoesDoTcc(chaveUnicaAlvo: string) {
		try {
			const promises: Promise<unknown>[] = [];
			let total = 0;
			const idTccAlvo =
				avaliarDefesasController.extrairIdTcc(chaveUnicaAlvo);
			const faseAlvo =
				avaliarDefesasController.extrairFase(chaveUnicaAlvo);

			Object.entries(avaliacoesEdicao).forEach(([chave, valor]) => {
				const [idTcc, membro, faseKey] = chave.split("|");
				if (String(idTcc) !== String(idTccAlvo)) return;

				// Se for modo "Todas" as fases, filtra apenas pela fase específica do card
				if (faseAlvo && String(faseKey) !== String(faseAlvo)) return;

				const numero = valor === "" ? null : Number(valor);
				if (numero !== null && !Number.isNaN(numero) && numero >= 0) {
					total += 1;
					promises.push(
						avaliarDefesasService.salvarAvaliacaoDefesa(
							Number(idTcc),
							membro ?? "",
							{
								avaliacao: numero,
								fase: parseInt(faseKey ?? "", 10),
							},
						),
					);
				}
			});

			// Salvar parecer para qualquer fase; aprovado_tcc apenas para fase 2
			const tcc = mapaTcc.get(parseInt(idTccAlvo));
			if (tcc) {
				const comentario = comentariosTcc[Number(idTccAlvo)] || "";
				const dadosAtualizacao: {
					comentarios_tcc: string;
					aprovado_tcc?: boolean;
				} = { comentarios_tcc: comentario };

				if (tcc.fase === 2) {
					const aprovadoTcc = edicaoAprovadoTcc[idTccAlvo];
					if (aprovadoTcc !== undefined) {
						dadosAtualizacao.aprovado_tcc = aprovadoTcc;
					}
				}

				promises.push(
					avaliarDefesasService.atualizarTrabalhoConclusao(
						Number(idTccAlvo),
						dadosAtualizacao,
					),
				);
			}

			if (promises.length > 0) {
				await Promise.all(promises);
				const descricaoCard = faseAlvo
					? `TCC ${idTccAlvo} (Fase ${faseAlvo})`
					: `TCC ${idTccAlvo}`;
				setMessageText(
					`Avaliações do ${descricaoCard} salvas com sucesso. Total: ${total}`,
				);
				setMessageSeverity("success");
				setOpenMessage(true);
				await carregarDados();
				setEditandoTcc((prev) => ({
					...prev,
					[chaveUnicaAlvo]: false,
				}));
				setBackupAvaliacoes((prev) => {
					const novo = { ...prev };
					delete novo[chaveUnicaAlvo];
					return novo;
				});
				setBackupComentarios((prev) => {
					const novo = { ...prev };
					delete novo[chaveUnicaAlvo];
					return novo;
				});

				// Limpar estado de edição de aprovação TCC
				setEdicaoAprovadoTcc((prev) => {
					const novo = { ...prev };
					delete novo[idTccAlvo];
					return novo;
				});

				// Atualizar estado local de aprovação se foi alterado
				if (edicaoAprovadoTcc[idTccAlvo] !== undefined) {
					setTccAprovadoLocal((prev) => ({
						...prev,
						[idTccAlvo]: edicaoAprovadoTcc[idTccAlvo] as boolean,
					}));
				}
			} else {
				setMessageText("Nenhuma avaliação válida para este card.");
				setMessageSeverity("warning");
				setOpenMessage(true);
			}
		} catch (error) {
			console.error("Erro ao salvar avaliações:", error);
			setMessageText("Erro ao salvar avaliações.");
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	// Função para gerar e abrir a ata de defesa
	async function handleGerarAta(idTcc: number, faseTcc: number, local = "") {
		try {
			const novaAba = window.open("", "_blank");

			if (!novaAba) {
				setMessageText("Por favor, permita pop-ups para visualizar a ata.");
				setMessageSeverity("warning");
				setOpenMessage(true);
				return;
			}

			const htmlAta = await gerarAtaDefesaHtml(idTcc, faseTcc, local);

			novaAba.document.write(htmlAta);
			novaAba.document.close();
		} catch (error) {
			console.error("Erro ao gerar ata:", error);
			setMessageText(
				error instanceof Error ? error.message : "Erro ao gerar ata de defesa.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	// Função para aprovar TCC (fase 2)
	async function aprovarTcc(idTcc: number) {
		try {
			setAprovandoTcc((prev) => ({ ...prev, [idTcc]: true }));

			await avaliarDefesasService.atualizarTrabalhoConclusao(idTcc, {
				aprovado_tcc: true,
			});

			// Atualização imediata do UI: marcar aprovado localmente para refletir no checkbox e esconder botão
			setOrientacoes((prev) =>
				prev.map((t) => (t.id === idTcc ? { ...t, aprovado_tcc: true } : t)),
			);
			setTccAprovadoLocal((prev) => ({ ...prev, [idTcc]: true }));

			setMessageText("TCC aprovado com sucesso!");
			setMessageSeverity("success");
			setOpenMessage(true);

			// Recarregar dados para atualizar o status
			await carregarDados();
		} catch (error) {
			console.error("Erro ao aprovar TCC:", error);
			setMessageText("Erro ao aprovar TCC.");
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setAprovandoTcc((prev) => ({ ...prev, [idTcc]: false }));
		}
	}

	return {
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
		orientacoes,
		defesas,
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
		handleGerarAta,
	};
}
