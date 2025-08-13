import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";
import {
	Box,
	Stack,
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
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
	const [fase, setFase] = useState(1);

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
				.filter((d) => parseInt(d.fase) === parseInt(fase));
			setDefesas(defesasFiltradas);

			// Inicializar estados de edição conforme dados atuais
			const novoAvals = {};
			defesasFiltradas.forEach((d) => {
				novoAvals[`${d.id_tcc}|${d.membro_banca}|${d.fase}`] =
					d.avaliacao !== null && d.avaliacao !== undefined
						? String(d.avaliacao)
						: "";
			});
			setAvaliacoesEdicao(novoAvals);
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

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") return;
		setOpenMessage(false);
	}

	function iniciarEdicao(idTcc) {
		const prefix = `${idTcc}|`;
		const snapshot = {};
		Object.entries(avaliacoesEdicao).forEach(([k, v]) => {
			if (k.startsWith(prefix)) snapshot[k] = v;
		});
		setBackupAvaliacoes((prev) => ({ ...prev, [idTcc]: snapshot }));
		setEditandoTcc((prev) => ({ ...prev, [idTcc]: true }));
	}

	function cancelarEdicao(idTcc) {
		const snapshot = backupAvaliacoes[idTcc] || {};
		const prefix = `${idTcc}|`;
		setAvaliacoesEdicao((prev) => {
			const novo = { ...prev };
			Object.keys(novo).forEach((k) => {
				if (k.startsWith(prefix)) {
					novo[k] = snapshot.hasOwnProperty(k) ? snapshot[k] : novo[k];
				}
			});
			return novo;
		});
		setBackupAvaliacoes((prev) => {
			const novo = { ...prev };
			delete novo[idTcc];
			return novo;
		});
		setEditandoTcc((prev) => ({ ...prev, [idTcc]: false }));
	}

	// Dados para Cards: um card por TCC com inputs para todos os membros da banca
	const cardsPorTcc = useMemo(() => {
		const resultado = [];
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
			const aprovadoAutomatico = avaliacoesCompletas && media >= 6;

			const dataDefesaStr = defesasTcc[0]?.data_defesa
				? new Date(defesasTcc[0].data_defesa).toLocaleString("pt-BR")
				: "N/A";

			const membros = defesasTcc
				.map((d) => {
					const chave = `${d.id_tcc}|${d.membro_banca}|${d.fase}`;
					return {
						chave,
						idTcc: d.id_tcc,
						membroBanca: d.membro_banca,
						nomeMembroBanca: d.membroBanca?.nome || d.membro_banca,
						valorAvaliacao: avaliacoesEdicao[chave] ?? "",
						ehOrientador: d.orientador || false,
						salvo:
							d.avaliacao !== null && d.avaliacao !== undefined,
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

		return resultado.sort((a, b) =>
			(a.nomeDicente || "").localeCompare(b.nomeDicente || ""),
		);
	}, [defesas, mapaTcc, avaliacoesEdicao]);

	// Salvar avaliações apenas do TCC informado
	async function salvarAvaliacoesDoTcc(idTccAlvo) {
		try {
			const promises = [];
			let total = 0;
			Object.entries(avaliacoesEdicao).forEach(([chave, valor]) => {
				const [idTcc, membro] = chave.split("|");
				if (String(idTcc) !== String(idTccAlvo)) return;
				const numero = valor === "" ? null : Number(valor);
				if (numero !== null && !Number.isNaN(numero) && numero >= 0) {
					total += 1;
					promises.push(
						axiosInstance.put(`/defesas/${idTcc}/${membro}`, {
							formData: { avaliacao: numero },
						}),
					);
				}
			});

			if (promises.length > 0) {
				await Promise.all(promises);
				setMessageText(
					`Avaliações do TCC ${idTccAlvo} salvas com sucesso. Total: ${total}`,
				);
				setMessageSeverity("success");
				setOpenMessage(true);
				await carregarDados();
				setEditandoTcc((prev) => ({ ...prev, [idTccAlvo]: false }));
				setBackupAvaliacoes((prev) => {
					const novo = { ...prev };
					delete novo[idTccAlvo];
					return novo;
				});
			} else {
				setMessageText("Nenhuma avaliação válida para este TCC.");
				setMessageSeverity("warning");
				setOpenMessage(true);
			}
		} catch (error) {
			console.error("Erro ao salvar avaliações do TCC:", error);
			setMessageText("Erro ao salvar avaliações do TCC.");
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	return (
		<Box>
			<Stack spacing={2}>
				<Typography variant="h6" component="h3">
					Avaliar Defesas
				</Typography>

				<Stack direction="row" spacing={2} alignItems="center">
					<FormControl fullWidth size="small">
						<InputLabel>Curso</InputLabel>
						<Select
							value={cursoSelecionado}
							label="Curso"
							onChange={(e) =>
								setCursoSelecionado(e.target.value)
							}
						>
							<MenuItem value="">
								<em>Selecione um curso</em>
							</MenuItem>
							{cursos.map((curso) => (
								<MenuItem key={curso.id} value={curso.id}>
									{curso.nome} - {curso.codigo} ({curso.turno}
									)
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl sx={{ minWidth: 100 }} size="small">
						<InputLabel>Ano</InputLabel>
						<Select
							value={ano}
							label="Ano"
							onChange={(e) => setAno(e.target.value)}
						>
							{[ano - 1, ano, ano + 1].map((a) => (
								<MenuItem key={a} value={a}>
									{a}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl sx={{ minWidth: 80 }} size="small">
						<InputLabel>Semestre</InputLabel>
						<Select
							value={semestre}
							label="Semestre"
							onChange={(e) => setSemestre(e.target.value)}
						>
							{[1, 2].map((s) => (
								<MenuItem key={s} value={s}>
									{s}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl sx={{ minWidth: 80 }} size="small">
						<InputLabel>Fase</InputLabel>
						<Select
							value={fase}
							label="Fase"
							onChange={(e) => setFase(e.target.value)}
						>
							{[1, 2].map((f) => (
								<MenuItem key={f} value={f}>
									{f == 1 ? "Projeto" : "TCC"}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>

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
									<Card key={card.idTcc} variant="outlined" sx={{
										backgroundColor:
											theme.palette.background.default}}>
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
																	card.aprovadoAutomatico,
																)}
																disabled={
																	!card.avaliacoesCompletas
																}
																color={
																	card.aprovadoAutomatico
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
															<Box sx={{ width: 100 }}>
														<TextField
																placeholder="Ex: 8.5"
																size="small"
															type="number"
																value={
																	m.valorAvaliacao
																}
																onChange={(e) =>
																	handleAvaliacaoChange(
																		card.idTcc,
																		m.membroBanca,
																		card.fase,
																		e.target
																		.value,
																	)
																}
														inputProps={{ step: "0.1", min: 0 }}
														disabled={Boolean(m.salvo) && !editandoTcc[card.idTcc]}
														/>
																</Box>
														</Stack>
													))}
												</Box>
											</Stack>
										</CardContent>
										<CardActions
											sx={{ justifyContent: "flex-end" }}
										>
														{editandoTcc[card.idTcc] ? (
															<Stack direction="row" spacing={1}>
																<Tooltip title="Salvar avaliações deste TCC">
																	<span>
																		<Button
																			variant="contained"
																			color="primary"
																			onClick={() => salvarAvaliacoesDoTcc(card.idTcc)}
																		>
																			Salvar
																		</Button>
																	</span>
																</Tooltip>
																<Button variant="outlined" color="inherit" onClick={() => cancelarEdicao(card.idTcc)}>
																	Cancelar
																</Button>
															</Stack>
														) : (
															<Button variant="outlined" onClick={() => iniciarEdicao(card.idTcc)}>Editar</Button>
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
