import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import permissoesService from "../services/permissoesService";
import { Permissoes } from "../enums/permissoes";
import orientacaoService from "../services/orientacao-service";
import orientacaoController from "../controllers/orientacao-controller";

export function useOrientacao(isOrientadorView = false) {
	const { permissoesUsuario, gruposUsuario, usuario } = useAuth();

	// Verificações de permissão
	const isProfessor = permissoesService.verificarPermissaoPorGrupos(
		gruposUsuario,
		[Permissoes.GRUPOS.PROFESSOR],
	);

	const isAdmin = permissoesService.verificarPermissaoPorGrupos(
		gruposUsuario,
		[Permissoes.GRUPOS.ADMIN],
	);

	const [dicentes, setDicentes] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [orientadoresCurso, setOrientadoresCurso] = useState([]);
	const [ofertasTcc, setOfertasTcc] = useState([]);
	const [orientacoes, setOrientacoes] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(
		isOrientadorView
			? orientacaoController.getAnoSemestreAtual().ano
			: new Date().getFullYear(),
	);
	const [semestre, setSemestre] = useState(
		isOrientadorView
			? orientacaoController.getAnoSemestreAtual().semestre
			: "",
	);
	const [fase, setFase] = useState("");
	const [loadingCursos, setLoadingCursos] = useState(false);
	const [loadingOfertasTcc, setLoadingOfertasTcc] = useState(false);
	const [loadingDicentes, setLoadingDicentes] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");
	const [orientacoesAlteradas, setOrientacoesAlteradas] = useState({});
	const [trabalhosPorMatricula, setTrabalhosPorMatricula] = useState({});
	const [loadingTrabalhos, setLoadingTrabalhos] = useState(false);
	const [convitesPorTcc, setConvitesPorTcc] = useState({});

	// Estados para upload de PDF
	const [openUploadModal, setOpenUploadModal] = useState(false);
	const [uploadFile, setUploadFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [uploadResults, setUploadResults] = useState(null);
	const [modalAno, setModalAno] = useState("");
	const [modalSemestre, setModalSemestre] = useState("");
	const [modalFase, setModalFase] = useState("");
	const [modalCurso, setModalCurso] = useState(null);

	// Estados para modal de edição
	const [openEditModal, setOpenEditModal] = useState(false);
	const [selectedDicente, setSelectedDicente] = useState(null);
	const [editData, setEditData] = useState({
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
	const [mostrarSeletorHorario, setMostrarSeletorHorario] = useState(false);
	const [loadingEdit, setLoadingEdit] = useState(false);
	const [areasTcc, setAreasTcc] = useState([]);
	const [loadingAreas, setLoadingAreas] = useState(false);
	const [defesasAtual, setDefesasAtual] = useState([]);
	const [convitesBancaAtual, setConvitesBancaAtual] = useState([]);
	const [convitesBancaFase1, setConvitesBancaFase1] = useState([]);
	const [convitesBancaFase2, setConvitesBancaFase2] = useState([]);
	const [selectedHorarioBanca, setSelectedHorarioBanca] = useState(null);
	const [docentesBanca, setDocentesBanca] = useState([]);

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
	useEffect(() => {
		if (isOrientadorView) {
			if (cursoSelecionado && ano && semestre) {
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

		if (cursoSelecionado && ano && semestre && fase) {
			getOrientacoes();
		} else {
			setOrientacoes([]);
		}

		if (ano && semestre) {
			getTrabalhosComDetalhes();
		} else {
			setTrabalhosPorMatricula({});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cursoSelecionado, ano, semestre, fase, isProfessor, isAdmin, isOrientadorView]);

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
		setOrientacoesAlteradas({});
	}, [cursoSelecionado, ano, semestre, fase]);

	async function getCursos() {
		setLoadingCursos(true);
		try {
			if (isOrientadorView || isProfessor) {
				const codigoDocente = usuario?.codigo || usuario?.id;
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
					setCursoSelecionado(cursosUnicos[0].id);
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

	async function getOrientadoresCurso(idCurso) {
		try {
			const orientadores =
				await orientacaoService.getOrientadoresCurso(idCurso);
			setOrientadoresCurso(orientadores);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de orientadores do curso: ",
				error,
			);
			setOrientadoresCurso([]);
		}
	}

	async function getDocentesBancaCurso(idCurso) {
		try {
			const docentes = await orientacaoService.getDocentesBancaCurso(
				idCurso,
			);
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
				const codigoDocente = usuario?.codigo || usuario?.id;
				if (!codigoDocente) {
					setDicentes([]);
					return;
				}

				const params = {
					codigo_docente: codigoDocente,
					orientador: true,
				};
				const orientacoesData = await orientacaoService.getOrientacoes(
					params,
				);

				const orientacoesFiltradas =
					orientacaoController.filtrarOrientacoes(orientacoesData, {
						cursoSelecionado,
						ano,
						semestre,
						fase,
					});

				const dicentesData =
					orientacaoController.extrairDicentesDasOrientacoes(
						orientacoesFiltradas,
					);
				const dicentesOrdenados =
					orientacaoController.ordenarDicentesPorNome(dicentesData);

				setDicentes(dicentesOrdenados);
			} else {
				const params = {};
				if (ano) params.ano = ano;
				if (semestre) params.semestre = semestre;
				if (fase) params.fase = fase;

				const dicentesData = await orientacaoService.getDicentes(params);
				const dicentesOrdenados =
					orientacaoController.ordenarDicentesPorNome(dicentesData);
				setDicentes(dicentesOrdenados);
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
			const params = {};
			if (ano) params.ano = ano;
			if (semestre) params.semestre = semestre;
			if (fase) params.fase = fase;
			if (cursoSelecionado) params.id_curso = cursoSelecionado;

			const lista = await orientacaoService.getTrabalhosConclusao(params);

			const mapa =
				orientacaoController.criarMapaTrabalhoPorMatricula(lista);
			setTrabalhosPorMatricula(mapa);

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
						return { id, convites: [] };
					}
				}),
			);

			const mapaConvites =
				orientacaoController.criarMapaConvitesPorTcc(resultados);
			setConvitesPorTcc(mapaConvites);
		} catch (error) {
			console.log("Não foi possível carregar TCCs:", error);
			setTrabalhosPorMatricula({});
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

	function getOrientadorAtual(matricula) {
		const orientacao = orientacaoController.buscarOrientacaoAtual(
			orientacoes,
			matricula,
			{ cursoSelecionado, ano, semestre, fase },
		);
		return orientacaoController.obterOrientadorAtual(orientacao);
	}

	function getOrientacaoAtual(matricula) {
		return orientacaoController.buscarOrientacaoAtual(
			orientacoes,
			matricula,
			{ cursoSelecionado, ano, semestre, fase },
		);
	}

	function getOrientadorNome(matricula) {
		const orientador = getOrientadorAtual(matricula);
		return orientacaoController.obterNomeOrientador(orientador);
	}

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") return;
		setOpenMessage(false);
	}

	function handleOpenUploadModal() {
		const curso = cursos.find((c) => c.id === cursoSelecionado);
		setModalCurso(curso || null);
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

	function handleFileChange(e) {
		const file = e.target.files[0];
		if (orientacaoController.validarArquivoPdf(file)) {
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

		if (
			!orientacaoController.validarCamposUpload(
				modalAno,
				modalSemestre,
				modalFase,
				modalCurso,
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
		formData.append("ano", modalAno);
		formData.append("semestre", modalSemestre);
		formData.append("fase", modalFase);
		formData.append("id_curso", modalCurso.id);

		try {
			const response = await orientacaoService.uploadPdfDicentes(
				formData,
			);

			setUploadResults(response);
			setMessageText(
				`PDF processado com sucesso! ${response.sucessos} dicentes inseridos, ${response.erros} erros.`,
			);
			setMessageSeverity("success");
			await getDicentes();
		} catch (error) {
			console.log("Erro ao fazer upload do PDF:", error);
			setMessageText(error.message || "Falha ao processar PDF!");
			setMessageSeverity("error");
		} finally {
			setUploading(false);
			setOpenMessage(true);
		}
	}

	function handleOpenEditModal(dicente) {
		setSelectedDicente(dicente);
		setLoadingEdit(true);
		setOpenEditModal(true);
		loadTccData(dicente.matricula);
	}

	function handleCloseEditModal() {
		setOpenEditModal(false);
		setSelectedDicente(null);
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
	}

	async function loadTccData(matricula) {
		try {
			const tcc = trabalhosPorMatricula[matricula];
			const orientador = getOrientadorAtual(matricula);

			let dadosBanca = {
				membroBanca1: "",
				membroBanca2: "",
				dataHoraDefesa: null,
			};

			if (tcc?.id) {
				try {
					// Carregar defesas
					const defesas = await orientacaoService.getDefesasPorTcc(
						tcc.id,
					);
					const defesasFaseAtual =
						orientacaoController.filtrarDefesasPorFase(
							defesas,
							tcc.fase,
						);
					setDefesasAtual(defesasFaseAtual);

					// Carregar convites de banca
					const todosConvitesBanca = await orientacaoService.getConvites(
						{ id_tcc: tcc.id },
					);
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
				usuario?.codigo || usuario?.id,
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

	function handleEditDataChange(field, value) {
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

	async function gerenciarBancaDefesa(idTcc) {
		const membrosNovos = [editData.membroBanca1, editData.membroBanca2].filter(
			Boolean,
		);
		const membrosExistentes = defesasAtual.map((defesa) => defesa.membro_banca);

		const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
		const faseAtual = parseInt(tccAtual?.fase);
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

			const tcc = trabalhosPorMatricula[selectedDicente.matricula];
			if (!tcc) {
				throw new Error("TCC não encontrado para este dicente");
			}

			// Validação
			const etapaAtual = parseInt(editData.etapa);
			const faseAtual = parseInt(tcc?.fase);
			const edicaoBancaHabilitada = orientacaoController.isEdicaoBancaHabilitada(
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
			const tccData = {
				tema: editData.tema,
				titulo: editData.titulo,
				resumo: editData.resumo,
				etapa: parseInt(editData.etapa),
			};

			if (parseInt(tcc.fase) === 2) {
				tccData.seminario_andamento = editData.seminarioAndamento;
			}

			await orientacaoService.atualizarTrabalhoConclusao(tcc.id, tccData);

			// Gerenciar orientação e convites
			const orientadorAtual = getOrientadorAtual(selectedDicente.matricula);
			const orientacaoAtual = getOrientacaoAtual(selectedDicente.matricula);
			const codigoOrientadorAtual = orientadorAtual?.codigo || "";

			if (!isOrientadorView && editData.orientador !== codigoOrientadorAtual) {
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
					await orientacaoService.deletarOrientacao(orientacaoAtual.id);
				}

				// Gerenciar convites
				if (editData.orientador) {
					const conviteNovoOrientador = convitesOrientacaoFiltrados.find(
						(c) => c.codigo_docente === editData.orientador,
					);
					const conviteOrientadorAtual = codigoOrientadorAtual
						? convitesOrientacaoFiltrados.find(
								(c) => c.codigo_docente === codigoOrientadorAtual,
							)
						: null;

					if (!codigoOrientadorAtual) {
						if (
							!conviteNovoOrientador ||
							conviteNovoOrientador.aceito === false
						) {
							const mensagemPadrao = "Informado pelo professor do CCR";
							const convitePayload =
								orientacaoController.prepararConviteOrientacao(
									tcc.id,
									tcc.fase,
									editData.orientador,
									mensagemPadrao,
									true,
								);
							await orientacaoService.criarConvite(convitePayload);
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
							await orientacaoService.criarConvite(convitePayload);
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

			await Promise.all([getOrientacoes(), getTrabalhosComDetalhes()]);

			handleCloseEditModal();
		} catch (error) {
			console.error("Erro ao salvar dados:", error);
			setMessageText(`Falha ao salvar dados: ${error.message}`);
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

	const todosOsFiltrosSelecionados = isOrientadorView
		? cursoSelecionado && ano && semestre
		: cursoSelecionado && ano && semestre && fase;

	const dicentesFiltrados = todosOsFiltrosSelecionados ? dicentes : [];

	const anosUnicos = orientacaoController.gerarAnosUnicos(ofertasTcc);
	const semestresUnicos = orientacaoController.gerarSemestresUnicos(ofertasTcc);
	const fasesUnicas = orientacaoController.gerarFasesUnicas(ofertasTcc);

	return {
		// Estados de permissão
		isProfessor,
		isAdmin,
		// Estados de dados
		dicentes: dicentesFiltrados,
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
	};
}

