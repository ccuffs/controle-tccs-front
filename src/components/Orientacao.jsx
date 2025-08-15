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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function Orientacao() {
	const [dicentes, setDicentes] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [orientadoresCurso, setOrientadoresCurso] = useState([]);
	const [ofertasTcc, setOfertasTcc] = useState([]);
	const [orientacoes, setOrientacoes] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(new Date().getFullYear());
	const [semestre, setSemestre] = useState("");
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

	const { permissoesUsuario } = useAuth();

	useEffect(() => {
		getCursos();
		getOfertasTcc();
		getDicentes();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		// Atualiza dicentes conforme filtros (ano, semestre, fase)
		getDicentes();

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
	}, [cursoSelecionado, ano, semestre, fase]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		// Busca orientadores do curso selecionado
		if (cursoSelecionado) {
			getOrientadoresCurso(cursoSelecionado);
		} else {
			setOrientadoresCurso([]);
		}
	}, [cursoSelecionado]); // eslint-disable-line react-hooks/exhaustive-deps

	async function getCursos() {
		setLoadingCursos(true);
		try {
			const response = await axiosInstance.get("/cursos");
			setCursos(response.cursos || []);
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

	function getOrientadorAtual(matricula) {
		if (!cursoSelecionado || !ano || !semestre || !fase)
			return "";

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
			? orientacao.codigo_docente ||
					orientacao.Docente?.codigo ||
					orientacao.codigo ||
					""
			: "";
	}

	function handleOrientadorChange(matricula, codigoDocente) {
		if (!cursoSelecionado || !ano || !semestre || !fase) return;

		const chave = `${matricula}_${ano}_${semestre}_${cursoSelecionado}_${fase}`;

		setOrientacoesAlteradas((prev) => ({
			...prev,
			[chave]: {
				matricula: matricula,
				ano: parseInt(ano),
				semestre: parseInt(semestre),
				id_curso: cursoSelecionado,
				fase: parseInt(fase),
				codigo_docente: codigoDocente || null,
			},
		}));
	}

	async function salvarOrientacoes() {
		try {
			const orientacoesParaSalvar = Object.values(orientacoesAlteradas);
			for (const orientacao of orientacoesParaSalvar) {
				// Ignora quando não há orientador selecionado
				if (!orientacao.codigo_docente) {
					continue;
				}

				// Identifica o TCC do dicente no contexto filtrado
				const tcc = trabalhosPorMatricula[orientacao.matricula];
				const idTcc = tcc?.id;
				if (!idTcc) {
					throw new Error(
						`Não foi possível identificar o TCC do dicente ${orientacao.matricula}. Verifique os filtros.`,
					);
				}

				const payload = {
					codigo_docente: orientacao.codigo_docente,
					id_tcc: idTcc,
					orientador: true,
				};

				await axiosInstance.post("/orientacoes", { formData: payload });
			}

			setMessageText("Orientações salvas com sucesso!");
			setMessageSeverity("success");
			setOrientacoesAlteradas({});
			await getOrientacoes();
		} catch (error) {
			console.error("Erro ao salvar orientações:", error);
			setMessageText(`Falha ao salvar orientações: ${error.message}`);
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
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

	// Filtrar apenas docentes que podem orientar no curso selecionado
	const docentesDisponiveis = cursoSelecionado
		? orientadoresCurso.map((oc) => oc.docente)
		: [];

	// Lista de dicentes a exibir
	const dicentesFiltrados = dicentes;

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
				const orientadorAtual = getOrientadorAtual(
					params.row.matricula,
				);
				const chave =
					ano && semestre && fase
						? `${params.row.matricula}_${ano}_${semestre}_${cursoSelecionado}_${fase}`
						: null;
				const orientadorSelecionado =
					chave && orientacoesAlteradas[chave]
						? orientacoesAlteradas[chave].codigo_docente || ""
						: orientadorAtual;

				return (
					<FormControl
						fullWidth
						size="small"
						disabled={!ano || !semestre || !fase}
					>
						{permissoesService.verificarPermissaoPorIds(
							permissoesUsuario,
							[Permissoes.ORIENTACAO.EDITAR],
						) ? (
							<Select
								value={orientadorSelecionado}
								onChange={(e) =>
									handleOrientadorChange(
										params.row.matricula,
										e.target.value,
									)
								}
								displayEmpty
							>
								<MenuItem value="">
									<em>Sem orientador</em>
								</MenuItem>
								{docentesDisponiveis.map((docente) => (
									<MenuItem
										key={docente.codigo}
										value={docente.codigo}
									>
										{docente.nome}
									</MenuItem>
								))}
							</Select>
						) : (
							<Typography variant="body2" color="text.secondary">
								{orientadorSelecionado ||
									"Sem orientador definido"}
							</Typography>
						)}
					</FormControl>
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
							} else if (etapa === 5 || etapa === 8) {
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
								etapa === 7 ||
								etapa === 9
							) {
								// Para etapas 6, 7 e 9, sucesso se existem convites de banca enviados na fase corrente
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
										(d) => fase
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

	return (
		<Box sx={{ width: 1400 }}>
			<Stack spacing={2} sx={{ width: "100%" }}>
				<Typography variant="h5" component="h2">
					Gerenciamento de Orientações
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
					loading={loadingCursos || loadingOfertasTcc || loadingDicentes}
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
					) : (
						<Typography variant="body2" color="text.secondary">
							{`${dicentesFiltrados.length} dicente${
								dicentesFiltrados.length !== 1 ? "s" : ""
							} encontrado${
								dicentesFiltrados.length !== 1 ? "s" : ""
							}`}
						</Typography>
					)}
				</Box>

				<PermissionContext
					permissoes={[
						Permissoes.ORIENTACAO.CRIAR,
						Permissoes.ORIENTACAO.EDITAR,
					]}
					showError={false}
				>
					{Object.keys(orientacoesAlteradas).length > 0 &&
						cursoSelecionado &&
						ano &&
						semestre &&
						fase && (
							<Box>
								<Button
									variant="contained"
									color="primary"
									startIcon={<SaveIcon />}
									onClick={salvarOrientacoes}
								>
									Salvar Alterações (
									{Object.keys(orientacoesAlteradas).length})
								</Button>
							</Box>
						)}
				</PermissionContext>

				{/* (Opcional) Dica de filtros removida para exibir todos os dicentes por padrão */}

				{/* DataGrid de dicentes e orientações */}
				<PermissionContext
					permissoes={[
						Permissoes.ORIENTACAO.VISUALIZAR,
						Permissoes.ORIENTACAO.VISUALIZAR_TODAS,
					]}
				>
					{dicentesFiltrados.length > 0 && (
						<Box style={{ height: "500px" }}>
							<DataGrid
								rows={dicentesFiltrados}
								columns={columns}
								pageSize={10}
								checkboxSelection={false}
								disableSelectionOnClick
								getRowId={(row) => row.matricula}
								initialState={{
									sorting: {
										sortModel: [
											{ field: "nome", sort: "asc" },
										],
									},
								}}
							/>
						</Box>
					)}
				</PermissionContext>

				<PermissionContext
					permissoes={[
						Permissoes.ORIENTACAO.VISUALIZAR,
						Permissoes.ORIENTACAO.VISUALIZAR_TODAS,
					]}
				>
					{dicentesFiltrados.length === 0 && !loadingDicentes && (
						<Paper sx={{ p: 3, textAlign: "center" }}>
							<Typography variant="body2" color="text.secondary">
								Nenhum dicente encontrado.
							</Typography>
						</Paper>
					)}
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
