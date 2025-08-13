import React, { useEffect, useMemo, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	Grid,
	MenuItem,
	Typography,
	Stack,
	FormControl,
	InputLabel,
	Select,
} from "@mui/material";
import MuiTooltip from "@mui/material/Tooltip";
import CustomDataGrid from "./CustomDataGrid";
import { useTheme } from "@mui/material/styles";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	Cell,
	PieChart,
	Pie,
	Legend,
	LineChart,
	Line,
} from "recharts";
import axios from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";
import { Permissoes } from "../enums/permissoes";

export default function Dashboard({ forceOrientador = false }) {
	const theme = useTheme();
	const { gruposUsuario, usuario } = useAuth();
	const isAdmin = useMemo(
		() =>
			!forceOrientador &&
			gruposUsuario?.some((g) => g.id === Permissoes.GRUPOS.ADMIN),
		[gruposUsuario, forceOrientador],
	);
	const isProfessor = useMemo(
		() =>
			!forceOrientador &&
			gruposUsuario?.some((g) => g.id === Permissoes.GRUPOS.PROFESSOR),
		[gruposUsuario, forceOrientador],
	);
	const isOrientador = useMemo(
		() =>
			forceOrientador ||
			gruposUsuario?.some((g) => g.id === Permissoes.GRUPOS.ORIENTADOR),
		[gruposUsuario, forceOrientador],
	);

	const [anosSemestres, setAnosSemestres] = useState([]); // lista para filtros
	const [filtroAno, setFiltroAno] = useState("");
	const [filtroSemestre, setFiltroSemestre] = useState("");
	const [filtroFase, setFiltroFase] = useState("");
	const [filtroCurso, setFiltroCurso] = useState("");
	const [cursosUsuario, setCursosUsuario] = useState([]);
	const [todosCursos, setTodosCursos] = useState([]);

	const [loadingFiltros, setLoadingFiltros] = useState(true);
	const [dadosGraficoOrientador, setDadosGraficoOrientador] = useState({
		total: 0,
		comOrientador: 0,
	});
	const [loadingGrafico, setLoadingGrafico] = useState(false);
	const [dadosEtapas, setDadosEtapas] = useState([]);
	const [dadosConvites, setDadosConvites] = useState([]);
	const [convitesOrientacaoStatus, setConvitesOrientacaoStatus] = useState({
		respondidos: 0,
		pendentes: 0,
		total: 0,
	});
	const [dadosDocentes, setDadosDocentes] = useState([]);
	const [convitesBancaStatus, setConvitesBancaStatus] = useState({
		respondidos: 0,
		pendentes: 0,
		total: 0,
	});
	const [dadosDefesasDocentes, setDadosDefesasDocentes] = useState([]);
	const [defesasAgendadas, setDefesasAgendadas] = useState([]);

	const alturaDocentes = useMemo(() => {
		const n = Array.isArray(dadosDocentes) ? dadosDocentes.length : 0;
		return Math.max(240, Math.min(800, n * 28 + 80));
	}, [dadosDocentes]);

	const alturaDefesas = useMemo(() => {
		const n = Array.isArray(dadosDefesasDocentes)
			? dadosDefesasDocentes.length
			: 0;
		return Math.max(240, Math.min(800, n * 28 + 80));
	}, [dadosDefesasDocentes]);

	// Carrega períodos e define padrão com ano/semestre atual
	useEffect(() => {
		let ativo = true;
		(async () => {
			try {
				setLoadingFiltros(true);
				const [atual, lista] = await Promise.all([
					axios.get(`/ano-semestre/atual`),
					axios.get(`/ano-semestre`),
				]);

				if (!ativo) return;
				setAnosSemestres(lista || []);
				setFiltroAno(String(atual.ano));
				setFiltroSemestre(String(atual.semestre));

				// cursos conforme perfil
				if (isAdmin) {
					try {
						const cursosResp = await axios.get(`/cursos`);
						setTodosCursos(cursosResp?.cursos || []);
					} catch (_) {
						setTodosCursos([]);
					}
				} else if (isProfessor) {
					const cursos = usuario?.cursos || [];
					setCursosUsuario(cursos);
					if (cursos.length === 1)
						setFiltroCurso(String(cursos[0].id));
				} else if (isOrientador) {
					try {
						const codigoDocente = usuario?.codigo || usuario?.id;
						const resp = await axios.get(
							`/orientadores/docente/${codigoDocente}`,
						);
						const orientacoes = resp?.orientacoes || [];
						const cursosSet = new Map();
						for (const o of orientacoes) {
							const c = o?.curso;
							if (c?.id && !cursosSet.has(c.id))
								cursosSet.set(c.id, c);
						}
						const listaCursos = Array.from(cursosSet.values());
						setCursosUsuario(listaCursos);
						if (listaCursos.length === 1)
							setFiltroCurso(String(listaCursos[0].id));
					} catch (_) {
						setCursosUsuario([]);
					}
				}
			} finally {
				if (ativo) setLoadingFiltros(false);
			}
		})();
		return () => {
			ativo = false;
		};
	}, [isAdmin, isProfessor, isOrientador, usuario]);

	// Busca dados do primeiro gráfico conforme filtros globais
	useEffect(() => {
		if (!filtroAno || !filtroSemestre) return;
		let ativo = true;
		(async () => {
			try {
				setLoadingGrafico(true);
				const params = new URLSearchParams();
				params.set("ano", String(filtroAno));
				params.set("semestre", String(filtroSemestre));
				if (String(filtroFase)) {
					params.set("fase", String(filtroFase));
				}

				if (isAdmin) {
					if (filtroCurso)
						params.set("id_curso", String(filtroCurso));
				} else if (isProfessor) {
					// professor: restringe ao(s) curso(s) do usuário; se houver curso selecionado, usa-o
					if (filtroCurso)
						params.set("id_curso", String(filtroCurso));
					else if (cursosUsuario?.[0]?.id)
						params.set("id_curso", String(cursosUsuario[0].id));
				} else if (isOrientador) {
					const codigoDocente = usuario?.codigo || usuario?.id;
					if (codigoDocente)
						params.set("codigo_docente", String(codigoDocente));
					if (filtroCurso)
						params.set("id_curso", String(filtroCurso));
					else if (cursosUsuario?.[0]?.id)
						params.set("id_curso", String(cursosUsuario[0].id));
				}

				// Buscar contagem de estudantes com orientador definido (barra)
				try {
					const orientadores = await axios.get(
						`/dashboard/orientadores-definidos?${params.toString()}`,
					);
					if (!ativo) return;
					setDadosGraficoOrientador({
						total: orientadores?.total || 0,
						comOrientador: orientadores?.comOrientador || 0,
					});
				} catch (_) {
					if (!ativo) return;
					setDadosGraficoOrientador({ total: 0, comOrientador: 0 });
				}

				// Buscar distribuição por etapa (donut)
				const etapas = await axios.get(
					`/dashboard/tcc-por-etapa?${params.toString()}`,
				);
				if (!ativo) return;
				const lista = (etapas.distribuicao || []).map((e) => ({
					name: `Etapa ${e.etapa}`,
					value: e.quantidade,
					etapa: e.etapa,
				}));
				setDadosEtapas(lista);

				// Buscar defesas agendadas (tabela)
				const defesas = await axios.get(
					`/dashboard/defesas-agendadas?${params.toString()}`,
				);
				if (!ativo) return;
				setDefesasAgendadas(defesas.itens || []);

				// Buscar série temporal de convites por período (linha)
				const convites = await axios.get(
					`/dashboard/convites-por-periodo?${params.toString()}`,
				);
				if (!ativo) return;
				setDadosConvites(convites.pontos || []);

				// Buscar status de convites de orientação (donut)
				const convitesStatus = await axios.get(
					`/dashboard/convites-orientacao-status?${params.toString()}`,
				);
				if (!ativo) return;
				setConvitesOrientacaoStatus({
					respondidos: convitesStatus.respondidos || 0,
					pendentes: convitesStatus.pendentes || 0,
					total: convitesStatus.total || 0,
				});

				// Buscar status de convites de banca (donut)
				const convitesBanca = await axios.get(
					`/dashboard/convites-banca-status?${params.toString()}`,
				);
				if (!ativo) return;
				setConvitesBancaStatus({
					respondidos: convitesBanca.respondidos || 0,
					pendentes: convitesBanca.pendentes || 0,
					total: convitesBanca.total || 0,
				});

				// Buscar gráficos por docente somente quando ADMIN/PROFESSOR
				if (isAdmin || isProfessor) {
					const paramsDocentes = new URLSearchParams();
					paramsDocentes.set("ano", String(filtroAno));
					paramsDocentes.set("semestre", String(filtroSemestre));
					if (String(filtroFase))
						paramsDocentes.set("fase", String(filtroFase));
					const porDocente = await axios.get(
						`/dashboard/orientandos-por-docente?${paramsDocentes.toString()}`,
					);
					if (!ativo) return;
					setDadosDocentes(
						(porDocente.itens || []).map((i) => ({
							docente: i.nome || i.codigo_docente,
							quantidade: i.quantidade || 0,
						})),
					);

					const defesasPorDocente = await axios.get(
						`/dashboard/defesas-aceitas-por-docente?${paramsDocentes.toString()}`,
					);
					if (!ativo) return;
					setDadosDefesasDocentes(
						(defesasPorDocente.itens || []).map((i) => ({
							docente: i.nome || i.codigo_docente,
							quantidade: i.quantidade || 0,
						})),
					);
				} else {
					setDadosDocentes([]);
					setDadosDefesasDocentes([]);
				}
			} finally {
				if (ativo) setLoadingGrafico(false);
			}
		})();
		return () => {
			ativo = false;
		};
	}, [
		filtroAno,
		filtroSemestre,
		filtroCurso,
		filtroFase,
		isAdmin,
		isProfessor,
		cursosUsuario,
	]);

	const dadosBarra = useMemo(() => {
		return [
			{
				nome: "Com orientador",
				valor: dadosGraficoOrientador.comOrientador,
			},
			{
				nome: "Sem orientador",
				valor: Math.max(
					0,
					(dadosGraficoOrientador.total || 0) -
						(dadosGraficoOrientador.comOrientador || 0),
				),
			},
		];
	}, [dadosGraficoOrientador]);

	// Opções distintas de (ano, semestre) para selects
	const anosUnicos = useMemo(
		() =>
			Array.from(new Set(anosSemestres.map((p) => p.ano))).sort(
				(a, b) => a - b,
			),
		[anosSemestres],
	);
	const semestresDisponiveis = useMemo(
		() =>
			Array.from(
				new Set(
					anosSemestres
						.filter((p) => String(p.ano) === String(filtroAno))
						.map((p) => p.semestre),
				),
			).sort((a, b) => a - b),
		[anosSemestres, filtroAno],
	);

	const faseLabel = useMemo(() => {
		const v = String(filtroFase || "");
		if (!v) return "";
		return v === "1" ? "(Projeto)" : "(TCC)";
	}, [filtroFase]);

	// Layout exclusivo quando forçado via Módulo do Orientador
	const isOrientadorView = useMemo(
		() => !!forceOrientador,
		[forceOrientador],
	);

	// Ticks do eixo X: 2 por mês (dias 1 e 15) dentro do intervalo de dados
	const ticksConvites = useMemo(() => {
		if (!dadosConvites || dadosConvites.length === 0) return [];
		const parseISO = (s) => {
			const [y, m, d] = String(s)
				.split("-")
				.map((v) => parseInt(v, 10));
			return new Date(y, (m || 1) - 1, d || 1);
		};
		const formatISO = (d) => {
			const y = d.getFullYear();
			const m = `${d.getMonth() + 1}`.padStart(2, "0");
			const day = `${d.getDate()}`.padStart(2, "0");
			return `${y}-${m}-${day}`;
		};

		const inicio = parseISO(dadosConvites[0].data);
		const fim = parseISO(dadosConvites[dadosConvites.length - 1].data);
		const ticks = [];
		let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
		while (cursor <= fim) {
			const primeiro = new Date(
				cursor.getFullYear(),
				cursor.getMonth(),
				1,
			);
			const meio = new Date(cursor.getFullYear(), cursor.getMonth(), 15);
			if (primeiro >= inicio && primeiro <= fim)
				ticks.push(formatISO(primeiro));
			if (meio >= inicio && meio <= fim) ticks.push(formatISO(meio));
			cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
		}
		return ticks;
	}, [dadosConvites]);

	const dadosConvitesDonut = useMemo(() => {
		return [
			{
				name: "Respondidos",
				value: convitesOrientacaoStatus.respondidos,
			},
			{ name: "Pendentes", value: convitesOrientacaoStatus.pendentes },
		];
	}, [convitesOrientacaoStatus]);

	const dadosConvitesBancaDonut = useMemo(() => {
		return [
			{ name: "Respondidos", value: convitesBancaStatus.respondidos },
			{ name: "Pendentes", value: convitesBancaStatus.pendentes },
		];
	}, [convitesBancaStatus]);

	const totalConvitesPeriodo = useMemo(() => {
		if (!Array.isArray(dadosConvites)) return 0;
		return dadosConvites.reduce(
			(acc, p) => acc + (p.orientacao || 0) + (p.banca || 0),
			0,
		);
	}, [dadosConvites]);

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 2 }}>
				Dashboard
			</Typography>

			{/* Filtros globais */}
			<Stack spacing={2} sx={{ width: 1400 }}>
				<Stack direction="row" spacing={2} alignItems="center">
					{(isAdmin ||
						(isProfessor && cursosUsuario?.length > 0)) && (
						<FormControl
							fullWidth
							size="small"
							disabled={loadingFiltros}
						>
							<InputLabel>Curso</InputLabel>
							<Select
								value={filtroCurso}
								label="Curso"
								onChange={(e) => setFiltroCurso(e.target.value)}
							>
								{isAdmin && (
									<MenuItem value="">
										<em>Todos os cursos</em>
									</MenuItem>
								)}
								{(isAdmin ? todosCursos : cursosUsuario).map(
									(c) => (
										<MenuItem
											key={c.id}
											value={String(c.id)}
										>
											{c.nome}
										</MenuItem>
									),
								)}
							</Select>
						</FormControl>
					)}

					<FormControl
						sx={{ minWidth: 100 }}
						size="small"
						disabled={loadingFiltros}
					>
						<InputLabel>Ano</InputLabel>
						<Select
							value={filtroAno}
							label="Ano"
							onChange={(e) => setFiltroAno(e.target.value)}
						>
							{anosUnicos.map((ano) => (
								<MenuItem key={ano} value={String(ano)}>
									{ano}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl
						sx={{ minWidth: 100 }}
						size="small"
						disabled={loadingFiltros}
					>
						<InputLabel>Semestre</InputLabel>
						<Select
							value={filtroSemestre}
							label="Semestre"
							onChange={(e) => setFiltroSemestre(e.target.value)}
						>
							{semestresDisponiveis.map((s) => (
								<MenuItem key={s} value={String(s)}>
									{s}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{(isAdmin || isProfessor) && (
						<FormControl
							sx={{ minWidth: 100 }}
							size="small"
							disabled={loadingFiltros}
						>
							<InputLabel>Fase</InputLabel>
							<Select
								value={filtroFase}
								label="Fase"
								onChange={(e) => setFiltroFase(e.target.value)}
							>
								<MenuItem value="">
									<em>Todas</em>
								</MenuItem>
								<MenuItem value="1">Projeto</MenuItem>
								<MenuItem value="2">TCC</MenuItem>
							</Select>
						</FormControl>
					)}
				</Stack>
			</Stack>

			<Grid container spacing={2}>
				{/* Gráfico 1: Estudantes com orientador definido na oferta e Donut por etapa, lado a lado */}
				{(isAdmin || isProfessor) && (
					<>
						<Grid item xs={12} md={4} lg={4}>
							<Card
								sx={{
									backgroundColor:
										theme.palette.background.default,
									height: "100%",
									display: "flex",
									flexDirection: "column",
									width: { xs: "100%", md: 406 },
								}}
							>
								<CardContent
									sx={{
										display: "flex",
										flexDirection: "column",
										flexGrow: 1,
									}}
								>
									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Estudantes com orientador definido
										{faseLabel}
									</Typography>
									<Box sx={{ minHeight: 260, flexGrow: 1 }}>
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<BarChart data={dadosBarra}>
												<CartesianGrid
													stroke={
														theme.palette.divider
													}
													strokeDasharray="3 3"
													fill={
														theme.palette.background
															.default
													}
												/>
												<XAxis
													dataKey="nome"
													tick={{
														fill: theme.palette.text
															.secondary,
													}}
													axisLine={{
														stroke: theme.palette
															.divider,
													}}
													tickLine={{
														stroke: theme.palette
															.divider,
													}}
												/>
												<YAxis
													allowDecimals={false}
													tick={{
														fill: theme.palette.text
															.secondary,
													}}
													axisLine={{
														stroke: theme.palette
															.divider,
													}}
													tickLine={{
														stroke: theme.palette
															.divider,
													}}
												/>
												<Tooltip
													wrapperStyle={{
														outline: "none",
													}}
													contentStyle={{
														backgroundColor:
															theme.palette
																.background
																.paper,
														border: `1px solid ${theme.palette.divider}`,
														color: theme.palette
															.text.primary,
													}}
													labelStyle={{
														color: theme.palette
															.text.secondary,
													}}
													itemStyle={{
														color: theme.palette
															.text.primary,
													}}
												/>
												<Bar
													dataKey="valor"
													radius={[4, 4, 0, 0]}
												>
													{dadosBarra.map(
														(entry, index) => (
															<Cell
																key={`cell-${index}`}
																fill={
																	entry.nome ===
																	"Com orientador"
																		? theme
																				.palette
																				.primary
																				.main
																		: theme
																				.palette
																				.success
																				.main
																}
															/>
														),
													)}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</Box>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Total: {dadosGraficoOrientador.total} |
										Com orientador:{" "}
										{dadosGraficoOrientador.comOrientador}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						{/* Donut por etapa ao lado */}
						<Grid item xs={12} md={4} lg={4}>
							<Card
								sx={{
									backgroundColor:
										theme.palette.background.default,
									height: "100%",
									display: "flex",
									flexDirection: "column",
									width: { xs: "100%", md: 406 },
								}}
							>
								<CardContent
									sx={{
										display: "flex",
										flexDirection: "column",
										flexGrow: 1,
									}}
								>
									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Distribuição por etapa {faseLabel}
									</Typography>
									<Box sx={{ minHeight: 260, flexGrow: 1 }}>
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<PieChart>
												<Tooltip
													wrapperStyle={{
														outline: "none",
													}}
													contentStyle={{
														backgroundColor:
															theme.palette
																.background
																.paper,
														border: `1px solid ${theme.palette.divider}`,
														color: theme.palette
															.text.primary,
													}}
													labelStyle={{
														color: theme.palette
															.text.secondary,
													}}
													itemStyle={{
														color: theme.palette
															.text.primary,
													}}
												/>
												<Legend
													verticalAlign="bottom"
													height={24}
													wrapperStyle={{
														color: theme.palette
															.text.secondary,
													}}
												/>
												<Pie
													data={dadosEtapas}
													dataKey="value"
													nameKey="name"
													cx="50%"
													cy="45%"
													innerRadius={50}
													outerRadius={80}
													paddingAngle={2}
												>
													{dadosEtapas.map(
														(entry, index) => (
															<Cell
																key={`slice-${index}`}
																fill={
																	[
																		theme
																			.palette
																			.primary
																			.main,
																		theme
																			.palette
																			.secondary
																			.main,
																		theme
																			.palette
																			.success
																			.main,
																		theme
																			.palette
																			.warning
																			.main,
																		theme
																			.palette
																			.info
																			.main,
																		theme
																			.palette
																			.error
																			.main,
																	][index % 6]
																}
															/>
														),
													)}
												</Pie>
											</PieChart>
										</ResponsiveContainer>
									</Box>
								</CardContent>
							</Card>
						</Grid>
						{/* Tabela de Defesas agendadas ao lado */}
						<Grid item xs={12} md={4} lg={4}>
							<Card
								sx={{
									backgroundColor:
										theme.palette.background.default,
									height: "100%",
									display: "flex",
									flexDirection: "column",
									width: { xs: "100%", md: 560 },
								}}
							>
								<CardContent
									sx={{
										display: "flex",
										flexDirection: "column",
										flexGrow: 1,
									}}
								>
									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Defesas agendadas
									</Typography>

									{(defesasAgendadas || []).length === 0 ? (
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ mt: 1 }}
										>
											Sem defesas agendadas
										</Typography>
									) : (
										<Box sx={{ mt: 1, flexGrow: 1 }}>
											<CustomDataGrid
												rows={defesasAgendadas}
												columns={[
													{
														field: "data",
														headerName: "Data",
														width: 110,
														renderCell: (
															params,
														) => {
															const [y, m, d] =
																String(
																	params.value ||
																		"",
																).split("-");
															const title = (
																<Box>
																	<Typography variant="subtitle2">
																		{params
																			.row
																			?.titulo ||
																			"Sem título"}
																	</Typography>
																	<Typography variant="body2">
																		Orientador:{" "}
																		{params
																			.row
																			?.orientador ||
																			"-"}
																	</Typography>
																	<Typography variant="body2">
																		Banca:{" "}
																		{(
																			params
																				.row
																				?.banca ||
																			[]
																		).join(
																			", ",
																		) ||
																			"-"}
																	</Typography>
																</Box>
															);
															return (
																<MuiTooltip
																	title={
																		title
																	}
																	arrow
																	placement="top-start"
																>
																	<div
																		style={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																			whiteSpace:
																				"nowrap",
																		}}
																	>
																		{params.value
																			? `${d}/${m}/${y}`
																			: ""}
																	</div>
																</MuiTooltip>
															);
														},
													},
													{
														field: "hora",
														headerName: "Hora",
														width: 90,
														renderCell: (
															params,
														) => {
															const title = (
																<Box>
																	<Typography variant="subtitle2">
																		{params
																			.row
																			?.titulo ||
																			"Sem título"}
																	</Typography>
																	<Typography variant="body2">
																		Orientador:{" "}
																		{params
																			.row
																			?.orientador ||
																			"-"}
																	</Typography>
																	<Typography variant="body2">
																		Banca:{" "}
																		{(
																			params
																				.row
																				?.banca ||
																			[]
																		).join(
																			", ",
																		) ||
																			"-"}
																	</Typography>
																</Box>
															);
															return (
																<MuiTooltip
																	title={
																		title
																	}
																	arrow
																	placement="top-start"
																>
																	<div
																		style={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																		}}
																	>
																		{params.value ||
																			""}
																	</div>
																</MuiTooltip>
															);
														},
													},
													{
														field: "fase_label",
														headerName: "Fase",
														width: 120,
														renderCell: (
															params,
														) => {
															const title = (
																<Box>
																	<Typography variant="subtitle2">
																		{params
																			.row
																			?.titulo ||
																			"Sem título"}
																	</Typography>
																	<Typography variant="body2">
																		Orientador:{" "}
																		{params
																			.row
																			?.orientador ||
																			"-"}
																	</Typography>
																	<Typography variant="body2">
																		Banca:{" "}
																		{(
																			params
																				.row
																				?.banca ||
																			[]
																		).join(
																			", ",
																		) ||
																			"-"}
																	</Typography>
																</Box>
															);
															return (
																<MuiTooltip
																	title={
																		title
																	}
																	arrow
																	placement="top-start"
																>
																	<div
																		style={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																		}}
																	>
																		{params.value ||
																			(params
																				.row
																				?.fase ===
																			1
																				? "Projeto"
																				: "TCC")}
																	</div>
																</MuiTooltip>
															);
														},
													},
													{
														field: "estudante",
														headerName: "Estudante",
														width: 220,
														renderCell: (
															params,
														) => {
															const title = (
																<Box>
																	<Typography variant="subtitle2">
																		{params
																			.row
																			?.titulo ||
																			"Sem título"}
																	</Typography>
																	<Typography variant="body2">
																		Orientador:{" "}
																		{params
																			.row
																			?.orientador ||
																			"-"}
																	</Typography>
																	<Typography variant="body2">
																		Banca:{" "}
																		{(
																			params
																				.row
																				?.banca ||
																			[]
																		).join(
																			", ",
																		) ||
																			"-"}
																	</Typography>
																</Box>
															);
															return (
																<MuiTooltip
																	title={
																		title
																	}
																	arrow
																	placement="top-start"
																>
																	<div
																		style={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																			whiteSpace:
																				"normal",
																			wordWrap:
																				"break-word",
																			lineHeight: 1.2,
																			width: "100%",
																			padding:
																				"4px 0",
																		}}
																	>
																		{
																			params.value
																		}
																	</div>
																</MuiTooltip>
															);
														},
													},
												]}
												pageSize={5}
												checkboxSelection={false}
												disableSelectionOnClick
												rowSpanning={false}
												getRowId={(row) =>
													`${row.data}-${row.hora}-${row.estudante}`
												}
												columnVisibilityModel={{}}
											/>
										</Box>
									)}
								</CardContent>
							</Card>
						</Grid>
					</>
				)}
			</Grid>

			{/* Orientador (apenas quando forçado em ModuloOrientador):
          1ª linha → Etapas, Convites orientação, Convites banca
          2ª linha → Convites no período, Defesas agendadas */}
			{!isAdmin && !isProfessor && isOrientador && isOrientadorView && (
				<>
					<Grid container spacing={2}>
						{/* Distribuição por etapa */}
						<Grid item xs={12} md={4} lg={4}>
							<Card
								sx={{
									backgroundColor:
										theme.palette.background.default,
									height: "100%",
									display: "flex",
									flexDirection: "column",
									width: { xs: "100%", md: 406 },
								}}
							>
								<CardContent
									sx={{
										display: "flex",
										flexDirection: "column",
										flexGrow: 1,
									}}
								>
									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Distribuição por etapa {faseLabel}
									</Typography>
									<Box sx={{ minHeight: 260, flexGrow: 1 }}>
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<PieChart>
												<Tooltip
													wrapperStyle={{
														outline: "none",
													}}
													contentStyle={{
														backgroundColor:
															theme.palette
																.background
																.paper,
														border: `1px solid ${theme.palette.divider}`,
														color: theme.palette
															.text.primary,
													}}
													labelStyle={{
														color: theme.palette
															.text.secondary,
													}}
													itemStyle={{
														color: theme.palette
															.text.primary,
													}}
												/>
												<Legend
													verticalAlign="bottom"
													height={24}
												/>
												<Pie
													data={dadosEtapas}
													dataKey="value"
													nameKey="name"
													cx="50%"
													cy="45%"
													innerRadius={50}
													outerRadius={80}
													paddingAngle={2}
												>
													{dadosEtapas.map(
														(entry, index) => (
															<Cell
																key={`slice-orientador-${index}`}
																fill={
																	[
																		theme
																			.palette
																			.primary
																			.main,
																		theme
																			.palette
																			.secondary
																			.main,
																		theme
																			.palette
																			.success
																			.main,
																		theme
																			.palette
																			.warning
																			.main,
																		theme
																			.palette
																			.info
																			.main,
																		theme
																			.palette
																			.error
																			.main,
																	][index % 6]
																}
															/>
														),
													)}
												</Pie>
											</PieChart>
										</ResponsiveContainer>
									</Box>
								</CardContent>
							</Card>
						</Grid>
						{/* Convites orientação (donut) */}
						<Grid item xs={12} md={4} lg={4}>
							<Card
								sx={{
									backgroundColor:
										theme.palette.background.default,
									height: "100%",
									display: "flex",
									flexDirection: "column",
									width: { xs: "100%", md: 406 },
								}}
							>
								<CardContent>
									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Convites para orientação {faseLabel}
									</Typography>
									<Box sx={{ minHeight: 260 }}>
										{convitesOrientacaoStatus.total > 0 ? (
											<ResponsiveContainer
												width="100%"
												height={260}
											>
												<PieChart>
													<Tooltip
														wrapperStyle={{
															outline: "none",
														}}
														contentStyle={{
															backgroundColor:
																theme.palette
																	.background
																	.paper,
															border: `1px solid ${theme.palette.divider}`,
															color: theme.palette
																.text.primary,
														}}
														labelStyle={{
															color: theme.palette
																.text.secondary,
														}}
														itemStyle={{
															color: theme.palette
																.text.primary,
														}}
													/>
													<Legend
														verticalAlign="bottom"
														height={24}
													/>
													<Pie
														data={
															dadosConvitesDonut
														}
														dataKey="value"
														nameKey="name"
														cx="50%"
														cy="45%"
														innerRadius={50}
														outerRadius={80}
														paddingAngle={2}
													>
														{dadosConvitesDonut.map(
															(entry, index) => (
																<Cell
																	key={`slice-status-${index}`}
																	fill={
																		index ===
																		0
																			? theme
																					.palette
																					.primary
																					.main
																			: theme
																					.palette
																					.warning
																					.main
																	}
																/>
															),
														)}
													</Pie>
												</PieChart>
											</ResponsiveContainer>
										) : (
											<Box sx={{ p: 2 }}>
												<Typography
													variant="body2"
													color="text.secondary"
												>
													Sem convites para orientação
												</Typography>
											</Box>
										)}
									</Box>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Total:{" "}
										{convitesOrientacaoStatus.total || 0}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						{/* Convites banca (donut) */}
						<Grid item xs={12} md={4} lg={4}>
							<Card
								sx={{
									backgroundColor:
										theme.palette.background.default,
									height: "100%",
									display: "flex",
									flexDirection: "column",
									width: { xs: "100%", md: 406 },
								}}
							>
								<CardContent>
									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Convites de banca {faseLabel}
									</Typography>
									<Box sx={{ minHeight: 260 }}>
										{convitesBancaStatus.total > 0 ? (
											<ResponsiveContainer
												width="100%"
												height={260}
											>
												<PieChart>
													<Tooltip
														wrapperStyle={{
															outline: "none",
														}}
														contentStyle={{
															backgroundColor:
																theme.palette
																	.background
																	.paper,
															border: `1px solid ${theme.palette.divider}`,
															color: theme.palette
																.text.primary,
														}}
														labelStyle={{
															color: theme.palette
																.text.secondary,
														}}
														itemStyle={{
															color: theme.palette
																.text.primary,
														}}
													/>
													<Legend
														verticalAlign="bottom"
														height={24}
													/>
													<Pie
														data={
															dadosConvitesBancaDonut
														}
														dataKey="value"
														nameKey="name"
														cx="50%"
														cy="45%"
														innerRadius={50}
														outerRadius={80}
														paddingAngle={2}
													>
														{dadosConvitesBancaDonut.map(
															(entry, index) => (
																<Cell
																	key={`slice-banca-status-${index}`}
																	fill={
																		index ===
																		0
																			? theme
																					.palette
																					.primary
																					.main
																			: theme
																					.palette
																					.warning
																					.main
																	}
																/>
															),
														)}
													</Pie>
												</PieChart>
											</ResponsiveContainer>
										) : (
											<Box sx={{ p: 2 }}>
												<Typography
													variant="body2"
													color="text.secondary"
												>
													Sem convites de banca
												</Typography>
											</Box>
										)}
									</Box>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Total: {convitesBancaStatus.total || 0}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					</Grid>

					<Grid container spacing={2} sx={{ mt: 0 }}>
						{/* Convites enviados no período (linha) */}
						<Grid item xs={12} md={8}>
							<Card
								sx={{
									backgroundColor:
										theme.palette.background.default,
									height: "100%",
									display: "flex",
									flexDirection: "column",
									width: { xs: "100%", md: 666 },
								}}
							>
								<CardContent>
									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Convites enviados no período {faseLabel}
									</Typography>
									<Box sx={{ minHeight: 300 }}>
										{dadosConvites &&
										dadosConvites.length > 0 ? (
											<ResponsiveContainer
												width="100%"
												height={300}
											>
												<LineChart
													data={dadosConvites}
													margin={{
														top: 10,
														right: 20,
														left: 0,
														bottom: 0,
													}}
												>
													<CartesianGrid
														strokeDasharray="3 3"
														stroke={
															theme.palette
																.divider
														}
													/>
													<XAxis
														dataKey="data"
														ticks={ticksConvites}
														tick={{
															fill: theme.palette
																.text.secondary,
															fontSize: 11,
														}}
														axisLine={{
															stroke: theme
																.palette
																.divider,
														}}
														tickLine={{
															stroke: theme
																.palette
																.divider,
														}}
														tickFormatter={(v) => {
															if (!v) return v;
															const [y, m, d] =
																String(v).split(
																	"-",
																);
															return `${d}/${m}`;
														}}
													/>
													<YAxis
														allowDecimals={false}
														tick={{
															fill: theme.palette
																.text.secondary,
															fontSize: 11,
														}}
														axisLine={{
															stroke: theme
																.palette
																.divider,
														}}
														tickLine={{
															stroke: theme
																.palette
																.divider,
														}}
													/>
													<Tooltip
														wrapperStyle={{
															outline: "none",
														}}
														contentStyle={{
															backgroundColor:
																theme.palette
																	.background
																	.paper,
															border: `1px solid ${theme.palette.divider}`,
															color: theme.palette
																.text.primary,
														}}
														labelStyle={{
															color: theme.palette
																.text.secondary,
														}}
														itemStyle={{
															color: theme.palette
																.text.primary,
														}}
														labelFormatter={(
															label,
														) => {
															if (!label)
																return label;
															const [y, m, d] =
																String(
																	label,
																).split("-");
															return `${d}/${m}/${y}`;
														}}
													/>
													<Legend
														wrapperStyle={{
															color: theme.palette
																.text.secondary,
														}}
													/>
													<Line
														type="monotone"
														dataKey="orientacao"
														name="Orientação"
														stroke={
															theme.palette
																.success.main
														}
														strokeWidth={2}
														dot={false}
													/>
													<Line
														type="monotone"
														dataKey="banca"
														name="Banca"
														stroke={
															theme.palette
																.primary.main
														}
														strokeWidth={2}
														dot={false}
													/>
												</LineChart>
											</ResponsiveContainer>
										) : (
											<Box sx={{ p: 2 }}>
												<Typography
													variant="body2"
													color="text.secondary"
												>
													Sem dados de convites no
													período
												</Typography>
											</Box>
										)}
									</Box>
								</CardContent>
							</Card>
						</Grid>
						{/* Defesas agendadas */}
						<Grid item xs={12} md={4} lg={4}>
							<Card
								sx={{
									backgroundColor:
										theme.palette.background.default,
									height: "100%",
									display: "flex",
									flexDirection: "column",
									width: { xs: "100%", md: 666 },
								}}
							>
								<CardContent
									sx={{
										display: "flex",
										flexDirection: "column",
										flexGrow: 1,
									}}
								>
									<Typography
										variant="subtitle1"
										gutterBottom
									>
										Defesas agendadas
									</Typography>
									{(defesasAgendadas || []).length === 0 ? (
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ mt: 1 }}
										>
											Sem defesas agendadas
										</Typography>
									) : (
										<Box sx={{ mt: 1, flexGrow: 1 }}>
											<CustomDataGrid
												rows={defesasAgendadas}
												columns={[
													{
														field: "data",
														headerName: "Data",
														width: 110,
														renderCell: (
															params,
														) => {
															const [y, m, d] =
																String(
																	params.value ||
																		"",
																).split("-");
															const title = (
																<Box>
																	<Typography variant="subtitle2">
																		{params
																			.row
																			?.titulo ||
																			"Sem título"}
																	</Typography>
																	<Typography variant="body2">
																		Orientador:{" "}
																		{params
																			.row
																			?.orientador ||
																			"-"}
																	</Typography>
																	<Typography variant="body2">
																		Banca:{" "}
																		{(
																			params
																				.row
																				?.banca ||
																			[]
																		).join(
																			", ",
																		) ||
																			"-"}
																	</Typography>
																</Box>
															);
															return (
																<MuiTooltip
																	title={
																		title
																	}
																	arrow
																	placement="top-start"
																>
																	<div
																		style={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																			whiteSpace:
																				"nowrap",
																		}}
																	>
																		{params.value
																			? `${d}/${m}/${y}`
																			: ""}
																	</div>
																</MuiTooltip>
															);
														},
													},
													{
														field: "hora",
														headerName: "Hora",
														width: 90,
														renderCell: (
															params,
														) => {
															const title = (
																<Box>
																	<Typography variant="subtitle2">
																		{params
																			.row
																			?.titulo ||
																			"Sem título"}
																	</Typography>
																	<Typography variant="body2">
																		Orientador:{" "}
																		{params
																			.row
																			?.orientador ||
																			"-"}
																	</Typography>
																	<Typography variant="body2">
																		Banca:{" "}
																		{(
																			params
																				.row
																				?.banca ||
																			[]
																		).join(
																			", ",
																		) ||
																			"-"}
																	</Typography>
																</Box>
															);
															return (
																<MuiTooltip
																	title={
																		title
																	}
																	arrow
																	placement="top-start"
																>
																	<div
																		style={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																		}}
																	>
																		{params.value ||
																			""}
																	</div>
																</MuiTooltip>
															);
														},
													},
													{
														field: "fase_label",
														headerName: "Fase",
														width: 120,
														renderCell: (
															params,
														) => {
															const title = (
																<Box>
																	<Typography variant="subtitle2">
																		{params
																			.row
																			?.titulo ||
																			"Sem título"}
																	</Typography>
																	<Typography variant="body2">
																		Orientador:{" "}
																		{params
																			.row
																			?.orientador ||
																			"-"}
																	</Typography>
																	<Typography variant="body2">
																		Banca:{" "}
																		{(
																			params
																				.row
																				?.banca ||
																			[]
																		).join(
																			", ",
																		) ||
																			"-"}
																	</Typography>
																</Box>
															);
															return (
																<MuiTooltip
																	title={
																		title
																	}
																	arrow
																	placement="top-start"
																>
																	<div
																		style={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																		}}
																	>
																		{params.value ||
																			(params
																				.row
																				?.fase ===
																			1
																				? "Projeto"
																				: "TCC")}
																	</div>
																</MuiTooltip>
															);
														},
													},
													{
														field: "estudante",
														headerName: "Estudante",
														width: 220,
														renderCell: (
															params,
														) => {
															const title = (
																<Box>
																	<Typography variant="subtitle2">
																		{params
																			.row
																			?.titulo ||
																			"Sem título"}
																	</Typography>
																	<Typography variant="body2">
																		Orientador:{" "}
																		{params
																			.row
																			?.orientador ||
																			"-"}
																	</Typography>
																	<Typography variant="body2">
																		Banca:{" "}
																		{(
																			params
																				.row
																				?.banca ||
																			[]
																		).join(
																			", ",
																		) ||
																			"-"}
																	</Typography>
																</Box>
															);
															return (
																<MuiTooltip
																	title={
																		title
																	}
																	arrow
																	placement="top-start"
																>
																	<div
																		style={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																			whiteSpace:
																				"normal",
																			wordWrap:
																				"break-word",
																			lineHeight: 1.2,
																			width: "100%",
																			padding:
																				"4px 0",
																		}}
																	>
																		{
																			params.value
																		}
																	</div>
																</MuiTooltip>
															);
														},
													},
												]}
												pageSize={5}
												checkboxSelection={false}
												disableSelectionOnClick
												rowSpanning={false}
												getRowId={(row) =>
													`${row.data}-${row.hora}-${row.estudante}`
												}
												columnVisibilityModel={{}}
											/>
										</Box>
									)}
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				</>
			)}

			{/* Gráficos 2 e 3: Orientandos por docente e Defesas aceitas por docente lado a lado */}
			{(isAdmin || isProfessor) && (
				<Grid container spacing={2} sx={{ mt: 0 }}>
					{/* Gráfico 2: Barras horizontais - Orientandos por docente */}
					<Grid item xs={12} md={6} lg={6}>
						<Card
							sx={{
								backgroundColor:
									theme.palette.background.default,
								height: "100%",
								display: "flex",
								flexDirection: "column",
								width: { xs: "100%", md: 695 },
							}}
						>
							<CardContent>
								<Typography variant="subtitle1" gutterBottom>
									Orientandos por docente {faseLabel}
								</Typography>
								<Box sx={{ minHeight: 400 }}>
									<ResponsiveContainer
										width="100%"
										height={alturaDocentes}
									>
										<BarChart
											data={[...dadosDocentes].sort(
												(a, b) =>
													String(
														a.docente,
													).localeCompare(
														String(b.docente),
														"pt",
														{ sensitivity: "base" },
													),
											)}
											layout="vertical"
											margin={{
												top: 8,
												right: 8,
												left: 2,
												bottom: 8,
											}}
											barCategoryGap="12%"
											barGap={-2}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke={theme.palette.divider}
											/>
											<XAxis
												type="number"
												allowDecimals={false}
												tick={{
													fill: theme.palette.text
														.secondary,
													fontSize: 11,
												}}
												axisLine={{
													stroke: theme.palette
														.divider,
												}}
												tickLine={{
													stroke: theme.palette
														.divider,
												}}
											/>
											<YAxis
												type="category"
												dataKey="docente"
												width={160}
												tick={{
													fill: theme.palette.text
														.secondary,
													fontSize: 11,
												}}
												axisLine={{
													stroke: theme.palette
														.divider,
												}}
												tickLine={{
													stroke: theme.palette
														.divider,
												}}
											/>
											<Tooltip
												wrapperStyle={{
													outline: "none",
												}}
												contentStyle={{
													backgroundColor:
														theme.palette.background
															.paper,
													border: `1px solid ${theme.palette.divider}`,
													color: theme.palette.text
														.primary,
												}}
												labelStyle={{
													color: theme.palette.text
														.secondary,
												}}
												itemStyle={{
													color: theme.palette.text
														.primary,
												}}
											/>
											<Bar
												dataKey="quantidade"
												radius={[0, 4, 4, 0]}
												fill={
													theme.palette.primary.main
												}
											/>
										</BarChart>
									</ResponsiveContainer>
								</Box>
							</CardContent>
						</Card>
					</Grid>

					{/* Gráfico 3: Barras horizontais - Defesas aceitas por docente */}
					<Grid item xs={12} md={6} lg={6}>
						<Card
							sx={{
								backgroundColor:
									theme.palette.background.default,
								height: "100%",
								display: "flex",
								flexDirection: "column",
								width: { xs: "100%", md: 695 },
							}}
						>
							<CardContent>
								<Typography variant="subtitle1" gutterBottom>
									Bancas aceitas por docente {faseLabel}
								</Typography>
								<Box sx={{ minHeight: 400 }}>
									<ResponsiveContainer
										width="100%"
										height={alturaDefesas}
									>
										<BarChart
											data={[
												...dadosDefesasDocentes,
											].sort((a, b) =>
												String(a.docente).localeCompare(
													String(b.docente),
													"pt",
													{
														sensitivity: "base",
													},
												),
											)}
											layout="vertical"
											margin={{
												top: 8,
												right: 8,
												left: 2,
												bottom: 8,
											}}
											barCategoryGap="12%"
											barGap={-2}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke={theme.palette.divider}
											/>
											<XAxis
												type="number"
												allowDecimals={false}
												tick={{
													fill: theme.palette.text
														.secondary,
													fontSize: 11,
												}}
												axisLine={{
													stroke: theme.palette
														.divider,
												}}
												tickLine={{
													stroke: theme.palette
														.divider,
												}}
											/>
											<YAxis
												type="category"
												dataKey="docente"
												width={160}
												tick={{
													fill: theme.palette.text
														.secondary,
													fontSize: 11,
												}}
												axisLine={{
													stroke: theme.palette
														.divider,
												}}
												tickLine={{
													stroke: theme.palette
														.divider,
												}}
											/>
											<Tooltip
												wrapperStyle={{
													outline: "none",
												}}
												contentStyle={{
													backgroundColor:
														theme.palette.background
															.paper,
													border: `1px solid ${theme.palette.divider}`,
													color: theme.palette.text
														.primary,
												}}
												labelStyle={{
													color: theme.palette.text
														.secondary,
												}}
												itemStyle={{
													color: theme.palette.text
														.primary,
												}}
											/>
											<Bar
												dataKey="quantidade"
												radius={[0, 4, 4, 0]}
												fill={
													theme.palette.secondary.main
												}
											/>
										</BarChart>
									</ResponsiveContainer>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}

			{/* Gráfico 4: Linha - Convites enviados no período (por tipo) e Donuts de convites */}
			{(isAdmin ||
				isProfessor ||
				(isOrientador && !isOrientadorView)) && (
				<Grid container spacing={2} sx={{ mt: 0 }}>
					<Grid item xs={12} md={8}>
						<Card
							sx={{
								backgroundColor:
									theme.palette.background.default,
								height: "100%",
								display: "flex",
								flexDirection: "column",
								width: { xs: "100%", md: 560 },
							}}
						>
							<CardContent>
								<Typography variant="subtitle1" gutterBottom>
									Convites enviados no período {faseLabel}
								</Typography>
								<Box sx={{ minHeight: 300 }}>
									{dadosConvites &&
									dadosConvites.length > 0 ? (
										<ResponsiveContainer
											width="100%"
											height={300}
										>
											<LineChart
												data={dadosConvites}
												margin={{
													top: 10,
													right: 20,
													left: 0,
													bottom: 0,
												}}
											>
												<CartesianGrid
													strokeDasharray="3 3"
													stroke={
														theme.palette.divider
													}
												/>
												<XAxis
													dataKey="data"
													ticks={ticksConvites}
													tick={{
														fill: theme.palette.text
															.secondary,
														fontSize: 11,
													}}
													axisLine={{
														stroke: theme.palette
															.divider,
													}}
													tickLine={{
														stroke: theme.palette
															.divider,
													}}
													tickFormatter={(v) => {
														// v no formato YYYY-MM-DD -> DD/MM
														if (!v) return v;
														const [y, m, d] =
															String(v).split(
																"-",
															);
														return `${d}/${m}`;
													}}
												/>
												<YAxis
													allowDecimals={false}
													tick={{
														fill: theme.palette.text
															.secondary,
														fontSize: 11,
													}}
													axisLine={{
														stroke: theme.palette
															.divider,
													}}
													tickLine={{
														stroke: theme.palette
															.divider,
													}}
												/>
												<Tooltip
													wrapperStyle={{
														outline: "none",
													}}
													contentStyle={{
														backgroundColor:
															theme.palette
																.background
																.paper,
														border: `1px solid ${theme.palette.divider}`,
														color: theme.palette
															.text.primary,
													}}
													labelStyle={{
														color: theme.palette
															.text.secondary,
													}}
													itemStyle={{
														color: theme.palette
															.text.primary,
													}}
													labelFormatter={(label) => {
														if (!label)
															return label;
														const [y, m, d] =
															String(label).split(
																"-",
															);
														return `${d}/${m}/${y}`;
													}}
												/>
												<Legend
													wrapperStyle={{
														color: theme.palette
															.text.secondary,
													}}
												/>
												<Line
													type="monotone"
													dataKey="orientacao"
													name="Orientação"
													stroke={
														theme.palette.success
															.main
													}
													strokeWidth={2}
													dot={false}
												/>
												<Line
													type="monotone"
													dataKey="banca"
													name="Banca"
													stroke={
														theme.palette.primary
															.main
													}
													strokeWidth={2}
													dot={false}
												/>
											</LineChart>
										</ResponsiveContainer>
									) : (
										<Box sx={{ p: 2 }}>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												Sem dados de convites no período
											</Typography>
										</Box>
									)}
								</Box>
							</CardContent>
						</Card>
					</Grid>
					{/* Donut: Convites de orientação (respondidos x pendentes) ao lado */}
					<Grid item xs={12} md={4} lg={4}>
						<Card
							sx={{
								backgroundColor:
									theme.palette.background.default,
								height: "100%",
								display: "flex",
								flexDirection: "column",
								width: { xs: "100%", md: 406 },
							}}
						>
							<CardContent>
								<Typography variant="subtitle1" gutterBottom>
									Convites para orientação {faseLabel}
								</Typography>
								<Box sx={{ minHeight: 260 }}>
									{convitesOrientacaoStatus.total > 0 ? (
										<ResponsiveContainer
											width="100%"
											height={260}
										>
											<PieChart>
												<Tooltip
													wrapperStyle={{
														outline: "none",
													}}
													contentStyle={{
														backgroundColor:
															theme.palette
																.background
																.paper,
														border: `1px solid ${theme.palette.divider}`,
														color: theme.palette
															.text.primary,
													}}
													labelStyle={{
														color: theme.palette
															.text.secondary,
													}}
													itemStyle={{
														color: theme.palette
															.text.primary,
													}}
												/>
												<Legend
													verticalAlign="bottom"
													height={24}
												/>
												<Pie
													data={dadosConvitesDonut}
													dataKey="value"
													nameKey="name"
													cx="50%"
													cy="45%"
													innerRadius={50}
													outerRadius={80}
													paddingAngle={2}
												>
													{dadosConvitesDonut.map(
														(entry, index) => (
															<Cell
																key={`slice-status-${index}`}
																fill={
																	index === 0
																		? theme
																				.palette
																				.primary
																				.main
																		: theme
																				.palette
																				.warning
																				.main
																}
															/>
														),
													)}
												</Pie>
											</PieChart>
										</ResponsiveContainer>
									) : (
										<Box sx={{ p: 2 }}>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												Sem convites para orientação
											</Typography>
										</Box>
									)}
								</Box>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									Total: {convitesOrientacaoStatus.total || 0}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					{/* Donut: Convites de banca (respondidos x pendentes) */}
					<Grid item xs={12} md={4} lg={4}>
						<Card
							sx={{
								backgroundColor:
									theme.palette.background.default,
								height: "100%",
								display: "flex",
								flexDirection: "column",
								width: { xs: "100%", md: 406 },
							}}
						>
							<CardContent>
								<Typography variant="subtitle1" gutterBottom>
									Convites de banca {faseLabel}
								</Typography>
								<Box sx={{ minHeight: 260 }}>
									{convitesBancaStatus.total > 0 ? (
										<ResponsiveContainer
											width="100%"
											height={260}
										>
											<PieChart>
												<Tooltip
													wrapperStyle={{
														outline: "none",
													}}
													contentStyle={{
														backgroundColor:
															theme.palette
																.background
																.paper,
														border: `1px solid ${theme.palette.divider}`,
														color: theme.palette
															.text.primary,
													}}
													labelStyle={{
														color: theme.palette
															.text.secondary,
													}}
													itemStyle={{
														color: theme.palette
															.text.primary,
													}}
												/>
												<Legend
													verticalAlign="bottom"
													height={24}
												/>
												<Pie
													data={
														dadosConvitesBancaDonut
													}
													dataKey="value"
													nameKey="name"
													cx="50%"
													cy="45%"
													innerRadius={50}
													outerRadius={80}
													paddingAngle={2}
												>
													{dadosConvitesBancaDonut.map(
														(entry, index) => (
															<Cell
																key={`slice-banca-status-${index}`}
																fill={
																	index === 0
																		? theme
																				.palette
																				.primary
																				.main
																		: theme
																				.palette
																				.warning
																				.main
																}
															/>
														),
													)}
												</Pie>
											</PieChart>
										</ResponsiveContainer>
									) : (
										<Box sx={{ p: 2 }}>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												Sem convites de banca
											</Typography>
										</Box>
									)}
								</Box>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									Total: {convitesBancaStatus.total || 0}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}
		</Box>
	);
}
