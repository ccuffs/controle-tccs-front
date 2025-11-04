import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import avaliarDefesasService from "../services/avaliar-defesas-service";
import avaliarDefesasController from "../controllers/avaliar-defesas-controller";

export function useAvaliarDefesasOrientador() {
	const { usuario } = useAuth();

	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(
		avaliarDefesasController.getAnoSemestreAtual().ano,
	);
	const [semestre, setSemestre] = useState(
		avaliarDefesasController.getAnoSemestreAtual().semestre,
	);
	const [fase, setFase] = useState("");

	const [orientacoes, setOrientacoes] = useState([]);
	const [defesas, setDefesas] = useState([]);

	const [loading, setLoading] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");

	// estado local para edições: avaliacao por par (id_tcc, membro_banca)
	const [avaliacoesEdicao, setAvaliacoesEdicao] = useState({});
	// controle de edição por TCC e backup para cancelar
	const [editandoTcc, setEditandoTcc] = useState({});
	const [backupAvaliacoes, setBackupAvaliacoes] = useState({});
	// estado para comentários de TCC (apenas fase 2)
	const [comentariosTcc, setComentariosTcc] = useState({});
	const [backupComentarios, setBackupComentarios] = useState({});
	// estado para controle de aprovação de TCCs (fase 2)
	const [aprovandoTcc, setAprovandoTcc] = useState({});
	// aprovação local imediata pós-sucesso (para refletir checkbox/botão)
	const [tccAprovadoLocal, setTccAprovadoLocal] = useState({});
	// estado para edição do checkbox de aprovação TCC
	const [edicaoAprovadoTcc, setEdicaoAprovadoTcc] = useState({});

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
			const codigoDocente = usuario.codigo || usuario.id;
			const cursosOrientador = await avaliarDefesasService.getCursosOrientador(
				codigoDocente,
			);
			const cursosExtraidos = cursosOrientador.map(
				(orientacao) => orientacao.curso,
			);
			setCursos(cursosExtraidos);
			if (cursosExtraidos.length === 1) {
				setCursoSelecionado(cursosExtraidos[0].id);
			}
		} catch (error) {
			setCursos([]);
			setMessageText(
				error.message || "Erro ao carregar cursos do orientador.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	async function carregarDados() {
		setLoading(true);
		try {
			const codigoDocente = usuario.codigo || usuario.id;

			// Buscar orientações (TCCs) do orientador
			const paramsOrientacoes = {
				codigo_docente: codigoDocente,
				orientador: true,
			};
			const orientacoesResp = await avaliarDefesasService.getOrientacoes(
				paramsOrientacoes,
			);

			// Processar orientações
			const orientacoesFiltradas = avaliarDefesasController.filtrarOrientacoes(
				orientacoesResp,
				cursoSelecionado,
				ano,
				semestre,
			);
			setOrientacoes(orientacoesFiltradas);

			// Buscar defesas para o período
			const respDefesas = await avaliarDefesasService.getDefesas({
				ano,
				semestre,
				fase,
			});

			// Processar defesas
			const idsTcc = new Set(orientacoesFiltradas.map((t) => t.id));
			const defesasFiltradas = avaliarDefesasController.filtrarDefesas(
				respDefesas,
				idsTcc,
				fase,
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

	function handleAvaliacaoChange(idTcc, membro, fase, valor) {
		setAvaliacoesEdicao((prev) => ({
			...prev,
			[`${idTcc}|${membro}|${fase}`]: valor,
		}));
	}

	function handleComentarioChange(idTcc, valor) {
		setComentariosTcc((prev) => ({
			...prev,
			[idTcc]: valor,
		}));
	}

	function handleAprovadoTccChange(idTcc, aprovado) {
		setEdicaoAprovadoTcc((prev) => ({
			...prev,
			[idTcc]: aprovado,
		}));
	}

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") return;
		setOpenMessage(false);
	}

	function iniciarEdicao(chaveUnica) {
		const idTcc = avaliarDefesasController.extrairIdTcc(chaveUnica);
		const faseCard = avaliarDefesasController.extrairFase(chaveUnica);
		const prefix = `${idTcc}|`;

		// Criar snapshot de avaliações
		const snapshot = avaliarDefesasController.criarSnapshotAvaliacoes(
			avaliacoesEdicao,
			prefix,
			fase,
			faseCard,
		);
		setBackupAvaliacoes((prev) => ({ ...prev, [chaveUnica]: snapshot }));

		// Backup do comentário de TCC se for fase 2
		const tcc = mapaTcc.get(parseInt(idTcc));
		if (tcc && tcc.fase === 2) {
			setBackupComentarios((prev) => ({
				...prev,
				[chaveUnica]: comentariosTcc[idTcc] || "",
			}));

			// Backup do estado de aprovação TCC
			const aprovadoAtual = tccAprovadoLocal[idTcc] ?? tcc.aprovado_tcc;
			setEdicaoAprovadoTcc((prev) => ({
				...prev,
				[idTcc]: aprovadoAtual,
			}));
		}

		setEditandoTcc((prev) => ({ ...prev, [chaveUnica]: true }));
	}

	function cancelarEdicao(chaveUnica) {
		const snapshot = backupAvaliacoes[chaveUnica] || {};
		const idTcc = avaliarDefesasController.extrairIdTcc(chaveUnica);
		const faseCard = avaliarDefesasController.extrairFase(chaveUnica);
		const prefix = `${idTcc}|`;

		// Verifica se há notas registradas para este TCC
		const temNotas =
			avaliarDefesasController.temNotasRegistradas(
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
				[idTcc]: comentarioBackup,
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
		let resultado = [];

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
	async function salvarAvaliacoesDoTcc(chaveUnicaAlvo) {
		try {
			const promises = [];
			let total = 0;
			const idTccAlvo = avaliarDefesasController.extrairIdTcc(chaveUnicaAlvo);
			const faseAlvo = avaliarDefesasController.extrairFase(chaveUnicaAlvo);

			Object.entries(avaliacoesEdicao).forEach(([chave, valor]) => {
				const [idTcc, membro, faseKey] = chave.split("|");
				if (String(idTcc) !== String(idTccAlvo)) return;

				// Se for modo "Todas" as fases, filtra apenas pela fase específica do card
				if (faseAlvo && String(faseKey) !== String(faseAlvo)) return;

				const numero = valor === "" ? null : Number(valor);
				if (numero !== null && !Number.isNaN(numero) && numero >= 0) {
					total += 1;
					promises.push(
						avaliarDefesasService.salvarAvaliacaoDefesa(idTcc, membro, {
							avaliacao: numero,
							fase: faseKey,
						}),
					);
				}
			});

			// Salvar comentário e aprovação de TCC se for fase 2
			const tcc = mapaTcc.get(parseInt(idTccAlvo));
			if (tcc && tcc.fase === 2) {
				const comentario = comentariosTcc[idTccAlvo] || "";
				const aprovadoTcc = edicaoAprovadoTcc[idTccAlvo];

				const dadosAtualizacao = {
					comentarios_tcc: comentario,
				};

				// Incluir aprovação TCC se foi alterada
				if (aprovadoTcc !== undefined) {
					dadosAtualizacao.aprovado_tcc = aprovadoTcc;
				}

				promises.push(
					avaliarDefesasService.atualizarTrabalhoConclusao(
						idTccAlvo,
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
						[idTccAlvo]: edicaoAprovadoTcc[idTccAlvo],
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

	// Função para aprovar TCC (fase 2)
	async function aprovarTcc(idTcc) {
		try {
			setAprovandoTcc((prev) => ({ ...prev, [idTcc]: true }));

			await avaliarDefesasService.atualizarTrabalhoConclusao(idTcc, {
				aprovado_tcc: true,
			});

			// Atualização imediata do UI: marcar aprovado localmente para refletir no checkbox e esconder botão
			setOrientacoes((prev) =>
				prev.map((t) =>
					t.id === parseInt(idTcc) ? { ...t, aprovado_tcc: true } : t,
				),
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
	};
}

