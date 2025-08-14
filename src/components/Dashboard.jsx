import React, { useEffect, useMemo, useState } from "react";
import {
	Box,
	Grid,
	Typography,
	Stack,
} from "@mui/material";
import axios from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";
import { Permissoes } from "../enums/permissoes";
import FiltrosPesquisa from "./FiltrosPesquisa";

// Componentes de gráficos
import GraficoEstudantesOrientador from "./GraficoEstudantesOrientador";
import GraficoDistribuicaoEtapas from "./GraficoDistribuicaoEtapas";
import TabelaDefesasAgendadas from "./TabelaDefesasAgendadas";
import GraficoConvitesOrientacao from "./GraficoConvitesOrientacao";
import GraficoConvitesBanca from "./GraficoConvitesBanca";
import GraficoConvitesPeriodo from "./GraficoConvitesPeriodo";
import GraficoOrientandosPorDocente from "./GraficoOrientandosPorDocente";
import GraficoDefesasPorDocente from "./GraficoDefesasPorDocente";

export default function Dashboard({ forceOrientador = false }) {
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
			<Stack spacing={2} sx={{ width: isOrientadorView ? 1340 : 1400 }}>
				<FiltrosPesquisa
					cursoSelecionado={filtroCurso}
					setCursoSelecionado={setFiltroCurso}
					ano={filtroAno}
					setAno={setFiltroAno}
					semestre={filtroSemestre}
					setSemestre={setFiltroSemestre}
					fase={filtroFase}
					setFase={setFiltroFase}
					cursos={isAdmin ? todosCursos : cursosUsuario}
					habilitarCurso={isAdmin || (isProfessor && cursosUsuario?.length > 0) || isOrientadorView}
					habilitarAno
					habilitarSemestre
					habilitarFase={isAdmin || isProfessor || isOrientadorView}
					mostrarTodosCursos={isAdmin}
					loading={loadingFiltros}
				/>
			</Stack>

			<Grid container spacing={2} sx={{ mt: 3 }}>
				{/* Gráfico 1: Estudantes com orientador definido na oferta e Donut por etapa, lado a lado */}
				{(isAdmin || isProfessor) && (
					<>
						<Grid item xs={12} md={4} lg={4}>
							<GraficoEstudantesOrientador
								dadosGraficoOrientador={dadosGraficoOrientador}
								faseLabel={faseLabel}
								largura={396}
							/>
						</Grid>
						{/* Donut por etapa ao lado */}
						<Grid item xs={12} md={4} lg={4}>
							<GraficoDistribuicaoEtapas
								dadosEtapas={dadosEtapas}
								faseLabel={faseLabel}
								largura={396}
							/>
						</Grid>
						{/* Tabela de Defesas agendadas ao lado */}
						<Grid item xs={12} md={4} lg={4}>
							<TabelaDefesasAgendadas
								defesasAgendadas={defesasAgendadas}
								largura={580}
							/>
						</Grid>
					</>
				)}
			</Grid>

			{/* Orientador (apenas quando forçado em ModuloOrientador):
          1ª linha → Etapas, Convites orientação, Convites banca
          2ª linha → Convites no período, Defesas agendadas */}
			{!isAdmin && !isProfessor && isOrientador && isOrientadorView && (
				<>
					<Grid container spacing={2} sx={{ mt: 3 }}>
						{/* Distribuição por etapa */}
						<Grid item xs={12} md={4} lg={4}>
							<GraficoDistribuicaoEtapas
								dadosEtapas={dadosEtapas}
								faseLabel={faseLabel}
							/>
						</Grid>
						{/* Convites orientação (donut) */}
						<Grid item xs={12} md={4} lg={4}>
							<GraficoConvitesOrientacao
								convitesOrientacaoStatus={
									convitesOrientacaoStatus
								}
								faseLabel={faseLabel}
							/>
						</Grid>
						{/* Convites banca (donut) */}
						<Grid item xs={12} md={4} lg={4}>
							<GraficoConvitesBanca
								convitesBancaStatus={convitesBancaStatus}
								faseLabel={faseLabel}
							/>
						</Grid>
					</Grid>

					<Grid container spacing={2} sx={{ mt: 3 }}>
						{/* Convites enviados no período (linha) */}
						<Grid item xs={12} md={8}>
							<GraficoConvitesPeriodo
								dadosConvites={dadosConvites}
								faseLabel={faseLabel}
								ticksConvites={ticksConvites}
							/>
						</Grid>
						{/* Defesas agendadas */}
						<Grid item xs={12} md={4} lg={4}>
							<TabelaDefesasAgendadas
								defesasAgendadas={defesasAgendadas}
								largura={666}
							/>
						</Grid>
					</Grid>
				</>
			)}

			{/* Gráficos 2 e 3: Orientandos por docente e Defesas aceitas por docente lado a lado */}
			{(isAdmin || isProfessor) && (
				<Grid container spacing={2} sx={{ mt: 3 }}>
					{/* Gráfico 2: Barras horizontais - Orientandos por docente */}
					<Grid item xs={12} md={6} lg={6}>
						<GraficoOrientandosPorDocente
							dadosDocentes={dadosDocentes}
							faseLabel={faseLabel}
							alturaDocentes={alturaDocentes}
						/>
					</Grid>

					{/* Gráfico 3: Barras horizontais - Defesas aceitas por docente */}
					<Grid item xs={12} md={6} lg={6}>
						<GraficoDefesasPorDocente
							dadosDefesasDocentes={dadosDefesasDocentes}
							faseLabel={faseLabel}
							alturaDefesas={alturaDefesas}
						/>
					</Grid>
				</Grid>
			)}

			{/* Gráfico 4: Linha - Convites enviados no período (por tipo) e Donuts de convites */}
			{(isAdmin ||
				isProfessor ||
				(isOrientador && !isOrientadorView)) && (
				<Grid container spacing={2} sx={{ mt: 3 }}>
					<Grid item xs={12} md={8}>
						<GraficoConvitesPeriodo
							dadosConvites={dadosConvites}
							faseLabel={faseLabel}
							ticksConvites={ticksConvites}
							largura={580}
						/>
					</Grid>
					{/* Donut: Convites de orientação (respondidos x pendentes) ao lado */}
					<Grid item xs={12} md={4} lg={4}>
						<GraficoConvitesOrientacao
							convitesOrientacaoStatus={convitesOrientacaoStatus}
							faseLabel={faseLabel}
							largura={396}
						/>
					</Grid>
					{/* Donut: Convites de banca (respondidos x pendentes) */}
					<Grid item xs={12} md={4} lg={4}>
						<GraficoConvitesBanca
							convitesBancaStatus={convitesBancaStatus}
							faseLabel={faseLabel}
							largura={396}
						/>
					</Grid>
				</Grid>
			)}
		</Box>
	);
}
