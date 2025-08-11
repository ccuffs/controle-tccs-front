import React, { useEffect, useMemo, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	Grid,
	MenuItem,
	TextField,
	Typography,
} from "@mui/material";
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
	const [filtroFase, setFiltroFase] = useState("1");
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
				params.set("fase", String(filtroFase));

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

	const faseLabel = useMemo(
		() => (String(filtroFase) === "1" ? "Projeto" : "TCC"),
		[filtroFase],
	);

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 2 }}>
				Dashboard
			</Typography>

			{/* Filtros globais */}
			<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
				<TextField
					select
					label="Ano"
					size="small"
					value={filtroAno}
					onChange={(e) => setFiltroAno(e.target.value)}
					disabled={loadingFiltros}
					sx={{ minWidth: 140 }}
				>
					{anosUnicos.map((ano) => (
						<MenuItem key={ano} value={String(ano)}>
							{ano}
						</MenuItem>
					))}
				</TextField>

				<TextField
					select
					label="Semestre"
					size="small"
					value={filtroSemestre}
					onChange={(e) => setFiltroSemestre(e.target.value)}
					disabled={loadingFiltros}
					sx={{ minWidth: 160 }}
				>
					{semestresDisponiveis.map((s) => (
						<MenuItem key={s} value={String(s)}>
							{s}
						</MenuItem>
					))}
				</TextField>

				{(isAdmin || isProfessor) && (
					<TextField
						select
						label="Fase"
						size="small"
						value={filtroFase}
						onChange={(e) => setFiltroFase(e.target.value)}
						disabled={loadingFiltros}
						sx={{ minWidth: 160 }}
					>
						<MenuItem value="1">Projeto</MenuItem>
						<MenuItem value="2">TCC</MenuItem>
					</TextField>
				)}

				{/* Filtro de curso: obrigatório mostrar para ADMIN; opcional para PROFESSOR se houver múltiplos cursos */}
				{(isAdmin || (isProfessor && cursosUsuario?.length > 0)) && (
					<TextField
						select
						label={"Curso"}
						size="small"
						value={filtroCurso}
						onChange={(e) => setFiltroCurso(e.target.value)}
						disabled={loadingFiltros}
						sx={{ minWidth: 260 }}
					>
						{isAdmin && <MenuItem value="">Todos</MenuItem>}
						{(isAdmin ? todosCursos : cursosUsuario).length > 0 &&
							(isAdmin ? todosCursos : cursosUsuario).map((c) => (
								<MenuItem key={c.id} value={String(c.id)}>
									{c.nome}
								</MenuItem>
							))}
					</TextField>
				)}
			</Box>

            <Grid container spacing={2}>
                {/* Gráfico 1: Estudantes com orientador definido na oferta e Donut por etapa, lado a lado */}
                {(isAdmin || isProfessor) && (
                    <>
                    <Grid item xs={12} md={6} lg={6}>
                        <Card
                            sx={{
                                backgroundColor:
                                    theme.palette.background.default,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                width: { xs: "100%", md: 520 },
                            }}
                        >
                            <CardContent sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
								<Typography variant="subtitle1" gutterBottom>
									Estudantes com orientador definido ({faseLabel})
								</Typography>
                                <Box sx={{ minHeight: 260, flexGrow: 1 }}>
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<BarChart data={dadosBarra}>
											<CartesianGrid
												stroke={theme.palette.divider}
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
									Total: {dadosGraficoOrientador.total} | Com
									orientador:{" "}
									{dadosGraficoOrientador.comOrientador}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
                    {/* Donut por etapa ao lado */}
                    <Grid item xs={12} md={6} lg={6}>
                        <Card sx={{ backgroundColor: theme.palette.background.default, height: "100%", display: "flex", flexDirection: "column", width: { xs: "100%", md: 520 } }}>
                            <CardContent sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
								<Typography variant="subtitle1" gutterBottom>
									Distribuição por etapa ({faseLabel})
								</Typography>
                                <Box sx={{ minHeight: 260, flexGrow: 1 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip
                                                wrapperStyle={{ outline: "none" }}
                                                contentStyle={{
                                                    backgroundColor: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    color: theme.palette.text.primary,
                                                }}
                                                labelStyle={{ color: theme.palette.text.secondary }}
                                                itemStyle={{ color: theme.palette.text.primary }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={24}
                                                wrapperStyle={{ color: theme.palette.text.secondary }}
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
                                                {dadosEtapas.map((entry, index) => (
                                                    <Cell
                                                        key={`slice-${index}`}
                                                        fill={[
                                                            theme.palette.primary.main,
                                                            theme.palette.secondary.main,
                                                            theme.palette.success.main,
                                                            theme.palette.warning.main,
                                                            theme.palette.info.main,
                                                            theme.palette.error.main,
                                                        ][index % 6]}
                                                    />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    </>
                )}
            </Grid>

		</Box>
	);
}
