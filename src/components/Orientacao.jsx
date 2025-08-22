import React, { useState, useEffect } from "react";
import axiosInstance from "../auth/axios";
import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import permissoesService from "../services/permissoesService";
import { useAuth } from "../contexts/AuthContext";
import FiltrosPesquisa from "./FiltrosPesquisa";

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
import { ptBR } from "date-fns/locale";
import { DataGrid } from "@mui/x-data-grid";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";

export default function Orientacao({ isOrientadorView = false }) {
	const [dicentes, setDicentes] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [orientadoresCurso, setOrientadoresCurso] = useState([]);
	const [ofertasTcc, setOfertasTcc] = useState([]);
	const [orientacoes, setOrientacoes] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(
		isOrientadorView ? getAnoSemestreAtual().ano : new Date().getFullYear(),
	);
	const [semestre, setSemestre] = useState(
		isOrientadorView ? getAnoSemestreAtual().semestre : "",
	);
	const [fase, setFase] = useState("");
	const [loadingCursos, setLoadingCursos] = useState(false);
	const [loadingOfertasTcc, setLoadingOfertasTcc] = useState(false);
	const [loadingDicentes, setLoadingDicentes] = useState(false);
	const [openMessage, setOpenMessage] = React.useState(false);
	const [messageText, setMessageText] = React.useState("");
	const [messageSeverity, setMessageSeverity] = React.useState("success");
	const [orientacoesAlteradas, setOrientacoesAlteradas] = useState({});
	const [trabalhosPorMatricula, setTrabalhosPorMatricula] = useState({});
	const [loadingTrabalhos, setLoadingTrabalhos] = useState(false);
	const [convitesPorTcc, setConvitesPorTcc] = useState({});

	// Estados para upload de PDF
	const [openUploadModal, setOpenUploadModal] = React.useState(false);
	const [uploadFile, setUploadFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [uploadResults, setUploadResults] = useState(null);
	const [modalAno, setModalAno] = useState("");
	const [modalSemestre, setModalSemestre] = useState("");
	const [modalFase, setModalFase] = useState("");
	const [modalCurso, setModalCurso] = useState(null);

	// Estados para modal de edição de orientação
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
	const [loadingEdit, setLoadingEdit] = useState(false);
	const [areasTcc, setAreasTcc] = useState([]);
	const [loadingAreas, setLoadingAreas] = useState(false);
	const [defesasAtual, setDefesasAtual] = useState([]);
	const [convitesBancaAtual, setConvitesBancaAtual] = useState([]);
	const [convitesBancaFase1, setConvitesBancaFase1] = useState([]);
	const [convitesBancaFase2, setConvitesBancaFase2] = useState([]);

	// Helper function para retornar ano/semestre atual
	function getAnoSemestreAtual() {
		const data = new Date();
		const anoAtual = data.getFullYear();
		const semestreAtual = data.getMonth() < 6 ? 1 : 2;
		return { ano: anoAtual, semestre: semestreAtual };
	}

	const { permissoesUsuario, gruposUsuario, usuario } = useAuth();

	// Função para verificar se o usuário é professor
	const isProfessor = permissoesService.verificarPermissaoPorGrupos(
		gruposUsuario,
		[Permissoes.GRUPOS.PROFESSOR],
	);

	// Função para verificar se o usuário é admin
	const isAdmin = permissoesService.verificarPermissaoPorGrupos(
		gruposUsuario,
		[Permissoes.GRUPOS.ADMIN],
	);

	useEffect(() => {
		getCursos();
		getOfertasTcc();
		getAreasTcc();
		// Para admins, não carregar dicentes automaticamente
		// Para professores, só carregar após o curso ser definido
		if (!isAdmin && !isProfessor) {
			getDicentes();
		}
	}, [isAdmin, isProfessor]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		// No modo orientador, carrega dicentes apenas quando filtros necessários estão selecionados
		if (isOrientadorView) {
			if (cursoSelecionado && ano && semestre) {
				getDicentesOrientador();
			} else {
				setDicentes([]);
			}
		} else {
			// Modo admin/professor original
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
				// Para outros tipos de usuário, comportamento original
				getDicentes();
			}
		}

		// Busca orientações quando todos os filtros estão preenchidos
		if (cursoSelecionado && ano && semestre && fase) {
			getOrientacoes();
		} else {
			setOrientacoes([]);
		}

		// Busca TCCs quando ano e semestre estão selecionados (para exibir ícones)
		if (ano && semestre) {
			getTrabalhosComDetalhes();
		} else {
			setTrabalhosPorMatricula({});
		}
	}, [cursoSelecionado, ano, semestre, fase, isProfessor, isAdmin, isOrientadorView]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		// Busca orientadores do curso selecionado
		if (cursoSelecionado) {
			getOrientadoresCurso(cursoSelecionado);
			getDocentesBancaCurso(cursoSelecionado);
		} else {
			setOrientadoresCurso([]);
			setDocentesBanca([]);
		}
	}, [cursoSelecionado]); // eslint-disable-line react-hooks/exhaustive-deps

	async function getCursos() {
		setLoadingCursos(true);
		try {
			if (isOrientadorView || isProfessor) {
				// Para orientadores, buscar apenas seus cursos
				const codigoDocente = usuario?.codigo || usuario?.id;
				if (!codigoDocente) {
					setCursos([]);
					return;
				}

				const response = await axiosInstance.get(
					`/orientadores/docente/${codigoDocente}`,
				);
				const cursosOrientador = response.orientacoes || [];
				const cursosUnicos = cursosOrientador.map(
					(orientacao) => orientacao.curso,
				);
				setCursos(cursosUnicos);

				// Se o professor possui apenas 1 curso, pré-selecionar
				if (cursosUnicos.length === 1) {
					setCursoSelecionado(cursosUnicos[0].id);
				}
			} else {
				// Para admins, buscar todos os cursos
				const response = await axiosInstance.get("/cursos");
				setCursos(response.cursos || []);
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
			const response = await axiosInstance.get(
				`/orientadores/curso/${idCurso}`,
			);
			setOrientadoresCurso(response.orientacoes || []);
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
			const response = await axiosInstance.get(
				`/banca-curso/curso/${idCurso}`,
			);

			// Corrigir acesso aos dados - o axios coloca a resposta em .data
			const docentesBanca =
				response.data?.docentesBanca || response.docentesBanca || [];
			setDocentesBanca(docentesBanca);
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
			const response = await axiosInstance.get("/ofertas-tcc");
			setOfertasTcc(response.ofertas || []);
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
			const params = {};
			if (ano) {
				params.ano = ano;
			}
			if (semestre) {
				params.semestre = semestre;
			}
			if (fase) {
				params.fase = fase;
			}
			const response = await axiosInstance.get("/dicentes", { params });
			// Ordena os dicentes por nome em ordem crescente
			const dicentesOrdenados = (response.dicentes || []).sort((a, b) =>
				a.nome.localeCompare(b.nome),
			);
			setDicentes(dicentesOrdenados);
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

	async function getDicentesOrientador() {
		setLoadingDicentes(true);
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
			if (!codigoDocente) {
				setDicentes([]);
				return;
			}

			// Buscar orientações do docente logado
			const params = {
				codigo_docente: codigoDocente,
				orientador: true,
			};
			const response = await axiosInstance.get("/orientacoes", { params });

			// Filtrar orientações por curso, ano, semestre e fase
			const orientacoesFiltradas = (response.orientacoes || [])
				.filter((o) => {
					const tcc = o.TrabalhoConclusao;
					if (!tcc) return false;

					return (
						tcc.Curso?.id === parseInt(cursoSelecionado) &&
						tcc.ano === parseInt(ano) &&
						tcc.semestre === parseInt(semestre) &&
						(fase === "" || tcc.fase === parseInt(fase))
					);
				});

			// Extrair dicentes das orientações
			const dicentes = orientacoesFiltradas
				.map((o) => o.TrabalhoConclusao?.Dicente)
				.filter((dicente) => dicente !== null && dicente !== undefined)
				.sort((a, b) => a.nome.localeCompare(b.nome));

			setDicentes(dicentes);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de dicentes orientados: ",
				error,
			);
			setDicentes([]);
		} finally {
			setLoadingDicentes(false);
		}
	}

	async function getOrientacoes() {
		try {
			const response = await axiosInstance.get("/orientacoes");
			setOrientacoes(response.orientacoes || []);
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
			if (ano) {
				params.ano = ano;
			}
			if (semestre) {
				params.semestre = semestre;
			}
			if (fase) {
				params.fase = fase;
			}
			if (cursoSelecionado) {
				params.id_curso = cursoSelecionado;
			}

			const resp = await axiosInstance.get("/trabalho-conclusao", {
				params,
			});
			const lista = resp.data?.trabalhos || resp.trabalhos || [];

			// Mapear por matrícula do dicente, escolhendo o TCC com maior id (mais recente)
			const mapa = {};
			for (const t of lista) {
				const mat = t.Dicente?.matricula || t.matricula;
				if (!mat) continue;
				if (
					!mapa[mat] ||
					(t.id && mapa[mat].id && t.id > mapa[mat].id)
				) {
					mapa[mat] = t;
				}
			}
			setTrabalhosPorMatricula(mapa);

			// Carregar convites para cada TCC (orientação e banca)
			const idsTcc = Array.from(
				new Set(lista.map((t) => t.id).filter(Boolean)),
			);
			const resultados = await Promise.all(
				idsTcc.map(async (id) => {
					try {
						const res = await axiosInstance.get("/convites", {
							params: { id_tcc: id },
						});
						const convites =
							res.data?.convites || res.convites || [];
						return { id, convites };
					} catch (e) {
						return { id, convites: [] };
					}
				}),
			);
			const mapaConvites = {};
			for (const { id, convites } of resultados) {
				mapaConvites[id] = convites;
			}
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
			const response = await axiosInstance.get("/areas-tcc");
			setAreasTcc(response.areas || []);
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
		if (!cursoSelecionado || !ano || !semestre || !fase) return null;

		const orientacao = orientacoes.find((o) => {
			const tcc = o.TrabalhoConclusao || o.trabalhoConclusao;
			const mat = tcc?.matricula;
			const cursoId = tcc?.Curso?.id || tcc?.id_curso || tcc?.idCurso;
			const faseTcc = tcc?.fase != null ? parseInt(tcc.fase) : undefined;
			const anoT = tcc?.ano;
			const semestreT = tcc?.semestre;
			const isOrientador = o.orientador === true;
			return (
				isOrientador &&
				mat === matricula &&
				anoT === parseInt(ano) &&
				semestreT === parseInt(semestre) &&
				cursoId === cursoSelecionado &&
				faseTcc === parseInt(fase)
			);
		});

		return orientacao
			? {
					id: orientacao.id,
					codigo:
						orientacao.codigo_docente || orientacao.codigo || "",
					nome: orientacao.Docente?.nome || "Orientador",
			  }
			: null;
	}

	function getOrientacaoAtual(matricula) {
		if (!cursoSelecionado || !ano || !semestre || !fase) return null;

		const orientacao = orientacoes.find((o) => {
			const tcc = o.TrabalhoConclusao || o.trabalhoConclusao;
			const mat = tcc?.matricula;
			const cursoId = tcc?.Curso?.id || tcc?.id_curso || tcc?.idCurso;
			const faseTcc = tcc?.fase != null ? parseInt(tcc.fase) : undefined;
			const anoT = tcc?.ano;
			const semestreT = tcc?.semestre;
			const isOrientador = o.orientador === true;
			return (
				isOrientador &&
				mat === matricula &&
				anoT === parseInt(ano) &&
				semestreT === parseInt(semestre) &&
				cursoId === cursoSelecionado &&
				faseTcc === parseInt(fase)
			);
		});

		return orientacao || null;
	}

	function getOrientadorNome(matricula) {
		const orientador = getOrientadorAtual(matricula);
		return orientador?.nome || "Sem orientador";
	}

	// Função para limpar alterações quando qualquer filtro muda
	useEffect(() => {
		setOrientacoesAlteradas({});
	}, [cursoSelecionado, ano, semestre, fase]);

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	}

	function handleOpenUploadModal() {
		// Pré-popular com os valores da tela principal
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
		// Resetar os valores do modal
		setModalCurso(null);
		setModalAno("");
		setModalSemestre("");
		setModalFase("");
	}

	function handleFileChange(e) {
		const file = e.target.files[0];
		if (file && file.type === "application/pdf") {
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

		if (!modalAno || !modalSemestre || !modalFase || !modalCurso) {
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

		// Adicionar ano, semestre, fase e curso aos dados
		formData.append("ano", modalAno);
		formData.append("semestre", modalSemestre);
		formData.append("fase", modalFase);
		formData.append("id_curso", modalCurso.id);

		try {
			const response = await axiosInstance.post(
				"/dicentes/processar-pdf",
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
					},
				},
			);

			setUploadResults(response);
			setMessageText(
				`PDF processado com sucesso! ${response.sucessos} dicentes inseridos, ${response.erros} erros.`,
			);
			setMessageSeverity("success");
			// Atualiza a lista de dicentes
			await getDicentes();
		} catch (error) {
			console.log("Erro ao fazer upload do PDF:", error);
			setMessageText("Falha ao processar PDF!");
			setMessageSeverity("error");
		} finally {
			setUploading(false);
			setOpenMessage(true);
		}
	}

	// Funções para o modal de edição
	function handleOpenEditModal(dicente) {
		setSelectedDicente(dicente);
		setLoadingEdit(true);
		setOpenEditModal(true);

		// Carregar dados do TCC atual
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
	}

	async function loadTccData(matricula) {
		try {
			const tcc = trabalhosPorMatricula[matricula];
			const orientador = getOrientadorAtual(matricula);

			// Carregar dados da banca de defesa se existir TCC
			let membroBanca1 = "";
			let membroBanca2 = "";
			let dataHoraDefesa = null;

			if (tcc?.id) {
				try {
					// Carregar defesas - agora sempre retorna um array (vazio ou com dados)
					const responseDefesas = await axiosInstance.get(
						`/defesas/tcc/${tcc.id}`,
					);
					const defesas =
						responseDefesas.data?.defesas ||
						responseDefesas.defesas ||
						[];

					// Filtrar defesas da fase atual e que não são orientador
					const defesasFaseAtual = defesas.filter(
						(defesa) =>
							parseInt(defesa.fase) === parseInt(tcc.fase) &&
							!defesa.orientador,
					);

					setDefesasAtual(defesasFaseAtual);

					// Carregar convites de banca
					const responseConvites = await axiosInstance.get(
						"/convites",
						{
							params: { id_tcc: tcc.id },
						},
					);
					const todosConvitesBanca = (
						responseConvites.data?.convites ||
						responseConvites.convites ||
						[]
					).filter((c) => c.orientacao === false);

					// Separar convites por fase
					const convitesFase1 = todosConvitesBanca.filter(
						(c) => parseInt(c.fase) === 1,
					);
					const convitesFase2 = todosConvitesBanca.filter(
						(c) => parseInt(c.fase) === 2,
					);

					// Convites da fase atual (para manter compatibilidade)
					const convitesFaseAtual = todosConvitesBanca.filter(
						(c) => parseInt(c.fase) === parseInt(tcc.fase),
					);

					setConvitesBancaAtual(convitesFaseAtual);
					setConvitesBancaFase1(convitesFase1);
					setConvitesBancaFase2(convitesFase2);

					// Pegar os dois primeiros membros da banca
					if (defesasFaseAtual.length > 0) {
						membroBanca1 = defesasFaseAtual[0]?.membro_banca || "";
						// Pegar data e hora da primeira defesa (assumindo que todas têm a mesma data/hora)
						if (defesasFaseAtual[0]?.data_defesa) {
							dataHoraDefesa = new Date(
								defesasFaseAtual[0].data_defesa,
							);
						}
					}
					if (defesasFaseAtual.length > 1) {
						membroBanca2 = defesasFaseAtual[1]?.membro_banca || "";
					}
				} catch (error) {
					console.log("Erro ao carregar defesas ou convites:", error);
					setDefesasAtual([]);
					setConvitesBancaAtual([]);
					setConvitesBancaFase1([]);
					setConvitesBancaFase2([]);
				}
			}

			setEditData({
				orientador: isOrientadorView
					? usuario?.codigo || usuario?.id || orientador?.codigo || ""
					: orientador?.codigo || "",
				tema: tcc?.tema || "",
				titulo: tcc?.titulo || "",
				resumo: tcc?.resumo || "",
				seminarioAndamento: tcc?.seminario_andamento || "",
				etapa: tcc?.etapa || 0,
				membroBanca1,
				membroBanca2,
				dataHoraDefesa,
			});
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
	}

	async function gerenciarBancaDefesa(idTcc) {
		try {
			// Membros selecionados atualmente
			const membrosNovos = [
				editData.membroBanca1,
				editData.membroBanca2,
			].filter(Boolean);

			// Membros que já existem na defesa
			const membrosExistentes = defesasAtual.map(
				(defesa) => defesa.membro_banca,
			);

			// Identificar alterações (quando um membro específico é trocado por outro)
			const alteracoes = [];
			for (const membroExistente of membrosExistentes) {
				if (
					!membrosNovos.includes(membroExistente) &&
					membrosNovos.length > 0
				) {
					// Verificar se há um novo membro que substitui este
					const membroSubstituto = membrosNovos.find(
						(novoMembro) => !membrosExistentes.includes(novoMembro),
					);

					if (membroSubstituto) {
						// Usar os convites da fase correta
						const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
						const faseAtual = parseInt(tccAtual?.fase);
						const convitesCorretos = faseAtual === 2 ? convitesBancaFase2 : convitesBancaAtual;

						const conviteAntigo = convitesCorretos.find(
							(c) => c.codigo_docente === membroExistente,
						);

						if (conviteAntigo && conviteAntigo.aceito === true) {
							alteracoes.push({
								membro_antigo: membroExistente,
								membro_novo: membroSubstituto,
							});
						}
					}
				}
			}

			// Fazer chamada única para a API transacional
			const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
			const faseAtual = parseInt(tccAtual?.fase);
			const convitesCorretos = faseAtual === 2 ? convitesBancaFase2 : convitesBancaAtual;

			const payload = {
				id_tcc: idTcc,
				fase: parseInt(tccAtual?.fase || fase),
				membros_novos: membrosNovos,
				membros_existentes: membrosExistentes,
				convites_banca_existentes: convitesCorretos,
				alteracoes: alteracoes,
				orientador_codigo: editData.orientador, // Incluir código do orientador
				data_hora_defesa: editData.dataHoraDefesa, // Incluir data e hora da defesa
			};

			const response = await axiosInstance.post(
				"/defesas/gerenciar-banca",
				payload,
			);
		} catch (error) {
			console.log("Erro ao gerenciar banca de defesa:", error);
			throw new Error("Falha ao atualizar banca de defesa e convites");
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

			// Validação: se data da defesa foi selecionada, ambos os membros da banca devem estar selecionados
			const etapaAtualSave = parseInt(editData.etapa);
			const tccAtualSave = trabalhosPorMatricula[selectedDicente.matricula];
			const faseAtualSave = parseInt(tccAtualSave?.fase);
						const edicaoHabilitadaSave = (etapaAtualSave === 5 && faseAtualSave === 1) ||
										  (etapaAtualSave === 8 && faseAtualSave === 2);
			const precisaBancaSave = edicaoHabilitadaSave;

			if (precisaBancaSave && editData.dataHoraDefesa) {
				if (!editData.membroBanca1 || !editData.membroBanca2) {
					setMessageText(
						"Para definir uma data de defesa, é necessário selecionar os 2 membros da banca!",
					);
					setMessageSeverity("error");
					setOpenMessage(true);
					setLoadingEdit(false);
					return;
				}
			}

			// Atualizar TCC
			const tccData = {
				tema: editData.tema,
				titulo: editData.titulo,
				resumo: editData.resumo,
				etapa: parseInt(editData.etapa),
			};

			// Adicionar seminário de andamento se for fase 2
			if (parseInt(tcc.fase) === 2) {
				tccData.seminario_andamento = editData.seminarioAndamento;
			}

			await axiosInstance.put(`/trabalho-conclusao/${tcc.id}`, tccData);

			// Gerenciar orientação e convites
			const orientadorAtual = getOrientadorAtual(
				selectedDicente.matricula,
			);
			const orientacaoAtual = getOrientacaoAtual(
				selectedDicente.matricula,
			);
			const codigoOrientadorAtual = orientadorAtual?.codigo || "";

			// No modo orientador, não permitir alteração do orientador
			if (!isOrientadorView && editData.orientador !== codigoOrientadorAtual) {
				// Buscar convites de orientação existentes para este TCC
				const responseConvites = await axiosInstance.get("/convites", {
					params: { id_tcc: tcc.id },
				});
				const convitesOrientacao = (
					responseConvites.data?.convites ||
					responseConvites.convites ||
					[]
				).filter(
					(c) =>
						c.orientacao === true &&
						parseInt(c.fase) === parseInt(tcc.fase),
				);

				// Se havia orientador anterior, deletar a orientação
				if (orientacaoAtual && orientacaoAtual.id) {
					await axiosInstance.delete(
						`/orientacoes/${orientacaoAtual.id}`,
					);
				}

				// Gerenciar convites conforme as regras especificadas
				if (editData.orientador) {
					const dataAtual = new Date().toISOString();

					// Verificar convites existentes para o novo orientador
					const conviteNovoOrientador = convitesOrientacao.find(
						(c) => c.codigo_docente === editData.orientador,
					);

					// Verificar convites existentes para o orientador atual (se houver)
					const conviteOrientadorAtual = codigoOrientadorAtual
						? convitesOrientacao.find(
								(c) =>
									c.codigo_docente === codigoOrientadorAtual,
						  )
						: null;

					if (!codigoOrientadorAtual) {
						// Casos 1 e 2: Não há orientação atual
						if (
							!conviteNovoOrientador ||
							conviteNovoOrientador.aceito === false
						) {
							// Caso 1: Não há convite OU Caso 2: Convite recusado - criar novo convite aceito
							const mensagemPadrao =
								"Informado pelo professor do CCR";

							const convitePayload = {
								id_tcc: tcc.id,
								codigo_docente: editData.orientador,
								fase: parseInt(tcc.fase),
								data_envio: dataAtual,
								mensagem_envio: mensagemPadrao,
								data_feedback: dataAtual,
								aceito: true,
								mensagem_feedback: mensagemPadrao,
								orientacao: true,
							};

							await axiosInstance.post("/convites", {
								formData: convitePayload,
							});
						}
					} else {
						// Caso 3: Há orientação atual e mudando para novo orientador
						if (editData.orientador !== codigoOrientadorAtual) {
							const mensagemAlteracao = `Alteração de orientação informada pelo professor do CCR de ${codigoOrientadorAtual} para ${editData.orientador}`;

							// Se há convite do orientador atual, deletá-lo
							if (conviteOrientadorAtual) {
								await axiosInstance.delete(
									`/convites/${tcc.id}/${codigoOrientadorAtual}/${tcc.fase}`,
								);
							}

							// Criar novo convite para o novo orientador
							const convitePayload = {
								id_tcc: tcc.id,
								codigo_docente: editData.orientador,
								fase: parseInt(tcc.fase),
								data_envio: dataAtual,
								mensagem_envio: mensagemAlteracao,
								data_feedback: dataAtual,
								aceito: true,
								mensagem_feedback: mensagemAlteracao,
								orientacao: true,
							};

							await axiosInstance.post("/convites", {
								formData: convitePayload,
							});
						}
					}

					// Criar nova orientação
					const orientacaoPayload = {
						codigo_docente: editData.orientador,
						id_tcc: tcc.id,
						orientador: true,
					};
					await axiosInstance.post("/orientacoes", {
						formData: orientacaoPayload,
					});
				}
			}

			// Gerenciar banca de defesa se estivermos nas etapas corretas
			const etapaAtualBanca = parseInt(editData.etapa);
			const faseAtualBanca = parseInt(tcc?.fase);
						const edicaoHabilitadaBanca = (etapaAtualBanca === 5 && faseAtualBanca === 1) ||
										   (etapaAtualBanca === 8 && faseAtualBanca === 2);
			const precisaBancaBanca = edicaoHabilitadaBanca; // Etapas onde é possível editar banca

			if (precisaBancaBanca) {
				await gerenciarBancaDefesa(tcc.id);
			}

			setMessageText("Dados salvos com sucesso!");
			setMessageSeverity("success");

			// Atualizar dados na tela
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

	// Filtrar apenas docentes que podem orientar no curso selecionado
	const docentesDisponiveis = cursoSelecionado
		? orientadoresCurso.map((oc) => oc.docente)
		: [];

	// Estado para docentes de banca
	const [docentesBanca, setDocentesBanca] = useState([]);

	// Lista de dicentes a exibir
	const todosOsFiltrosSelecionados = isOrientadorView
		? cursoSelecionado && ano && semestre
		: cursoSelecionado && ano && semestre && fase;
	const dicentesFiltrados = todosOsFiltrosSelecionados ? dicentes : [];

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
								const temConviteOrientacao = Array.isArray(
									convites,
								)
									? convites.some(
											(c) => c.orientacao === true,
									  )
									: false;
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
							} else if (etapa === 5 || etapa === 7 ||
									(etapa === 8 && parseInt(tcc?.fase) === 2)) {
								const convitesBanca = Array.isArray(convites)
									? convites.filter(
											(c) => c.orientacao === false,
									  )
									: [];
								// Considera a fase corrente do TCC para validar convites corretos
								const faseAtualTcc =
									tcc?.fase != null
										? parseInt(tcc.fase)
										: null;
								const temConviteBancaFase = convitesBanca.some(
									(c) =>
										faseAtualTcc == null
											? true
											: fase
											? parseInt(c.fase) === faseAtualTcc
											: true, // Se fase não estiver filtrada, aceita qualquer fase
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
								// Entre as etapas 1 e 4, sucesso se já tem orientador definido
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
								// Para etapas 6, 8 e 9, sucesso se existem convites de banca enviados na fase corrente
								const convitesBanca = Array.isArray(convites)
									? convites.filter(
											(c) => c.orientacao === false,
									  )
									: [];
								const faseAtualTcc =
									tcc?.fase != null
										? parseInt(tcc.fase)
										: null;
								const temConviteBancaFase = convitesBanca.some(
									(c) =>
										faseAtualTcc == null
											? true
											: fase
											? parseInt(c.fase) === faseAtualTcc
											: true, // Se fase não estiver filtrada, aceita qualquer fase
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
								? defesas.filter(
										(d) =>
											fase
												? parseInt(d.fase) === faseAtual
												: true, // Se fase não estiver filtrada, aceita todas as defesas
								  )
								: [];
							const notas = defesasFase
								.map((d) => d.avaliacao)
								.filter((v) => v !== null && v !== undefined);
							const media =
								notas.length > 0
									? notas.reduce((a, b) => a + Number(b), 0) /
									  notas.length
									: null;

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

	// Gerar listas únicas a partir das ofertas TCC
	const anosUnicos = [
		...new Set(
			ofertasTcc
				.filter(
					(oferta) =>
						oferta &&
						typeof oferta.ano === "number" &&
						oferta.ano > 0,
				)
				.map((oferta) => oferta.ano),
		),
	].sort((a, b) => a - b);

	const semestresUnicos = [
		...new Set(
			ofertasTcc
				.filter(
					(oferta) =>
						oferta &&
						typeof oferta.semestre === "number" &&
						oferta.semestre > 0,
				)
				.map((oferta) => oferta.semestre),
		),
	].sort((a, b) => a - b);

	const fasesUnicas = [
		...new Set(
			ofertasTcc
				.filter(
					(oferta) =>
						oferta &&
						oferta.fase !== null &&
						oferta.fase !== undefined,
				)
				.map((oferta) => oferta.fase.toString()),
		),
	]
		.filter((fase) => fase && fase !== "undefined" && fase !== "null")
		.sort((a, b) => parseInt(a) - parseInt(b));

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
							<Typography variant="body2" color="text.secondary">
								Selecione um arquivo PDF de lista de presença
								para importar dicentes automaticamente. O
								arquivo deve conter dados no formato: NOME
								seguido da MATRÍCULA. Os dicentes serão
								vinculados ao curso, ano/semestre e fase
								selecionados abaixo.
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
									sx={{ p: 2, bgcolor: "background.default" }}
								>
									<Typography variant="body2">
										<strong>Arquivo selecionado:</strong>{" "}
										{uploadFile.name}
									</Typography>
									<Typography variant="body2">
										<strong>Tamanho:</strong>{" "}
										{(
											uploadFile.size /
											1024 /
											1024
										).toFixed(2)}{" "}
										MB
									</Typography>
								</Paper>
							)}

							{uploading && (
								<Box>
									<Typography variant="body2" sx={{ mb: 1 }}>
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
										uploadResults.detalhes.length > 0 && (
											<Box
												sx={{
													maxHeight: 200,
													overflow: "auto",
												}}
											>
												{uploadResults.detalhes
													.slice(0, 10)
													.map((detalhe, index) => (
														<Box
															key={index}
															sx={{
																mb: 0.5,
																display: "flex",
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
																- {detalhe.nome}
																:
															</Typography>
															<Chip
																label={
																	detalhe.status ===
																	"dicente_e_orientacao_inseridos"
																		? "Novo dicente + orientação"
																		: detalhe.status ===
																		  "orientacao_inserida"
																		? "Orientação criada"
																		: detalhe.status ===
																		  "dicente_inserido_orientacao_ja_existe"
																		? "Novo dicente (orientação já existe)"
																		: detalhe.status ===
																		  "orientacao_ja_existe"
																		? "Orientação já existe"
																		: detalhe.status ===
																		  "dicente_ja_existe"
																		? "Dicente já existe"
																		: detalhe.status ===
																		  "inserido"
																		? "Inserido"
																		: detalhe.status ===
																		  "já_existe"
																		? "Já existe"
																		: detalhe.status
																}
																size="small"
																color={
																	detalhe.status ===
																	"dicente_e_orientacao_inseridos"
																		? "success"
																		: detalhe.status ===
																		  "orientacao_inserida"
																		? "success"
																		: detalhe.status ===
																		  "dicente_inserido_orientacao_ja_existe"
																		? "info"
																		: detalhe.status ===
																		  "orientacao_ja_existe"
																		? "warning"
																		: detalhe.status ===
																		  "dicente_ja_existe"
																		? "warning"
																		: detalhe.status ===
																		  "inserido"
																		? "success"
																		: detalhe.status ===
																		  "já_existe"
																		? "warning"
																		: "error"
																}
															/>
														</Box>
													))}
												{uploadResults.detalhes.length >
													10 && (
													<Typography
														variant="body2"
														color="text.secondary"
													>
														... e mais{" "}
														{uploadResults.detalhes
															.length - 10}{" "}
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
													const orientadorAtual = docentesDisponiveis.find(
														(docente) => docente.codigo === editData.orientador
													);
													return orientadorAtual?.nome || usuario?.nome || "Orientador não definido";
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
												<InputLabel>Orientador</InputLabel>
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
																key={docente.codigo}
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
													// Usar a fase do TCC específico, não a fase do filtro
													const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
													const faseTcc = tccAtual?.fase;
													const maxEtapa =
														parseInt(faseTcc) === 2
															? 9
															: 6;
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
									const etapaAtual = parseInt(editData.etapa);
									const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
									const faseAtual = parseInt(tccAtual?.fase);

									// Verificar se há histórico de convites de banca
									const temHistoricoConvites = convitesBancaFase1.length > 0 ||
																convitesBancaFase2.length > 0 ||
																convitesBancaAtual.length > 0;

									// Verificar se há histórico de defesas
									const temHistoricoDefesas = defesasAtual.length > 0;

									// Exibir se etapa >= 5 OU se houver histórico
									return etapaAtual >= 5 || temHistoricoConvites || temHistoricoDefesas;
								})() && (
									<Paper
										sx={{
											p: 2,
											bgcolor: "background.default",
										}}
									>
										<Typography variant="h6" gutterBottom>
											{(() => {
												const etapaAtual = parseInt(editData.etapa);
												return etapaAtual === 8 ? "Banca de Defesa de TCC" : "Banca de Defesa de Projeto";
											})()}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
											gutterBottom
										>
											{(() => {
												const etapaAtual = parseInt(editData.etapa);
												const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
												const faseAtual = parseInt(tccAtual?.fase);
												const tipoDefesa = etapaAtual === 8 ? "defesa de TCC" : "defesa de projeto";

												// Determinar se a edição está habilitada
												const edicaoHabilitada = (etapaAtual === 5 && faseAtual === 1) ||
																		(etapaAtual === 8 && faseAtual === 2);

												if (edicaoHabilitada) {
													return `Selecione 2 docentes para compor a banca de ${tipoDefesa} (além do orientador) e defina a data/hora da defesa`;
												} else {
													return `Visualização do histórico da banca de ${tipoDefesa}. Campos de seleção disponíveis apenas na etapa ${faseAtual === 1 ? '5' : '8'}.`;
												}
											})()}
										</Typography>

										{/* Data e Hora da Defesa - apenas para etapas 5 e 8 */}
										{(() => {
											const etapaAtual = parseInt(editData.etapa);
											const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
											const faseAtual = parseInt(tccAtual?.fase);
											const mostrarCamposSelecao = (etapaAtual === 5 && faseAtual === 1) ||
																		(etapaAtual === 8 && faseAtual === 2);

											return mostrarCamposSelecao;
										})() && (
										<Box sx={{ mb: 3 }}>
											<LocalizationProvider
												dateAdapter={AdapterDateFns}
												adapterLocale={ptBR}
											>
												<DateTimePicker
													label="Data e Hora da Defesa"
													value={
														editData.dataHoraDefesa
													}
													onChange={(newValue) => {
														const etapaAtual = parseInt(editData.etapa);
														const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
														const faseAtual = parseInt(tccAtual?.fase);
														const edicaoHabilitada = (etapaAtual === 5 && faseAtual === 1) ||
																				(etapaAtual === 8 && faseAtual === 2);

														if (edicaoHabilitada) {
															handleEditDataChange("dataHoraDefesa", newValue);
														}
													}}
													disabled={(() => {
														const etapaAtual = parseInt(editData.etapa);
														const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
														const faseAtual = parseInt(tccAtual?.fase);
														return !((etapaAtual === 5 && faseAtual === 1) || (etapaAtual === 8 && faseAtual === 2));
													})()}
													renderInput={(params) => (
														<TextField
															{...params}
															fullWidth
															helperText={(() => {
																const etapaAtual = parseInt(editData.etapa);
																const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
																const faseAtual = parseInt(tccAtual?.fase);
																const edicaoHabilitada = (etapaAtual === 5 && faseAtual === 1) ||
																						(etapaAtual === 8 && faseAtual === 2);

																if (!edicaoHabilitada) {
																	return `Edição disponível apenas na etapa ${faseAtual === 1 ? '5' : '8'}`;
																}

																return editData.dataHoraDefesa &&
																	(!editData.membroBanca1 || !editData.membroBanca2)
																	? "⚠️ Selecione os 2 membros da banca para definir a data da defesa"
																	: "Selecione a data e horário para a defesa";
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
										)}


										{/* Campos de seleção de membros da banca - apenas para etapas 5 e 8 */}
										{(() => {
											const etapaAtual = parseInt(editData.etapa);
											const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
											const faseAtual = parseInt(tccAtual?.fase);
											const mostrarCamposSelecao = (etapaAtual === 5 && faseAtual === 1) ||
																		(etapaAtual === 8 && faseAtual === 2);

											return mostrarCamposSelecao;
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
														{(() => {
															const etapaAtual = parseInt(editData.etapa);
															const tipoDefesa = etapaAtual === 8 ? "TCC" : "Projeto";
															return `1º Membro da Banca de ${tipoDefesa}${editData.dataHoraDefesa ? " *" : ""}`;
														})()}
													</InputLabel>
													<Select
														value={
															editData.membroBanca1
														}
														onChange={(e) => {
															const etapaAtual = parseInt(editData.etapa);
															const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
															const faseAtual = parseInt(tccAtual?.fase);
															const edicaoHabilitada = (etapaAtual === 5 && faseAtual === 1) ||
																					(etapaAtual === 8 && faseAtual === 2);

															if (edicaoHabilitada) {
																handleEditDataChange("membroBanca1", e.target.value);
															}
														}}
														disabled={(() => {
															const etapaAtual = parseInt(editData.etapa);
															const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
															const faseAtual = parseInt(tccAtual?.fase);
															return !((etapaAtual === 5 && faseAtual === 1) || (etapaAtual === 8 && faseAtual === 2));
														})()}
														label={(() => {
															const etapaAtual = parseInt(editData.etapa);
															const tipoDefesa = etapaAtual === 8 ? "TCC" : "Projeto";
															return `1º Membro da Banca de ${tipoDefesa}${editData.dataHoraDefesa ? " *" : ""}`;
														})()}
														displayEmpty
													>
														<MenuItem value=""></MenuItem>
														{docentesBanca
															.filter(
																(item) =>
																	item.docente
																		?.codigo !==
																		editData.orientador &&
																	item.docente
																		?.codigo !==
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
														{(() => {
															const etapaAtual = parseInt(editData.etapa);
															const tipoDefesa = etapaAtual === 8 ? "TCC" : "Projeto";
															return `2º Membro da Banca de ${tipoDefesa}${editData.dataHoraDefesa ? " *" : ""}`;
														})()}
													</InputLabel>
													<Select
														value={
															editData.membroBanca2
														}
														onChange={(e) => {
															const etapaAtual = parseInt(editData.etapa);
															const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
															const faseAtual = parseInt(tccAtual?.fase);
															const edicaoHabilitada = (etapaAtual === 5 && faseAtual === 1) ||
																					(etapaAtual === 8 && faseAtual === 2);

															if (edicaoHabilitada) {
																handleEditDataChange("membroBanca2", e.target.value);
															}
														}}
														disabled={(() => {
															const etapaAtual = parseInt(editData.etapa);
															const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
															const faseAtual = parseInt(tccAtual?.fase);
															return !((etapaAtual === 5 && faseAtual === 1) || (etapaAtual === 8 && faseAtual === 2));
														})()}
														label={(() => {
															const etapaAtual = parseInt(editData.etapa);
															const tipoDefesa = etapaAtual === 8 ? "TCC" : "Projeto";
															return `2º Membro da Banca de ${tipoDefesa}${editData.dataHoraDefesa ? " *" : ""}`;
														})()}
														displayEmpty
													>
														<MenuItem value=""></MenuItem>
														{docentesBanca
															.filter(
																(item) =>
																	item.docente
																		?.codigo !==
																		editData.orientador &&
																	item.docente
																		?.codigo !==
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
											const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
											const faseAtual = parseInt(tccAtual?.fase);
											const etapaAtual = parseInt(editData.etapa);

											return (
												<>
													{/* Convites de Fase 1 - sempre somente leitura */}
													{convitesBancaFase1.length > 0 && (
														<Box
															sx={{
																mb: 2,
																p: 1,
																bgcolor: "grey.100",
																borderRadius: 1,
															}}
														>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																<strong>
																	Banca de Defesa de Projeto (histórico):
																</strong>
															</Typography>
															{convitesBancaFase1.map(
																(convite, index) => (
																	<Typography
																		key={index}
																		variant="body2"
																		color="text.secondary"
																	>
																		•{" "}
																		{docentesDisponiveis.find(
																			(d) =>
																				d.codigo ===
																				convite.codigo_docente,
																		)?.nome ||
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
													{faseAtual === 2 && convitesBancaFase2.length > 0 && (
														<Box
															sx={{
																mb: 2,
																p: 1,
																bgcolor: etapaAtual === 8 ? "info.light" : "grey.100",
																borderRadius: 1,
															}}
														>
															<Typography
																variant="body2"
																color={etapaAtual === 8 ? "info.contrastText" : "text.secondary"}
															>
																<strong>
																	{etapaAtual === 8 ? "Banca de Defesa de TCC:" : "Banca de Defesa de TCC (histórico):"}
																</strong>
															</Typography>
															{convitesBancaFase2.map(
																(convite, index) => (
																	<Typography
																		key={index}
																		variant="body2"
																		color={etapaAtual === 8 ? "info.contrastText" : "text.secondary"}
																	>
																		•{" "}
																		{docentesDisponiveis.find(
																			(d) =>
																				d.codigo ===
																				convite.codigo_docente,
																		)?.nome ||
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
													{faseAtual === 1 && convitesBancaAtual.length > 0 && (
														<Box
															sx={{
																mb: 2,
																p: 1,
																bgcolor: "info.light",
																borderRadius: 1,
															}}
														>
															<Typography
																variant="body2"
																color="info.contrastText"
															>
																<strong>
																	Banca de Defesa de Projeto:
																</strong>
															</Typography>
															{convitesBancaAtual.map(
																(convite, index) => (
																	<Typography
																		key={index}
																		variant="body2"
																		color="info.contrastText"
																	>
																		•{" "}
																		{docentesDisponiveis.find(
																			(d) =>
																				d.codigo ===
																				convite.codigo_docente,
																		)?.nome ||
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
									const tccAtual = trabalhosPorMatricula[selectedDicente?.matricula];
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
