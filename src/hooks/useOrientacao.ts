import { useState, useEffect, type ChangeEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import permissoesService from "../services/permissoesService";
import { Permissoes } from "../enums/permissoes";
import orientacaoService from "../services/orientacao-service";
import type { UploadPdfResponse } from "../services/orientacao-service";
import orientacaoController from "../controllers/orientacao-controller";
import { getMembrosExternosTcc } from "../services/membros-externos-service";
import type { Curso, OrientadorCurso } from "../types/curso";
import type { Dicente } from "../types/dicente";
import type { Docente } from "../types/docente";
import type { Orientacao, TrabalhoConclusao } from "../types/trabalho-conclusao";
import type { AreaTcc, OfertaTcc } from "../types/tema-tcc";
import type { Defesa } from "../types/defesa";
import type { Convite } from "../types/convite";

export function useOrientacao(isOrientadorView = false) {
	const { permissoesUsuario, gruposUsuario, usuario } = useAuth();

	// Verificações de permissão
	const isProfessor = permissoesService.verificarPermissaoPorGrupos(
		gruposUsuario,
		[Permissoes.GRUPOS.PROFESSOR_CCR],
	);

	const isAdmin = permissoesService.verificarPermissaoPorGrupos(
		gruposUsuario,
		[Permissoes.GRUPOS.ADMIN],
	);

	const [dicentes, setDicentes] = useState<Dicente[]>([]);
	const [cursos, setCursos] = useState<(Curso | unknown)[]>([]);
	const [orientadoresCurso, setOrientadoresCurso] = useState<OrientadorCurso[]>(
		[],
	);
	const [ofertasTcc, setOfertasTcc] = useState<OfertaTcc[]>([]);
	const [orientacoes, setOrientacoes] = useState<Orientacao[]>([]);
	const [cursoSelecionado, setCursoSelecionado] = useState<string | number>(
		"",
	);
	const [ano, setAno] = useState<string | number>(
		isOrientadorView
			? orientacaoController.getAnoSemestreAtual().ano
			: new Date().getFullYear(),
	);
	const [semestre, setSemestre] = useState<string | number>(
		isOrientadorView
			? orientacaoController.getAnoSemestreAtual().semestre
			: "",
	);
	const [fase, setFase] = useState<string | number>("");
	const [loadingCursos, setLoadingCursos] = useState(false);
	const [loadingOfertasTcc, setLoadingOfertasTcc] = useState(false);
	const [loadingDicentes, setLoadingDicentes] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState<"success" | "error">(
		"success",
	);
	const [trabalhosPorMatricula, setTrabalhosPorMatricula] = useState<
		Record<string, TrabalhoConclusao>
	>({});
	const [trabalhosLista, setTrabalhosLista] = useState<TrabalhoConclusao[]>(
		[],
	);
	const [loadingTrabalhos, setLoadingTrabalhos] = useState(false);
	const [convitesPorTcc, setConvitesPorTcc] = useState<Record<number, Convite[]>>(
		{},
	);

	// Estados para upload de PDF
	const [openUploadModal, setOpenUploadModal] = useState(false);
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadResults, setUploadResults] = useState<UploadPdfResponse | null>(
		null,
	);
	const [modalAno, setModalAno] = useState<string | number>("");
	const [modalSemestre, setModalSemestre] = useState<string | number>("");
	const [modalFase, setModalFase] = useState<string | number>("");
	const [modalCurso, setModalCurso] = useState<Curso | null>(null);

	// Estados para modal de edição
	const [openEditModal, setOpenEditModal] = useState(false);
	const [selectedDicente, setSelectedDicente] = useState<Dicente | null>(null);
	const [selectedTccId, setSelectedTccId] = useState<number | null>(null);
	const [editData, setEditData] = useState({
		orientador: "",
		tema: "",
		titulo: "",
		resumo: "",
		seminarioAndamento: "",
		etapa: 0,
		membroBanca1: "",
		membroBanca2: "",
		dataHoraDefesa: null as Date | null,
	});
	const [mostrarSeletorHorario, setMostrarSeletorHorario] = useState(false);
	const [loadingEdit, setLoadingEdit] = useState(false);
	const [areasTcc, setAreasTcc] = useState<AreaTcc[]>([]);
	const [loadingAreas, setLoadingAreas] = useState(false);
	const [defesasAtual, setDefesasAtual] = useState<Defesa[]>([]);
	const [convitesBancaAtual, setConvitesBancaAtual] = useState<Convite[]>([]);
	const [convitesBancaFase1, setConvitesBancaFase1] = useState<Convite[]>([]);
	const [convitesBancaFase2, setConvitesBancaFase2] = useState<Convite[]>([]);
	const [selectedHorarioBanca, setSelectedHorarioBanca] = useState<{
		data: string;
		hora: string;
	} | null>(null);
	const [docentesBanca, setDocentesBanca] = useState<{ docente: Docente }[]>([]);
	const [docentesExternosAtual, setDocentesExternosAtual] = useState<
		{
			docente: {
				codigo?: string;
				nome?: string | null;
				email?: string;
				siape?: number | null;
				externo: boolean;
				instituicao?: string | null;
			};
		}[]
	>([]);

	// Carregar dados iniciais
	useEffect(() => {
		getCursos();
		getOfertasTcc();
		getAreasTcc();

		if (!isAdmin && !isProfessor) {
			getDicentes();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAdmin, isProfessor]);

	// Carregar dicentes baseado em filtros
	// Semestre e fase com "" significam "Todos/Todas" — são seleções válidas
	useEffect(() => {
		if (isOrientadorView) {
			if (cursoSelecionado && ano) {
				getDicentes();
			} else {
				setDicentes([]);
			}
		} else {
			if (isProfessor) {
				if (cursoSelecionado) {
					getDicentes();
				}
			} else if (isAdmin) {
				if (cursoSelecionado) {
					getDicentes();
				} else {
					setDicentes([]);
				}
			} else {
				getDicentes();
			}
		}

		if (cursoSelecionado && ano) {
			getTrabalhosComDetalhes();
		} else {
			setTrabalhosPorMatricula({});
			setTrabalhosLista([]);
			setConvitesPorTcc({});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		cursoSelecionado,
		ano,
		semestre,
		fase,
		isProfessor,
		isAdmin,
		isOrientadorView,
	]);

	// Carregar orientadores e docentes de banca quando curso muda
	useEffect(() => {
		if (cursoSelecionado) {
			getOrientadoresCurso(cursoSelecionado);
			getDocentesBancaCurso(cursoSelecionado);
		} else {
			setOrientadoresCurso([]);
			setDocentesBanca([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cursoSelecionado]);

	// Limpar alterações quando filtros mudam
	useEffect(() => {
		// (mantido apenas para paridade com o efeito original)
	}, [cursoSelecionado, ano, semestre, fase]);

	async function getCursos() {
		setLoadingCursos(true);
		try {
			if (isOrientadorView || isProfessor) {
				const codigoDocente = usuario?.id;
				if (!codigoDocente) {
					setCursos([]);
					return;
				}

				const cursosOrientador =
					await orientacaoService.getCursosOrientador(codigoDocente);
				const cursosUnicos =
					orientacaoController.extrairCursosUnicos(cursosOrientador);
				setCursos(cursosUnicos);

				if (cursosUnicos.length === 1) {
					const primeiro = cursosUnicos[0] as { id?: number } | undefined;
					setCursoSelecionado(primeiro?.id ?? "");
				}
			} else {
				const cursosList = await orientacaoService.getCursos();
				setCursos(cursosList);
			}
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		} finally {
			setLoadingCursos(false);
		}
	}

	async function getOrientadoresCurso(idCurso: number | string) {
		try {
			const orientadores =
				await orientacaoService.getOrientadoresCurso(Number(idCurso));
			setOrientadoresCurso(orientadores);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de orientadores do curso: ",
				error,
			);
			setOrientadoresCurso([]);
		}
	}

	async function getDocentesBancaCurso(idCurso: number | string) {
		try {
			const docentes =
				await orientacaoService.getDocentesBancaCurso(Number(idCurso));
			setDocentesBanca(docentes);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de docentes de banca do curso: ",
				error,
			);
			setDocentesBanca([]);
		}
	}

	async function getOfertasTcc() {
		setLoadingOfertasTcc(true);
		try {
			const ofertas = await orientacaoService.getOfertasTcc();
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
			if (isOrientadorView) {
				const codigoDocente = usuario?.id;
				if (!codigoDocente) {
					setDicentes([]);
					return;
				}

				const params = {
					codigo_docente: codigoDocente,
					orientador: true,
				};
				const orientacoesData =
					await orientacaoService.getOrientacoes(params);

				// Filtra apenas por curso e ano: a granularidade fina de
				// semestre/fase é resolvida depois, ao montar as linhas com
				// base nos TCCs e suas defesas (necessário para que um TCC
				// que já avançou para a fase 2 continue aparecendo no
				// semestre da fase 1 quando esse for o filtro selecionado).
				const orientacoesFiltradas =
					orientacaoController.filtrarOrientacoes(orientacoesData, {
						cursoSelecionado,
						ano,
					});

				const dicentesData =
					orientacaoController.extrairDicentesDasOrientacoes(
						orientacoesFiltradas,
					);
				const dicentesOrdenados =
					orientacaoController.ordenarDicentesPorNome(
						dicentesData as Dicente[],
					);

				setDicentes(dicentesOrdenados);
		} else {
			const params: Record<string, string | number> = {};
			if (orientacaoController.filtroEstaAtivo(ano)) params.ano = ano;
			if (orientacaoController.filtroEstaAtivo(cursoSelecionado)) {
				params.id_curso = cursoSelecionado;
			}

			const dicentesData =
				await orientacaoService.getDicentes(params);
			const dicentesOrdenados =
				orientacaoController.ordenarDicentesPorNome(dicentesData);
			// Deduplicar por matrícula: o JOIN do backend pode retornar o aluno
			// mais de uma vez quando ele possui TCCs em múltiplas fases
			const matriculasVistas = new Set<string>();
			const dicentesUnicos = dicentesOrdenados.filter((d) => {
				const mat = String(d.matricula ?? "");
				if (!mat || matriculasVistas.has(mat)) return false;
				matriculasVistas.add(mat);
				return true;
			});
			setDicentes(dicentesUnicos);
			}
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

	async function getOrientacoes() {
		try {
			const orientacoesData = await orientacaoService.getOrientacoes({});
			setOrientacoes(orientacoesData);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de orientações: ",
				error,
			);
			setOrientacoes([]);
		}
	}

	async function getTrabalhosComDetalhes() {
		try {
			setLoadingTrabalhos(true);
			const params: Record<string, string | number> = {};
			if (orientacaoController.filtroEstaAtivo(ano)) params.ano = ano;
			if (orientacaoController.filtroEstaAtivo(cursoSelecionado)) {
				params.id_curso = cursoSelecionado;
			}

			const listaCompleta =
				await orientacaoService.getTrabalhosConclusao(params);
			const filtrosAtuais = { cursoSelecionado, ano, semestre, fase };
			const lista = listaCompleta.filter(
				(t) =>
					orientacaoController.vistasQueAtendemFiltros(t, filtrosAtuais)
						.length > 0,
			);
			setTrabalhosLista(lista);

		const mapa =
			orientacaoController.criarMapaTrabalhoPorMatricula(lista, fase);
		setTrabalhosPorMatricula(mapa as Record<string, TrabalhoConclusao>);

			// Carregar convites para cada TCC
			const idsTcc = orientacaoController.extrairIdsTcc(lista);
			const resultados = await Promise.all(
				idsTcc.map(async (id) => {
					try {
						const convites = await orientacaoService.getConvites({
							id_tcc: id,
						});
						return { id, convites };
					} catch (e) {
						return { id, convites: [] as Convite[] };
					}
				}),
			);

			const mapaConvites =
				orientacaoController.criarMapaConvitesPorTcc(resultados);
			setConvitesPorTcc(mapaConvites as Record<number, Convite[]>);
		} catch (error) {
			console.log("Não foi possível carregar TCCs:", error);
			setTrabalhosPorMatricula({});
			setTrabalhosLista([]);
			setConvitesPorTcc({});
		} finally {
			setLoadingTrabalhos(false);
		}
	}

	async function getAreasTcc() {
		setLoadingAreas(true);
		try {
			const areas = await orientacaoService.getAreasTcc();
			setAreasTcc(areas);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de áreas TCC: ",
				error,
			);
			setAreasTcc([]);
		} finally {
			setLoadingAreas(false);
		}
	}

	function _obterTccPorIdOuMatricula(tccId?: number, matricula?: string) {
		if (tccId) {
			const porId = trabalhosLista.find((t) => t.id === tccId);
			if (porId) return porId;
		}
		if (matricula) return trabalhosPorMatricula[matricula];
		return undefined;
	}

	function _obterOrientacaoEmbutida(tccId?: number, matricula?: string) {
		const tcc = _obterTccPorIdOuMatricula(tccId, matricula);
		if (!tcc) return null;
		// Sequelize serializa a associação como "Orientacoes" (nome do modelo) ou "orientacoes" (nome da propriedade)
		const lista = tcc.Orientacoes ?? tcc.orientacoes ?? [];
		return lista.find((o) => o.orientador === true) ?? null;
	}

	function getOrientadorAtual(matricula: string, tccId?: number) {
		const o = _obterOrientacaoEmbutida(tccId, matricula);
		if (!o) return null;
		return { id: o.id, codigo: o.codigo_docente, nome: o.docente?.nome || "Orientador" };
	}

	function getOrientacaoAtual(matricula: string, tccId?: number) {
		const o = _obterOrientacaoEmbutida(tccId, matricula);
		if (!o) return null;
		return {
			id: o.id,
			codigo_docente: o.codigo_docente,
			id_tcc: o.id_tcc,
			orientador: true as const,
			docente: o.docente ? { nome: o.docente.nome } : undefined,
		};
	}

	function getOrientadorNome(matricula: string, tccId?: number) {
		const orientador = getOrientadorAtual(matricula, tccId);
		return orientacaoController.obterNomeOrientador(orientador);
	}

	function handleCloseMessage(_event: unknown, reason?: string) {
		if (reason === "clickaway") return;
		setOpenMessage(false);
	}

	function handleOpenUploadModal() {
		const curso = (cursos as { id: number }[]).find(
			(c) => c.id === cursoSelecionado,
		);
		setModalCurso((curso as unknown as Curso) || null);
		setModalAno(ano);
		setModalSemestre(semestre);
		setModalFase(fase);
		setOpenUploadModal(true);
	}

	function handleCloseUploadModal() {
		setOpenUploadModal(false);
		setUploadFile(null);
		setUploadResults(null);
		setModalCurso(null);
		setModalAno("");
		setModalSemestre("");
		setModalFase("");
	}

	function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (orientacaoController.validarArquivoPdf(file)) {
			setUploadFile(file ?? null);
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

		if (
			!orientacaoController.validarCamposUpload(
				modalAno,
				modalSemestre,
				modalFase,
				modalCurso ?? "",
			)
		) {
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
		formData.append("ano", String(modalAno));
		formData.append("semestre", String(modalSemestre));
		formData.append("fase", String(modalFase));
		formData.append("id_curso", String(modalCurso?.id ?? ""));

		try {
			const response =
				await orientacaoService.uploadPdfDicentes(formData);

			setUploadResults(response);
			setMessageText(
				`PDF processado com sucesso! ${response.sucessos} dicentes inseridos, ${response.erros} erros.`,
			);
			setMessageSeverity("success");
			await getDicentes();
		} catch (error) {
			console.log("Erro ao fazer upload do PDF:", error);
			setMessageText(
				error instanceof Error ? error.message : "Falha ao processar PDF!",
			);
			setMessageSeverity("error");
		} finally {
			setUploading(false);
			setOpenMessage(true);
		}
	}

	function handleOpenEditModal(dicente: Dicente, tccId?: number) {
		setSelectedDicente(dicente);
		setSelectedTccId(tccId ?? null);
		setLoadingEdit(true);
		setOpenEditModal(true);
		loadTccData(dicente.matricula, tccId);
	}

	function handleCloseEditModal() {
		setOpenEditModal(false);
		setSelectedDicente(null);
		setSelectedTccId(null);
		setEditData({
			orientador: "",
			tema: "",
			titulo: "",
			resumo: "",
			seminarioAndamento: "",
			etapa: 0,
			membroBanca1: "",
			membroBanca2: "",
			dataHoraDefesa: null,
		});
		setLoadingEdit(false);
		setDefesasAtual([]);
		setConvitesBancaAtual([]);
		setConvitesBancaFase1([]);
		setConvitesBancaFase2([]);
		setSelectedHorarioBanca(null);
		setMostrarSeletorHorario(false);
		setDocentesExternosAtual([]);
	}

	async function loadTccData(matricula: string, tccId?: number) {
		try {
			const tcc = _obterTccPorIdOuMatricula(tccId, matricula);
			const orientador = getOrientadorAtual(matricula, tcc?.id);

			let dadosBanca = {
				membroBanca1: "",
				membroBanca2: "",
				dataHoraDefesa: null as Date | null,
			};

			if (tcc?.id) {
				try {
					// Carregar defesas e membros externos em paralelo
					const [defesas, externos] = await Promise.all([
						orientacaoService.getDefesasPorTcc(tcc.id),
						getMembrosExternosTcc(tcc.id).catch(() => []),
					]);

					// Converter externos para o formato de docentesBanca
					const externosFormatados = externos.map((m) => ({
						docente: {
							codigo: m.codigo,
							nome: m.nome,
							email: m.email,
							siape: m.siape,
							externo: true,
							instituicao: m.instituicao,
						},
					}));
					setDocentesExternosAtual(externosFormatados);

					const defesasFaseAtual =
						orientacaoController.filtrarDefesasPorFase(
							defesas,
							tcc.fase,
						);
					setDefesasAtual(defesasFaseAtual as Defesa[]);

					// Carregar convites de banca
					const todosConvitesBanca =
						await orientacaoService.getConvites({ id_tcc: tcc.id });
					const convitesBancaFiltrados = todosConvitesBanca.filter(
						(c) => c.orientacao === false,
					);

					const convitesFase1 =
						orientacaoController.filtrarConvitesBanca(
							convitesBancaFiltrados,
							1,
						);
					const convitesFase2 =
						orientacaoController.filtrarConvitesBanca(
							convitesBancaFiltrados,
							2,
						);
					const convitesFaseAtual =
						orientacaoController.filtrarConvitesBanca(
							convitesBancaFiltrados,
							tcc.fase,
						);

					setConvitesBancaAtual(convitesFaseAtual);
					setConvitesBancaFase1(convitesFase1);
					setConvitesBancaFase2(convitesFase2);

					// Extrair membros da banca
					dadosBanca = orientacaoController.extrairMembrosBanca(
						defesasFaseAtual,
					);
				} catch (error) {
					console.log("Erro ao carregar defesas ou convites:", error);
					setDefesasAtual([]);
					setConvitesBancaAtual([]);
					setConvitesBancaFase1([]);
					setConvitesBancaFase2([]);
				}
			}

			const dadosEdicao = orientacaoController.prepararDadosEdicao(
				tcc,
				orientador,
				dadosBanca,
				isOrientadorView,
				usuario?.id,
			);

			setEditData(dadosEdicao);
			setSelectedHorarioBanca(null);
			setMostrarSeletorHorario(false);
		} catch (error) {
			console.log("Erro ao carregar dados do TCC:", error);
		} finally {
			setLoadingEdit(false);
		}
	}

	function handleEditDataChange(
		field: keyof typeof editData,
		value: string | number | Date | null,
	) {
		setEditData((prev) => ({
			...prev,
			[field]: value,
		}));

		if (
			field === "orientador" ||
			field === "membroBanca1" ||
			field === "membroBanca2"
		) {
			setSelectedHorarioBanca(null);
			setMostrarSeletorHorario(false);
		}
	}

	async function gerenciarBancaDefesa(idTcc: number) {
		const membrosNovos = [
			editData.membroBanca1,
			editData.membroBanca2,
		].filter(Boolean);
		const membrosExistentes = defesasAtual.map(
			(defesa) => defesa.membro_banca,
		);

		const tccAtual = _obterTccPorIdOuMatricula(
			selectedTccId ?? undefined,
			selectedDicente?.matricula,
		);
		const faseAtual = parseInt(String(tccAtual?.fase));
		const convitesCorretos =
			faseAtual === 2 ? convitesBancaFase2 : convitesBancaAtual;

		const alteracoes = orientacaoController.identificarAlteracoesBanca(
			membrosNovos,
			membrosExistentes,
			convitesCorretos,
		);

		const payload = orientacaoController.prepararPayloadGerenciarBanca(
			idTcc,
			tccAtual?.fase || fase,
			membrosNovos,
			membrosExistentes,
			convitesCorretos,
			alteracoes,
			editData.orientador,
			editData.dataHoraDefesa,
		);

		await orientacaoService.gerenciarBancaDefesa(payload);

		// Se há horário selecionado, agendar a defesa
		if (
			selectedHorarioBanca &&
			editData.orientador &&
			editData.membroBanca1 &&
			editData.membroBanca2
		) {
			const agendamentoPayload =
				orientacaoController.prepararPayloadAgendarDefesa(
					idTcc,
					tccAtual?.fase || fase,
					selectedHorarioBanca.data,
					selectedHorarioBanca.hora,
					editData.orientador,
					[editData.membroBanca1, editData.membroBanca2],
				);

			await orientacaoService.agendarDefesa(agendamentoPayload);
		}
	}

	async function handleSaveEdit() {
		if (!selectedDicente) return;

		try {
			setLoadingEdit(true);

			const tcc = _obterTccPorIdOuMatricula(
				selectedTccId ?? undefined,
				selectedDicente.matricula,
			);
			if (!tcc) {
				throw new Error("TCC não encontrado para este dicente");
			}

			// Validação
			const etapaAtual = parseInt(String(editData.etapa));
			const faseAtual = parseInt(String(tcc?.fase));
			const edicaoBancaHabilitada =
				orientacaoController.isEdicaoBancaHabilitada(
					etapaAtual,
					faseAtual,
				);

			if (
				!orientacaoController.validarSalvarComDataDefesa(
					editData.dataHoraDefesa,
					editData.membroBanca1,
					editData.membroBanca2,
				) &&
				edicaoBancaHabilitada
			) {
				setMessageText(
					"Para definir uma data de defesa, é necessário selecionar os 2 membros da banca!",
				);
				setMessageSeverity("error");
				setOpenMessage(true);
				setLoadingEdit(false);
				return;
			}

			// Atualizar TCC
			const tccData: {
				tema: string;
				titulo: string;
				resumo: string;
				etapa: number;
				seminario_andamento?: string;
			} = {
				tema: editData.tema,
				titulo: editData.titulo,
				resumo: editData.resumo,
				etapa: parseInt(String(editData.etapa)),
			};

			if (parseInt(String(tcc.fase)) === 2) {
				tccData.seminario_andamento = editData.seminarioAndamento;
			}

			await orientacaoService.atualizarTrabalhoConclusao(tcc.id, tccData);

			// Gerenciar orientação e convites
			const orientadorAtual = getOrientadorAtual(
				selectedDicente.matricula,
				tcc.id,
			);
			const orientacaoAtual = getOrientacaoAtual(
				selectedDicente.matricula,
				tcc.id,
			);
			const codigoOrientadorAtual = orientadorAtual?.codigo || "";

			if (
				!isOrientadorView &&
				editData.orientador !== codigoOrientadorAtual
			) {
				const convitesOrientacao = await orientacaoService.getConvites({
					id_tcc: tcc.id,
				});
				const convitesOrientacaoFiltrados =
					orientacaoController.filtrarConvitesOrientacao(
						convitesOrientacao,
						tcc.fase,
					);

				// Deletar orientação anterior
				if (orientacaoAtual && orientacaoAtual.id) {
					await orientacaoService.deletarOrientacao(
						orientacaoAtual.id,
					);
				}

				// Gerenciar convites
				if (editData.orientador) {
					const conviteNovoOrientador =
						convitesOrientacaoFiltrados.find(
							(c) => c.codigo_docente === editData.orientador,
						);
					const conviteOrientadorAtual = codigoOrientadorAtual
						? convitesOrientacaoFiltrados.find(
								(c) =>
									c.codigo_docente === codigoOrientadorAtual,
							)
						: null;

					if (!codigoOrientadorAtual) {
						if (
							!conviteNovoOrientador ||
							conviteNovoOrientador.aceito === false
						) {
							const mensagemPadrao =
								"Informado pelo professor do CCR";
							const convitePayload =
								orientacaoController.prepararConviteOrientacao(
									tcc.id,
									tcc.fase,
									editData.orientador,
									mensagemPadrao,
									true,
								);
							await orientacaoService.criarConvite(
								convitePayload,
							);
						}
					} else {
						if (editData.orientador !== codigoOrientadorAtual) {
							const mensagemAlteracao = `Alteração de orientação informada pelo professor do CCR de ${codigoOrientadorAtual} para ${editData.orientador}`;

							if (conviteOrientadorAtual) {
								await orientacaoService.deletarConvite(
									tcc.id,
									codigoOrientadorAtual,
									tcc.fase,
								);
							}

							const convitePayload =
								orientacaoController.prepararConviteOrientacao(
									tcc.id,
									tcc.fase,
									editData.orientador,
									mensagemAlteracao,
									true,
								);
							await orientacaoService.criarConvite(
								convitePayload,
							);
						}
					}

					// Criar nova orientação
					const orientacaoPayload =
						orientacaoController.prepararOrientacao(
							editData.orientador,
							tcc.id,
						);
					await orientacaoService.criarOrientacao(orientacaoPayload);
				}
			}

			// Gerenciar banca se necessário
			const precisaBanca = orientacaoController.isEdicaoBancaHabilitada(
				editData.etapa,
				tcc?.fase,
			);

			if (precisaBanca) {
				await gerenciarBancaDefesa(tcc.id);
			}

			setMessageText("Dados salvos com sucesso!");
			setMessageSeverity("success");

			await getTrabalhosComDetalhes();

			handleCloseEditModal();
		} catch (error) {
			console.error("Erro ao salvar dados:", error);
			setMessageText(
				`Falha ao salvar dados: ${error instanceof Error ? error.message : ""}`,
			);
			setMessageSeverity("error");
		} finally {
			setLoadingEdit(false);
			setOpenMessage(true);
		}
	}

	// Processar dados para exibição
	const docentesDisponiveis = cursoSelecionado
		? orientadoresCurso.map((oc) => oc.docente)
		: [];

	// Semestre="" e fase="" significam "Todos/Todas" — são escolhas válidas
	const todosOsFiltrosSelecionados = Boolean(cursoSelecionado && ano);

	const dicentesDoRecorte = todosOsFiltrosSelecionados
		? isOrientadorView
			? dicentes
			: orientacaoController.filtrarDicentesPorTrabalhos(
					dicentes,
					trabalhosLista,
				)
		: [];

	const linhasOrientacao = todosOsFiltrosSelecionados
		? orientacaoController.montarLinhasOrientacao(
				dicentesDoRecorte,
				trabalhosLista,
				{ cursoSelecionado, ano, semestre, fase },
			)
		: [];

	const anosUnicos = orientacaoController.gerarAnosUnicos(ofertasTcc);
	const semestresUnicos =
		orientacaoController.gerarSemestresUnicos(ofertasTcc);
	const fasesUnicas = orientacaoController.gerarFasesUnicas(ofertasTcc);

	return {
		// Estados de permissão
		isProfessor,
		isAdmin,
		// Estados de dados
		dicentes: linhasOrientacao,
		cursos,
		orientadoresCurso,
		ofertasTcc,
		orientacoes,
		trabalhosPorMatricula,
		trabalhosLista,
		convitesPorTcc,
		areasTcc,
		docentesBanca,
		docentesExternosAtual,
		docentesDisponiveis,
		usuario,
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
		selectedTccId,
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
	};
}
