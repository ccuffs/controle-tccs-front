import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Permissoes } from "../enums/permissoes";
import dashboardService from "../services/dashboard-service";
import dashboardController from "../controllers/dashboard-controller";
import cursosService from "../services/cursos-service";
import type { Curso } from "../types/curso";
import type {
	ConvitesStatusResponse,
	OrientadoresDefinidosResponse,
	DefesaAgendada,
	EstudanteSemConviteBanca,
	DocenteSemDisponibilidadeBanca,
} from "../types/dashboard";

export function useDashboard({ forceOrientador = false }: { forceOrientador?: boolean } = {}) {
	const { gruposUsuario, usuario } = useAuth();

	// Verificações de permissões
	const isAdmin = useMemo(
		() =>
			!forceOrientador &&
			gruposUsuario?.some((g) => g.id === Permissoes.GRUPOS.ADMIN),
		[gruposUsuario, forceOrientador],
	);

	const isProfessor = useMemo(
		() =>
			!forceOrientador &&
			gruposUsuario?.some((g) => g.id === Permissoes.GRUPOS.PROFESSOR_CCR),
		[gruposUsuario, forceOrientador],
	);

	const isOrientador = useMemo(
		() =>
			forceOrientador ||
			gruposUsuario?.some((g) => g.id === Permissoes.GRUPOS.ORIENTADOR),
		[gruposUsuario, forceOrientador],
	);

	const isOrientadorView = useMemo(
		() => !!forceOrientador,
		[forceOrientador],
	);

	// Estados de filtros
	const [anosSemestres, setAnosSemestres] = useState<{ ano: number; semestre: number }[]>([]);
	const [filtroAno, setFiltroAno] = useState<string | number>("");
	const [filtroSemestre, setFiltroSemestre] = useState<string | number>("");
	const [filtroFase, setFiltroFase] = useState<string | number>("");
	const [filtroCurso, setFiltroCurso] = useState<string | number>("");
	const [cursosUsuario, setCursosUsuario] = useState<{ id: number }[]>([]);
	const [todosCursos, setTodosCursos] = useState<Curso[]>([]);

	// Estados de loading
	const [loadingFiltros, setLoadingFiltros] = useState(true);
	const [loadingGrafico, setLoadingGrafico] = useState(false);

	// Estados de dados
	const [dadosGraficoOrientador, setDadosGraficoOrientador] =
		useState<OrientadoresDefinidosResponse>({
			total: 0,
			comOrientador: 0,
		});
	const [dadosEtapas, setDadosEtapas] = useState<
		{ name: string; value: number; etapa: number }[]
	>([]);
	const [dadosConvites, setDadosConvites] = useState<{ data: string }[]>([]);
	const [convitesOrientacaoStatus, setConvitesOrientacaoStatus] =
		useState<ConvitesStatusResponse>({
			respondidos: 0,
			pendentes: 0,
			total: 0,
		});
	const [dadosDocentes, setDadosDocentes] = useState<
		{ docente: string | undefined; quantidade: number }[]
	>([]);
	const [convitesBancaStatus, setConvitesBancaStatus] =
		useState<ConvitesStatusResponse>({
			respondidos: 0,
			pendentes: 0,
			total: 0,
		});
	const [dadosDefesasDocentes, setDadosDefesasDocentes] = useState<
		{ docente: string | undefined; quantidade: number }[]
	>([]);
	const [defesasAgendadas, setDefesasAgendadas] = useState<DefesaAgendada[]>([]);
	const [estudantesSemConviteBanca, setEstudantesSemConviteBanca] = useState<
		EstudanteSemConviteBanca[]
	>([]);
	const [docentesSemDisponibilidadeBanca, setDocentesSemDisponibilidadeBanca] =
		useState<DocenteSemDisponibilidadeBanca[]>([]);

	// Calcular alturas dinâmicas
	const alturaDocentes = useMemo(() => {
		return dashboardController.calculateHeight(dadosDocentes);
	}, [dadosDocentes]);

	const alturaDefesas = useMemo(() => {
		return dashboardController.calculateHeight(dadosDefesasDocentes);
	}, [dadosDefesasDocentes]);

	// Extrair anos únicos
	const anosUnicos = useMemo(() => {
		return dashboardController.extractAnosUnicos(anosSemestres);
	}, [anosSemestres]);

	// Label da fase
	const faseLabel = useMemo(() => {
		return dashboardController.getFaseLabel(filtroFase);
	}, [filtroFase]);

	// Ticks do gráfico de convites
	const ticksConvites = useMemo(() => {
		return dashboardController.generateTicksConvites(dadosConvites);
	}, [dadosConvites]);

	// Carregar filtros iniciais e cursos
	useEffect(() => {
		let ativo = true;

		(async () => {
			try {
				setLoadingFiltros(true);
				const [atual, lista] = await Promise.all([
					dashboardService.getAnoSemestreAtual(),
					dashboardService.getAnoSemestres(),
				]);

				if (!ativo) return;
				setAnosSemestres(lista || []);
				setFiltroAno(String(atual.ano));
				setFiltroSemestre(String(atual.semestre));

				// Carregar cursos conforme perfil
				if (isAdmin) {
					try {
						const cursosResp = await cursosService.getCursos();
						setTodosCursos(cursosResp || []);
					} catch (_) {
						setTodosCursos([]);
					}
				} else if (isProfessor) {
					const cursos = usuario?.cursos || [];
					setCursosUsuario(cursos);
					if (cursos.length === 1)
						setFiltroCurso(String(cursos[0]?.id));
				} else if (isOrientador) {
					try {
						const codigoDocente = usuario?.id;
						if (!codigoDocente) throw new Error("Usuário sem id");
						const resp =
							await dashboardService.getOrientacoesPorDocente(
								codigoDocente,
							);
						const orientacoes = resp?.orientacoes || [];
						const listaCursos =
							dashboardController.extractCursosFromOrientacoes(
								orientacoes,
							) as { id: number }[];
						setCursosUsuario(listaCursos);
						if (listaCursos.length === 1)
							setFiltroCurso(String(listaCursos[0]?.id));
					} catch (_) {
						setCursosUsuario([]);
					}
				}
			} catch (error) {
				console.error("Erro ao carregar filtros:", error);
			} finally {
				if (ativo) setLoadingFiltros(false);
			}
		})();

		return () => {
			ativo = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAdmin, isProfessor, isOrientador]);

	// Carregar dados dos gráficos
	useEffect(() => {
		if (!filtroAno || !filtroSemestre) return;
		let ativo = true;

		(async () => {
			try {
				setLoadingGrafico(true);

				// Preparar parâmetros base
				const params = dashboardController.buildQueryParams({
					ano: filtroAno,
					semestre: filtroSemestre,
					fase: filtroFase,
				});

				// Adicionar filtros específicos por perfil
				if (isAdmin) {
					if (filtroCurso)
						params.set("id_curso", String(filtroCurso));
				} else if (isProfessor) {
					if (filtroCurso)
						params.set("id_curso", String(filtroCurso));
					else if (cursosUsuario?.[0]?.id)
						params.set("id_curso", String(cursosUsuario[0].id));
				} else if (isOrientador) {
					const codigoDocente = usuario?.id;
					if (codigoDocente)
						params.set("codigo_docente", String(codigoDocente));
					if (filtroCurso)
						params.set("id_curso", String(filtroCurso));
					else if (cursosUsuario?.[0]?.id)
						params.set("id_curso", String(cursosUsuario[0].id));
				}

				// Buscar todos os dados em paralelo
				const [
					orientadores,
					etapas,
					defesas,
					convites,
					convitesOrientacao,
					convitesBanca,
					semConviteBanca,
					semDisponibilidadeBanca,
				] = await Promise.allSettled([
					dashboardService.getOrientadoresDefinidos(params),
					dashboardService.getTccPorEtapa(params),
					dashboardService.getDefesasAgendadas(params),
					dashboardService.getConvitesPorPeriodo(params),
					dashboardService.getConvitesOrientacaoStatus(params),
					dashboardService.getConvitesBancaStatus(params),
					dashboardService.getEstudantesSemConviteBanca(params),
					dashboardService.getDocentesSemDisponibilidadeBanca(params),
				]);

				if (!ativo) return;

				// Processar resultados
				if (orientadores.status === "fulfilled") {
					setDadosGraficoOrientador(
						dashboardController.prepareOrientadoresDefinidosData(
							orientadores.value,
						),
					);
				}

				if (etapas.status === "fulfilled") {
					setDadosEtapas(
						dashboardController.prepareEtapasData(etapas.value),
					);
				}

				if (defesas.status === "fulfilled") {
					setDefesasAgendadas(defesas.value.itens || []);
				}

				if (convites.status === "fulfilled") {
					setDadosConvites(
						dashboardController.prepareConvitesData(convites.value),
					);
				}

				if (convitesOrientacao.status === "fulfilled") {
					setConvitesOrientacaoStatus(
						dashboardController.prepareConvitesOrientacaoStatus(
							convitesOrientacao.value,
						),
					);
				}

				if (convitesBanca.status === "fulfilled") {
					setConvitesBancaStatus(
						dashboardController.prepareConvitesBancaStatus(
							convitesBanca.value,
						),
					);
				}

				if (semConviteBanca.status === "fulfilled") {
					setEstudantesSemConviteBanca(
						dashboardController.prepareEstudantesSemConviteBanca(
							semConviteBanca.value,
						),
					);
				}

				if (semDisponibilidadeBanca.status === "fulfilled") {
					setDocentesSemDisponibilidadeBanca(
						dashboardController.prepareDocentesSemDisponibilidadeBanca(
							semDisponibilidadeBanca.value,
						),
					);
				}

				// Buscar dados por docente apenas para Admin/Professor
				if (isAdmin || isProfessor) {
					const [orientandos, defesasDocente] =
						await Promise.allSettled([
							dashboardService.getOrientandosPorDocente(params),
							dashboardService.getDefesasAceitasPorDocente(
								params,
							),
						]);

					if (!ativo) return;

					if (orientandos.status === "fulfilled") {
						setDadosDocentes(
							dashboardController.prepareOrientandosPorDocente(
								orientandos.value,
							),
						);
					}

					if (defesasDocente.status === "fulfilled") {
						setDadosDefesasDocentes(
							dashboardController.prepareDefesasPorDocente(
								defesasDocente.value,
							),
						);
					}
				} else {
					setDadosDocentes([]);
					setDadosDefesasDocentes([]);
				}
			} catch (error) {
				console.error("Erro ao carregar dados do dashboard:", error);
			} finally {
				if (ativo) setLoadingGrafico(false);
			}
		})();

		return () => {
			ativo = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		filtroAno,
		filtroSemestre,
		filtroCurso,
		filtroFase,
		isAdmin,
		isProfessor,
		isOrientador,
		cursosUsuario,
		usuario,
	]);

	return {
		// Permissões
		isAdmin,
		isProfessor,
		isOrientador,
		isOrientadorView,

		// Filtros
		anosSemestres,
		filtroAno,
		setFiltroAno,
		filtroSemestre,
		setFiltroSemestre,
		filtroFase,
		setFiltroFase,
		filtroCurso,
		setFiltroCurso,
		cursosUsuario,
		todosCursos,

		// Loading
		loadingFiltros,
		loadingGrafico,

		// Dados
		dadosGraficoOrientador,
		dadosEtapas,
		dadosConvites,
		convitesOrientacaoStatus,
		dadosDocentes,
		convitesBancaStatus,
		dadosDefesasDocentes,
		defesasAgendadas,
		estudantesSemConviteBanca,
		docentesSemDisponibilidadeBanca,

		// Calculados
		alturaDocentes,
		alturaDefesas,
		anosUnicos,
		faseLabel,
		ticksConvites,
	};
}
