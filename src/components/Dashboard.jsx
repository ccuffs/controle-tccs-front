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

export default function Dashboard() {
	const theme = useTheme();
	const { gruposUsuario, usuario } = useAuth();
	const isAdmin = useMemo(
		() => gruposUsuario?.some((g) => g.id === Permissoes.GRUPOS.ADMIN),
		[gruposUsuario],
	);
	const isProfessor = useMemo(
		() => gruposUsuario?.some((g) => g.id === Permissoes.GRUPOS.PROFESSOR),
		[gruposUsuario],
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
	const [dadosDocentes, setDadosDocentes] = useState([]);
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

				// cursos do usuário (para professor)
				const cursos = usuario?.cursos || [];
				setCursosUsuario(cursos);
				if (!isAdmin && isProfessor && cursos.length > 0) {
					setFiltroCurso(String(cursos[0].id));
				}

				// cursos (admin) - listar todos
				try {
					const cursosResp = await axios.get(`/cursos`);
					setTodosCursos(cursosResp?.cursos || []);
				} catch (_) {
					setTodosCursos([]);
				}
			} finally {
				if (ativo) setLoadingFiltros(false);
			}
		})();
		return () => {
			ativo = false;
		};
	}, [isAdmin, isProfessor, usuario]);

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
				}

				const dados = await axios.get(
					`/dashboard/orientadores-definidos?${params.toString()}`,
				);
				if (!ativo) return;
				setDadosGraficoOrientador({
					total: dados.total || 0,
					comOrientador: dados.comOrientador || 0,
				});

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

				// Buscar orientandos por docente (barras horizontais)
				// Mostrar TODOS os docentes: não enviar id_curso neste endpoint
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

				// Buscar defesas aceitas por docente (barras horizontais)
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
		if (!v) return "Todas";
		return v === "1" ? "Projeto" : "TCC";
	}, [filtroFase]);

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

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 2 }}>
				Dashboard
			</Typography>

			{/* Filtros globais */}
			<Stack spacing={2} sx={{ width: 1450 }}>
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
									width: { xs: "100%", md: 420 },
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
										Estudantes com orientador definido (
										{faseLabel})
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
									width: { xs: "100%", md: 420 },
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
										Distribuição por etapa ({faseLabel})
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
									width: { xs: "100%", md: 580 },
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
												autoHeight
												checkboxSelection={false}
												disableSelectionOnClick
												rowSpanning={false}
												getRowId={(row) =>
													`${row.data}-${row.hora}-${row.estudante}`
												}
												getRowHeight={() => "auto"}
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
								width: { xs: "100%", md: 720 },
							}}
						>
							<CardContent>
								<Typography variant="subtitle1" gutterBottom>
									Orientandos por docente ({faseLabel})
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
								width: { xs: "100%", md: 720 },
							}}
						>
							<CardContent>
								<Typography variant="subtitle1" gutterBottom>
									Defesas aceitas por docente ({faseLabel})
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

			{/* Gráfico 4: Linha - Convites enviados no período (por tipo) */}
			{(isAdmin || isProfessor) && (
				<Grid container spacing={2} sx={{ mt: 0 }}>
					<Grid item xs={12}>
						<Card
							sx={{
								backgroundColor:
									theme.palette.background.default,
								height: "100%",
								display: "flex",
								flexDirection: "column",
								width: { xs: "100%", md: 720 },
							}}
						>
							<CardContent>
								<Typography variant="subtitle1" gutterBottom>
									Convites enviados no período ({faseLabel})
								</Typography>
								<Box sx={{ minHeight: 300 }}>
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
												stroke={theme.palette.divider}
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
														String(v).split("-");
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
												labelFormatter={(label) => {
													if (!label) return label;
													const [y, m, d] =
														String(label).split(
															"-",
														);
													return `${d}/${m}/${y}`;
												}}
											/>
											<Legend
												wrapperStyle={{
													color: theme.palette.text
														.secondary,
												}}
											/>
											<Line
												type="monotone"
												dataKey="orientacao"
												name="Orientação"
												stroke={
													theme.palette.success.main
												}
												strokeWidth={2}
												dot={false}
											/>
											<Line
												type="monotone"
												dataKey="banca"
												name="Banca"
												stroke={
													theme.palette.primary.main
												}
												strokeWidth={2}
												dot={false}
											/>
										</LineChart>
									</ResponsiveContainer>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}
		</Box>
	);
}
