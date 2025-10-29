import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";
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
import { useTheme } from "@mui/material/styles";
import FiltrosPesquisa from "./FiltrosPesquisa";

function getAnoSemestreAtual() {
	const data = new Date();
	const ano = data.getFullYear();
	const semestre = data.getMonth() < 6 ? 1 : 2;
	return { ano, semestre };
}

export default function AvaliarDefesasOrientador() {
	const { usuario } = useAuth();
	const theme = useTheme();

	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(getAnoSemestreAtual().ano);
	const [semestre, setSemestre] = useState(getAnoSemestreAtual().semestre);
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

	useEffect(() => {
		getCursosOrientador();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
			const response = await axiosInstance.get(
				`/orientadores/docente/${codigoDocente}`,
			);
			const cursosOrientador = response.orientacoes || [];
			const cursosExtraidos = cursosOrientador.map(
				(orientacao) => orientacao.curso,
			);
			setCursos(cursosExtraidos);
			if (cursosExtraidos.length === 1) {
				setCursoSelecionado(cursosExtraidos[0].id);
			}
		} catch (error) {
			setCursos([]);
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
			const respOrientacoes = await axiosInstance.get("/orientacoes", {
				params: paramsOrientacoes,
			});
			const orientacoesFiltradas = (respOrientacoes.orientacoes || [])
				.filter(
					(o) =>
						o.TrabalhoConclusao &&
						o.TrabalhoConclusao.Curso?.id ===
							parseInt(cursoSelecionado) &&
						o.TrabalhoConclusao.ano === parseInt(ano) &&
						o.TrabalhoConclusao.semestre === parseInt(semestre),
				)
				.map((o) => o.TrabalhoConclusao);
			setOrientacoes(orientacoesFiltradas);

			// Buscar defesas para o período e filtrar por TCCs do orientador
			const respDefesas = await axiosInstance.get("/defesas", {
				params: { ano, semestre, fase },
			});
			const idsTcc = new Set(orientacoesFiltradas.map((t) => t.id));
			const defesasFiltradas = (respDefesas.defesas || [])
				.filter((d) => idsTcc.has(d.id_tcc))
				.filter((d) => !fase || parseInt(d.fase) === parseInt(fase));
			setDefesas(defesasFiltradas);

			// Inicializar estados de edição conforme dados atuais
			const novoAvals = {};
			const novoComentarios = {};
			defesasFiltradas.forEach((d) => {
				novoAvals[`${d.id_tcc}|${d.membro_banca}|${d.fase}`] =
					d.avaliacao !== null && d.avaliacao !== undefined
						? String(d.avaliacao)
						: "";
			});
			setAvaliacoesEdicao(novoAvals);

			// Inicializar comentários de TCC (apenas fase 2)
			orientacoesFiltradas.forEach((tcc) => {
				if (tcc.fase === 2) {
					novoComentarios[tcc.id] = tcc.comentarios_tcc || "";
				}
			});
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
		const map = new Map();
		orientacoes.forEach((t) => map.set(t.id, t));
		return map;
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
		const idTcc = chaveUnica.includes("_")
			? chaveUnica.split("_")[0]
			: chaveUnica;
		const prefix = `${idTcc}|`;
		const snapshot = {};
		Object.entries(avaliacoesEdicao).forEach(([k, v]) => {
			if (k.startsWith(prefix)) {
				// Se for modo "Todas" as fases, filtra apenas pela fase específica do card
				if (fase === "" || fase === null || fase === undefined) {
					const [, , faseKey] = k.split("|");
					const faseCard = chaveUnica.includes("_")
						? chaveUnica.split("_")[1]
						: null;
					if (faseCard && faseKey === faseCard) {
						snapshot[k] = v;
					}
				} else {
					snapshot[k] = v;
				}
			}
		});
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
		const idTcc = chaveUnica.includes("_")
			? chaveUnica.split("_")[0]
			: chaveUnica;
		const prefix = `${idTcc}|`;

		// Verifica se há notas registradas para este TCC
		const temNotasRegistradas = Object.keys(avaliacoesEdicao).some((k) => {
			if (k.startsWith(prefix)) {
				const [, , faseKey] = k.split("|");
				// Se for modo "Todas" as fases, verifica apenas pela fase específica do card
				if (fase === "" || fase === null || fase === undefined) {
					const faseCard = chaveUnica.includes("_")
						? chaveUnica.split("_")[1]
						: null;
					return faseCard && faseKey === faseCard;
				}
				return true;
			}
			return false;
		});

		if (temNotasRegistradas && Object.keys(snapshot).length > 0) {
			// Se há notas registradas e backup, restaura os valores
			setAvaliacoesEdicao((prev) => {
				const novo = { ...prev };
				Object.keys(novo).forEach((k) => {
					if (k.startsWith(prefix)) {
						// Se for modo "Todas" as fases, restaura apenas pela fase específica do card
						if (
							fase === "" ||
							fase === null ||
							fase === undefined
						) {
							const [, , faseKey] = k.split("|");
							const faseCard = chaveUnica.includes("_")
								? chaveUnica.split("_")[1]
								: null;
							if (
								faseCard &&
								faseKey === faseCard &&
								snapshot.hasOwnProperty(k)
							) {
								novo[k] = snapshot[k];
							}
						} else if (snapshot.hasOwnProperty(k)) {
							novo[k] = snapshot[k];
						}
					}
				});
				return novo;
			});
		} else {
			// Se não há notas registradas, apenas limpa os campos
			setAvaliacoesEdicao((prev) => {
				const novo = { ...prev };
				Object.keys(novo).forEach((k) => {
					if (k.startsWith(prefix)) {
						// Se for modo "Todas" as fases, limpa apenas pela fase específica do card
						if (
							fase === "" ||
							fase === null ||
							fase === undefined
						) {
							const [, , faseKey] = k.split("|");
							const faseCard = chaveUnica.includes("_")
								? chaveUnica.split("_")[1]
								: null;
							if (faseCard && faseKey === faseCard) {
								novo[k] = "";
							}
						} else {
							novo[k] = "";
						}
					}
				});
				return novo;
			});
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
		const resultado = [];

		if (fase === "" || fase === null || fase === undefined) {
			// Quando "Todas" as fases estão selecionadas, criar um card para cada defesa/fase
			const defesasPorTccEFase = new Map();
			defesas.forEach((defesa) => {
				const chave = `${defesa.id_tcc}_${defesa.fase}`;
				if (!defesasPorTccEFase.has(chave)) {
					defesasPorTccEFase.set(chave, []);
				}
				defesasPorTccEFase.get(chave).push(defesa);
			});

			defesasPorTccEFase.forEach((defesasTccFase, chave) => {
				const [idTcc, faseAtual] = chave.split("_");
				const tcc = mapaTcc.get(parseInt(idTcc));
				if (!tcc) return;

				const notas = defesasTccFase
					.map((d) => {
						const key = `${d.id_tcc}|${d.membro_banca}|${d.fase}`;
						const v = avaliacoesEdicao[key];
						const num =
							v === "" || v === undefined || v === null
								? null
								: Number(v);
						return Number.isFinite(num) ? num : null;
					})
					.filter((n) => n !== null);

				const media =
					notas.length > 0
						? notas.reduce((s, n) => s + n, 0) / notas.length
						: null;
				const avaliacoesCompletas =
					notas.length === defesasTccFase.length &&
					defesasTccFase.length > 0;
				const aprovadoAutomatico =
					avaliacoesCompletas &&
					media >= 6 &&
					parseInt(faseAtual) === 1;

				const dataDefesaStr = defesasTccFase[0]?.data_defesa
					? new Date(defesasTccFase[0].data_defesa).toLocaleString(
							"pt-BR",
						)
					: "N/A";

				const membros = defesasTccFase
					.map((d) => {
						const chave = `${d.id_tcc}|${d.membro_banca}|${d.fase}`;
						return {
							chave,
							idTcc: d.id_tcc,
							membroBanca: d.membro_banca,
							nomeMembroBanca:
								d.membroBanca?.nome || d.membro_banca,
							valorAvaliacao: avaliacoesEdicao[chave] ?? "",
							ehOrientador: d.orientador || false,
							salvo:
								d.avaliacao !== null &&
								d.avaliacao !== undefined,
						};
					})
					.sort((a, b) => {
						if (a.ehOrientador !== b.ehOrientador) {
							return a.ehOrientador ? -1 : 1;
						}
						return (a.nomeMembroBanca || "").localeCompare(
							b.nomeMembroBanca || "",
						);
					});

				resultado.push({
					idTcc: parseInt(idTcc),
					chaveUnica: chave, // Identificador único para cada card
					nomeDicente: tcc.Dicente?.nome || "N/A",
					matriculaDicente: tcc.Dicente?.matricula || "N/A",
					tituloTcc: tcc.titulo || "N/A",
					nomeCurso: tcc.Curso?.nome || "N/A",
					fase: parseInt(faseAtual),
					media,
					avaliacoesCompletas,
					aprovadoAutomatico,
					notas,
					dataDefesa: dataDefesaStr,
					membros,
				});
			});
		} else {
			// Lógica original: agrupar por TCC quando uma fase específica está selecionada
			const defesasPorTcc = new Map();
			defesas.forEach((defesa) => {
				if (!defesasPorTcc.has(defesa.id_tcc)) {
					defesasPorTcc.set(defesa.id_tcc, []);
				}
				defesasPorTcc.get(defesa.id_tcc).push(defesa);
			});

			defesasPorTcc.forEach((defesasTcc, idTcc) => {
				const tcc = mapaTcc.get(idTcc);
				if (!tcc) return;

				const notas = defesasTcc
					.map((d) => {
						const key = `${d.id_tcc}|${d.membro_banca}|${d.fase}`;
						const v = avaliacoesEdicao[key];
						const num =
							v === "" || v === undefined || v === null
								? null
								: Number(v);
						return Number.isFinite(num) ? num : null;
					})
					.filter((n) => n !== null);

				const media =
					notas.length > 0
						? notas.reduce((s, n) => s + n, 0) / notas.length
						: null;
				const avaliacoesCompletas =
					notas.length === defesasTcc.length && defesasTcc.length > 0;
				const aprovadoAutomatico =
					avaliacoesCompletas &&
					media >= 6 &&
					defesasTcc[0]?.fase === 1;

				const dataDefesaStr = defesasTcc[0]?.data_defesa
					? new Date(defesasTcc[0].data_defesa).toLocaleString(
							"pt-BR",
						)
					: "N/A";

				const membros = defesasTcc
					.map((d) => {
						const chave = `${d.id_tcc}|${d.membro_banca}|${d.fase}`;
						return {
							chave,
							idTcc: d.id_tcc,
							membroBanca: d.membro_banca,
							nomeMembroBanca:
								d.membroBanca?.nome || d.membro_banca,
							valorAvaliacao: avaliacoesEdicao[chave] ?? "",
							ehOrientador: d.orientador || false,
							salvo:
								d.avaliacao !== null &&
								d.avaliacao !== undefined,
						};
					})
					.sort((a, b) => {
						if (a.ehOrientador !== b.ehOrientador) {
							return a.ehOrientador ? -1 : 1;
						}
						return (a.nomeMembroBanca || "").localeCompare(
							b.nomeMembroBanca || "",
						);
					});

				resultado.push({
					idTcc,
					chaveUnica: `${idTcc}`, // Para compatibilidade
					nomeDicente: tcc.Dicente?.nome || "N/A",
					matriculaDicente: tcc.Dicente?.matricula || "N/A",
					tituloTcc: tcc.titulo || "N/A",
					nomeCurso: tcc.Curso?.nome || "N/A",
					fase: defesasTcc[0]?.fase,
					media,
					avaliacoesCompletas,
					aprovadoAutomatico,
					notas,
					dataDefesa: dataDefesaStr,
					membros,
				});
			});
		}

		return resultado.sort((a, b) => {
			// Primeiro ordena por nome do dicente, depois por fase se for o mesmo dicente
			const nomeComparison = (a.nomeDicente || "").localeCompare(
				b.nomeDicente || "",
			);
			if (nomeComparison !== 0) return nomeComparison;
			return (a.fase || 0) - (b.fase || 0);
		});
	}, [defesas, mapaTcc, avaliacoesEdicao, fase]);

	// Salvar avaliações apenas do card informado (TCC ou TCC+Fase específica)
	async function salvarAvaliacoesDoTcc(chaveUnicaAlvo) {
		try {
			const promises = [];
			let total = 0;
			const idTccAlvo = chaveUnicaAlvo.includes("_")
				? chaveUnicaAlvo.split("_")[0]
				: chaveUnicaAlvo;
			const faseAlvo = chaveUnicaAlvo.includes("_")
				? chaveUnicaAlvo.split("_")[1]
				: null;

			Object.entries(avaliacoesEdicao).forEach(([chave, valor]) => {
				const [idTcc, membro, faseKey] = chave.split("|");
				if (String(idTcc) !== String(idTccAlvo)) return;

				// Se for modo "Todas" as fases, filtra apenas pela fase específica do card
				if (faseAlvo && String(faseKey) !== String(faseAlvo)) return;

				const numero = valor === "" ? null : Number(valor);
				if (numero !== null && !Number.isNaN(numero) && numero >= 0) {
					total += 1;
					promises.push(
						axiosInstance.put(`/defesas/${idTcc}/${membro}`, {
							formData: { avaliacao: numero, fase: faseKey },
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
					axiosInstance.put(
						`/trabalho-conclusao/${idTccAlvo}`,
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

			await axiosInstance.put(`/trabalho-conclusao/${idTcc}`, {
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
