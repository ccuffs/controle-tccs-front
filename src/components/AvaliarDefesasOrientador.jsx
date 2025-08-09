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
	IconButton,
	Checkbox,
	FormControlLabel,
	Snackbar,
	Alert,
	Tooltip,
	CircularProgress,
	Chip,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CustomDataGrid from "./CustomDataGrid";

function getAnoSemestreAtual() {
	const data = new Date();
	const ano = data.getFullYear();
	const semestre = data.getMonth() < 6 ? 1 : 2;
	return { ano, semestre };
}

export default function AvaliarDefesasOrientador() {
	const { usuario } = useAuth();

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

	// Preparar dados para o DataGrid - garantir que todos os membros da banca tenham inputs
	const dadosParaGrid = useMemo(() => {
		const dados = [];
		const tccsProcessados = new Set();

		// Agrupar defesas por TCC
		const defesasPorTcc = new Map();
		defesas.forEach((defesa) => {
			if (!defesasPorTcc.has(defesa.id_tcc)) {
				defesasPorTcc.set(defesa.id_tcc, []);
			}
			defesasPorTcc.get(defesa.id_tcc).push(defesa);
		});

		// Para cada TCC, garantir que todos os membros da banca tenham uma linha
		defesasPorTcc.forEach((defesasTcc, idTcc) => {
			const tcc = mapaTcc.get(idTcc);
			if (!tcc) return;

			// Se já processamos este TCC, pular
			if (tccsProcessados.has(idTcc)) return;
			tccsProcessados.add(idTcc);

			// Calcular média das avaliações para este TCC
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

			// Criar uma linha para cada membro da banca
			defesasTcc.forEach((defesa) => {
				const chave = `${defesa.id_tcc}|${defesa.membro_banca}|${defesa.fase}`;
				const valorAvaliacao = avaliacoesEdicao[chave] ?? "";

				dados.push({
					id: `${defesa.id_tcc}-${defesa.membro_banca}-${defesa.fase}`,
					idTcc: defesa.id_tcc,
					membroBanca: defesa.membro_banca,
					fase: defesa.fase,
					nomeDicente: tcc.Dicente?.nome || "N/A",
					matriculaDicente: tcc.Dicente?.matricula || "N/A",
					tituloTcc: tcc.titulo || "N/A",
					nomeCurso: tcc.Curso?.nome || "N/A",
					nomeMembroBanca:
						defesa.membroBanca?.nome || defesa.membro_banca,
					avaliacao: valorAvaliacao,
					dataDefesa: defesa.data_defesa
						? new Date(defesa.data_defesa).toLocaleString("pt-BR")
						: "N/A",
					media: media,
					avaliacoesCompletas: avaliacoesCompletas,
					aprovadoAutomatico: aprovadoAutomatico,
					notas: notas,
					ehOrientador: defesa.orientador || false,
				});
			});
		});

		return dados.sort((a, b) => {
			// Ordenar por nome do estudante
			const nomeA = a.nomeDicente || "";
			const nomeB = b.nomeDicente || "";
			if (nomeA !== nomeB) {
				return nomeA.localeCompare(nomeB);
			}
			// Se mesmo estudante, ordenar por orientador primeiro, depois por nome do membro da banca
			if (a.ehOrientador !== b.ehOrientador) {
				return a.ehOrientador ? -1 : 1;
			}
			return (a.nomeMembroBanca || "").localeCompare(
				b.nomeMembroBanca || "",
			);
		});
	}, [defesas, mapaTcc, avaliacoesEdicao]);

	// Agrupar dados por TCC para exibir aprovações
	const aprovacoesPorTcc = useMemo(() => {
		const aprovacoes = new Map();

		dadosParaGrid.forEach((row) => {
			if (!aprovacoes.has(row.idTcc)) {
				aprovacoes.set(row.idTcc, {
					idTcc: row.idTcc,
					nomeDicente: row.nomeDicente,
					tituloTcc: row.tituloTcc,
					nomeCurso: row.nomeCurso,
					fase: row.fase,
					media: row.media,
					avaliacoesCompletas: row.avaliacoesCompletas,
					aprovadoAutomatico: row.aprovadoAutomatico,
					notas: row.notas,
				});
			}
		});

		return Array.from(aprovacoes.values()).sort((a, b) =>
			(a.nomeDicente || "").localeCompare(b.nomeDicente || ""),
		);
	}, [dadosParaGrid]);

	const columns = [
		{
			field: "nomeDicente",
			headerName: "Estudante",
			width: 200,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "matriculaDicente",
			headerName: "Matrícula",
			width: 120,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "tituloTcc",
			headerName: "Título do TCC",
			width: 300,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "nomeCurso",
			headerName: "Curso",
			width: 150,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},
		{
			field: "fase",
			headerName: "Fase",
			width: 100,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					<Chip
						label={params.value === 1 ? "Projeto" : "TCC"}
						size="small"
						color={params.value === 1 ? "info" : "primary"}
						variant="outlined"
					/>
				</div>
			),
		},
		{
			field: "nomeMembroBanca",
			headerName: "Membro da Banca",
			width: 220,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
					{params.row.ehOrientador && (
						<Chip
							label=""
							size="small"
							color="primary"
							variant="outlined"
						/>
					)}
				</div>
			),
		},
		{
			field: "avaliacao",
			headerName: "Avaliação",
			width: 150,
			rowSpanValueGetter: (value, row) => {
				return row ? `${row.nomeMembroBanca}-${row.fase}` : value;
			},
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						width: "100%",
						padding: "4px 0",
					}}
				>
					<TextField
						size="small"
						value={params.value}
						onChange={(e) =>
							handleAvaliacaoChange(
								params.row.idTcc,
								params.row.membroBanca,
								params.row.fase,
								e.target.value,
							)
						}
						placeholder="Ex: 8.5"
						sx={{ width: "100%" }}
					/>
				</div>
			),
		},
		{
			field: "media",
			headerName: "Média",
			width: 120,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.row.avaliacoesCompletas && params.value ? (
						<Chip
							label={params.value.toFixed(2)}
							size="small"
							color={params.value >= 6 ? "success" : "error"}
							variant="outlined"
						/>
					) : (
						<Typography variant="body2" color="text.secondary">
							Incompleta
						</Typography>
					)}
				</div>
			),
		},
		{
			field: "dataDefesa",
			headerName: "Data da Defesa",
			width: 150,
			renderCell: (params) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "normal",
						wordWrap: "break-word",
						lineHeight: "1.2",
						width: "100%",
						padding: "4px 0",
					}}
				>
					{params.value}
				</div>
			),
		},
	];

	// Função para salvar todas as avaliações
	async function salvarTodasAvaliacoes() {
		try {
			const promises = [];
			const avaliacoesValidas = [];

			// Coletar todas as avaliações válidas
			Object.entries(avaliacoesEdicao).forEach(([chave, valor]) => {
				const [idTcc, membro, fase] = chave.split("|");
				const numero = valor === "" ? null : Number(valor);

				if (numero !== null && !Number.isNaN(numero) && numero >= 0) {
					avaliacoesValidas.push({ idTcc, membro, fase, numero });
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
					`Avaliações salvas com sucesso. Total: ${avaliacoesValidas.length}`,
				);
				setMessageSeverity("success");
				setOpenMessage(true);
				// Recarregar dados para atualizar as médias
				await carregarDados();
			} else {
				setMessageText("Nenhuma avaliação válida para salvar.");
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

	// Função para salvar todas as aprovações
	async function salvarTodasAprovacoes() {
		try {
			const promises = aprovacoesPorTcc.map(async (aprovacao) => {
				const payload = {};
				if (aprovacao.fase === 1) {
					payload.aprovado_projeto = aprovacao.aprovadoAutomatico;
				} else if (aprovacao.fase === 2) {
					payload.aprovado_tcc = aprovacao.aprovadoAutomatico;
				}

				if (Object.keys(payload).length > 0) {
					await axiosInstance.put(
						`/trabalho-conclusao/${aprovacao.idTcc}`,
						payload,
					);
				}
			});

			await Promise.all(promises);
			setMessageText("Aprovações salvas com sucesso.");
			setMessageSeverity("success");
			setOpenMessage(true);
		} catch (error) {
			setMessageText("Erro ao salvar aprovações.");
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
								Total de avaliações: {dadosParaGrid.length}
							</Typography>
							<Box style={{ height: "600px" }}>
								<CustomDataGrid
									rows={dadosParaGrid}
									columns={columns}
									pageSize={10}
									checkboxSelection={false}
									disableSelectionOnClick
									getRowId={(row) => row.id}
									getRowHeight={() => 56}
									loading={loading}
									localeText={{
										noRowsLabel:
											"Nenhuma avaliação encontrada",
										loadingOverlay:
											"Carregando avaliações...",
									}}
								/>
							</Box>

							{/* Botão para salvar todas as avaliações */}
							<Box
								sx={{
									display: "flex",
									justifyContent: "flex-end",
									mt: 2,
								}}
							>
								<Tooltip title="Salvar todas as avaliações">
									<span>
										<IconButton
											color="primary"
											variant="contained"
											onClick={salvarTodasAvaliacoes}
											disabled={
												Object.keys(avaliacoesEdicao)
													.length === 0
											}
										>
											<SaveIcon />
										</IconButton>
									</span>
								</Tooltip>
							</Box>
						</Box>

						{/* Seção de Aprovações */}
						{aprovacoesPorTcc.length > 0 && (
							<Box sx={{ mt: 3 }}>
								<Typography
									variant="h6"
									component="h4"
									gutterBottom
								>
									Aprovações Automáticas
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
									gutterBottom
								>
									As aprovações são determinadas
									automaticamente com base na média das
									avaliações (≥ 6.0)
								</Typography>

								<Stack spacing={2} sx={{ mt: 2 }}>
									{aprovacoesPorTcc.map((aprovacao) => (
										<Box
											key={aprovacao.idTcc}
											sx={{
												p: 2,
												border: 1,
												borderColor: "divider",
												borderRadius: 1,
												bgcolor: "background.paper",
											}}
										>
											<Stack
												direction="row"
												spacing={2}
												alignItems="center"
											>
												<Box sx={{ flexGrow: 1 }}>
													<Typography
														variant="subtitle1"
														fontWeight={600}
													>
														{aprovacao.nomeDicente}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
													>
														{aprovacao.tituloTcc} •{" "}
														{aprovacao.nomeCurso}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
													>
														Fase:{" "}
														{aprovacao.fase === 1
															? "Projeto"
															: "TCC"}
													</Typography>
												</Box>

												<Box
													sx={{
														textAlign: "center",
														minWidth: 100,
													}}
												>
													<Typography
														variant="body2"
														color="text.secondary"
													>
														Média
													</Typography>
													{aprovacao.avaliacoesCompletas &&
													aprovacao.media ? (
														<Chip
															label={aprovacao.media.toFixed(
																2,
															)}
															size="small"
															color={
																aprovacao.media >=
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
												</Box>

												<FormControlLabel
													control={
														<Checkbox
															checked={
																aprovacao.aprovadoAutomatico
															}
															disabled={
																!aprovacao.avaliacoesCompletas
															}
															color={
																aprovacao.aprovadoAutomatico
																	? "success"
																	: "default"
															}
														/>
													}
													label={`Aprovado ${aprovacao.fase === 1 ? "Projeto" : "TCC"}`}
												/>
											</Stack>
										</Box>
									))}

									<Box
										sx={{
											display: "flex",
											justifyContent: "flex-end",
											mt: 2,
										}}
									>
										<Tooltip title="Salvar todas as aprovações">
											<span>
												<IconButton
													color="primary"
													variant="contained"
													onClick={
														salvarTodasAprovacoes
													}
													disabled={aprovacoesPorTcc.every(
														(ap) =>
															!ap.avaliacoesCompletas,
													)}
												>
													<SaveIcon />
												</IconButton>
											</span>
										</Tooltip>
									</Box>
								</Stack>
							</Box>
						)}
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
