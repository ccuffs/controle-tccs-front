interface CursoLegado {
	id?: number;
	nome?: string | null;
}

interface DicenteLegado {
	nome?: string | null;
	matricula?: string;
}

interface TrabalhoLegado {
	curso?: CursoLegado;
	dicente?: DicenteLegado;
	id_curso?: number;
	ano?: number | string;
	semestre?: number | string;
	titulo?: string | null;
}

interface ConviteLegado {
	fase?: number | string;
	orientacao?: boolean;
	mensagem_envio?: string;
	data_envio?: string;
	data_feedback?: string | null;
	trabalhoConclusao?: TrabalhoLegado;
	TrabalhoConclusao?: TrabalhoLegado;
	trabalho_conclusao?: TrabalhoLegado;
}

export interface JanelaPeriodoConvite {
	ano: number | string;
	semestre: number | string;
	inicio?: string | Date | null;
	fim?: string | Date | null;
}

interface ConviteProcessado extends ConviteLegado {
	nomeDicente: string;
	matriculaDicente: string;
	tituloTcc: string;
	nomeCurso: string;
	mensagemEnvio: string;
	dataEnvio: string;
	dataFeedback: string | null;
	foiRespondido: boolean;
	faseDescricao: string;
}

interface FiltrosConvites {
	cursoSelecionado?: string | number;
	ano?: string | number;
	semestre?: string | number;
	fase?: string | number;
}

interface OrientacaoComCurso {
	curso?: unknown;
}

/**
 * Obtém o ano e semestre atual
 */
export function getAnoSemestreAtual(): { ano: number; semestre: number } {
	const data = new Date();
	const ano = data.getFullYear();
	const semestre = data.getMonth() < 6 ? 1 : 2;
	return { ano, semestre };
}

function filtroEstaAtivo(valor: string | number | null | undefined): boolean {
	return valor !== "" && valor !== null && valor !== undefined;
}

function obterTrabalhoConvite(
	convite: ConviteLegado,
): TrabalhoLegado | undefined {
	return (
		convite.trabalhoConclusao ??
		convite.TrabalhoConclusao ??
		convite.trabalho_conclusao
	);
}

function toDateOnly(valor: string | Date | null | undefined): string | null {
	if (!valor) return null;
	if (typeof valor === "string") {
		const ymd = valor.match(/^(\d{4}-\d{2}-\d{2})/);
		if (ymd?.[1]) return ymd[1];
		const dt = new Date(valor);
		if (Number.isNaN(dt.getTime())) return null;
		const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
		const d = String(dt.getUTCDate()).padStart(2, "0");
		return `${dt.getUTCFullYear()}-${m}-${d}`;
	}
	const dt = new Date(valor);
	if (Number.isNaN(dt.getTime())) return null;
	const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
	const d = String(dt.getUTCDate()).padStart(2, "0");
	return `${dt.getUTCFullYear()}-${m}-${d}`;
}

function dataEstaNoIntervalo(
	data: string,
	inicio: string | Date | null | undefined,
	fim: string | Date | null | undefined,
): boolean {
	const d = toDateOnly(data);
	const i = toDateOnly(inicio);
	const f = toDateOnly(fim);
	if (!d || !i || !f) return false;
	return d >= i && d <= f;
}

/**
 * Período do convite: janela acadêmica da data de envio, senão o mês
 * do envio, senão o TCC. O semestre do TCC pode ter avançado
 * (ex.: projeto em 2026/1 e TCC em 2026/2) sem que o convite pertença
 * ao período atual.
 */
export function obterPeriodoConvite(
	convite: ConviteLegado,
	janelas: JanelaPeriodoConvite[] = [],
): { ano: number; semestre: number } | null {
	const dataEnvio = toDateOnly(convite.data_envio);
	if (dataEnvio && janelas.length > 0) {
		const match = janelas.find((j) =>
			dataEstaNoIntervalo(dataEnvio, j.inicio, j.fim),
		);
		if (match) {
			return { ano: Number(match.ano), semestre: Number(match.semestre) };
		}
	}

	if (dataEnvio) {
		const [anoEnvio, mesEnvio] = dataEnvio.split("-").map(Number);
		if (anoEnvio && mesEnvio) {
			return { ano: anoEnvio, semestre: mesEnvio <= 6 ? 1 : 2 };
		}
	}

	const tcc = obterTrabalhoConvite(convite);
	if (tcc?.ano != null && tcc?.semestre != null) {
		return { ano: Number(tcc.ano), semestre: Number(tcc.semestre) };
	}
	return null;
}

function conviteAtendeFiltros(
	convite: ConviteLegado,
	{ cursoSelecionado, ano, semestre, fase }: FiltrosConvites,
	janelas: JanelaPeriodoConvite[] = [],
): boolean {
	// A opção "Orientação" (fase 0) foi removida do filtro: "Todas" não a inclui.
	if (Number(convite.fase) === 0) return false;

	const tcc = obterTrabalhoConvite(convite);
	if (
		filtroEstaAtivo(cursoSelecionado) &&
		Number(tcc?.curso?.id ?? tcc?.id_curso) !== Number(cursoSelecionado)
	) {
		return false;
	}

	const periodo = obterPeriodoConvite(convite, janelas);
	if (filtroEstaAtivo(ano) || filtroEstaAtivo(semestre)) {
		if (!periodo) return false;
		if (filtroEstaAtivo(ano) && Number(periodo.ano) !== Number(ano)) {
			return false;
		}
		if (
			filtroEstaAtivo(semestre) &&
			Number(periodo.semestre) !== Number(semestre)
		) {
			return false;
		}
	}

	if (filtroEstaAtivo(fase) && Number(convite.fase) !== Number(fase)) {
		return false;
	}

	return true;
}

/**
 * Filtra convites por curso
 */
export function filtrarPorCurso<T extends ConviteLegado>(
	convites: T[],
	cursoSelecionado: string | number | undefined,
): T[] {
	if (!filtroEstaAtivo(cursoSelecionado)) return convites;
	return convites.filter((convite) => {
		const tcc = obterTrabalhoConvite(convite);
		return Number(tcc?.curso?.id ?? tcc?.id_curso) === Number(cursoSelecionado);
	});
}

/**
 * Filtra convites por ano
 */
export function filtrarPorAno<T extends ConviteLegado>(
	convites: T[],
	ano: string | number | undefined,
	janelas: JanelaPeriodoConvite[] = [],
): T[] {
	if (!filtroEstaAtivo(ano)) return convites;
	return convites.filter((convite) => {
		const periodo = obterPeriodoConvite(convite, janelas);
		return periodo != null && Number(periodo.ano) === Number(ano);
	});
}

/**
 * Filtra convites por semestre
 */
export function filtrarPorSemestre<T extends ConviteLegado>(
	convites: T[],
	semestre: string | number | undefined,
	janelas: JanelaPeriodoConvite[] = [],
): T[] {
	if (!filtroEstaAtivo(semestre)) return convites;
	return convites.filter((convite) => {
		const periodo = obterPeriodoConvite(convite, janelas);
		return periodo != null && Number(periodo.semestre) === Number(semestre);
	});
}

/**
 * Filtra convites por fase
 */
export function filtrarPorFase<T extends ConviteLegado>(
	convites: T[],
	fase: string | number | undefined,
): T[] {
	if (!filtroEstaAtivo(fase)) {
		return convites.filter((convite) => Number(convite.fase) !== 0);
	}
	return convites.filter(
		(convite) => Number(convite.fase) === Number(fase),
	);
}

/**
 * Aplica todos os filtros aos convites
 */
export function aplicarFiltros<T extends ConviteLegado>(
	convites: T[],
	filtros: FiltrosConvites,
	janelas: JanelaPeriodoConvite[] = [],
): T[] {
	return convites.filter((convite) =>
		conviteAtendeFiltros(convite, filtros, janelas),
	);
}

/**
 * Mapeia fase para texto descritivo.
 * Convites com orientacao === false são convites para participação em banca.
 */
export function obterDescricaoFase(
	fase: number | string | undefined,
	orientacao: boolean | undefined,
): string {
	if (orientacao === false) return "Banca";
	switch (fase) {
		case 0:
			return "Orientação";
		case 1:
			return "Projeto";
		case 2:
			return "TCC";
		default:
			return `Fase ${fase || 0}`;
	}
}

/**
 * Formata data para exibição
 */
export function formatarData(data: string | null | undefined): string | null {
	if (!data) return null;
	return new Date(data).toLocaleDateString("pt-BR");
}

/**
 * Prepara dados dos convites para exibição no grid
 */
export function prepararConvitesParaGrid(
	convites: ConviteLegado[],
): ConviteProcessado[] {
	return convites.map((convite) => {
		const tcc = obterTrabalhoConvite(convite);
		return {
			...convite,
			trabalhoConclusao: tcc,
			nomeDicente: tcc?.dicente?.nome || "N/A",
			matriculaDicente: tcc?.dicente?.matricula || "N/A",
			tituloTcc: tcc?.titulo || "N/A",
			nomeCurso: tcc?.curso?.nome || "N/A",
			mensagemEnvio: convite?.mensagem_envio || "Sem mensagem",
			dataEnvio: formatarData(convite?.data_envio) || "N/A",
			dataFeedback: formatarData(convite?.data_feedback),
			foiRespondido: !!convite?.data_feedback,
			faseDescricao: obterDescricaoFase(convite?.fase, convite?.orientacao),
		};
	});
}

/**
 * Ordena convites para exibição
 * Prioriza convites não respondidos, depois ordena por nome do estudante e data de envio
 */
export function ordenarConvites(
	convites: ConviteProcessado[],
): ConviteProcessado[] {
	return convites.sort((a, b) => {
		// Primeiro ordenar por status (não respondidos primeiro)
		const statusA = a.foiRespondido ? 1 : 0;
		const statusB = b.foiRespondido ? 1 : 0;
		if (statusA !== statusB) {
			return statusA - statusB;
		}

		// Se mesmo status, ordenar por nome do estudante
		const nomeA = a.nomeDicente || "";
		const nomeB = b.nomeDicente || "";
		if (nomeA !== nomeB) {
			return nomeA.localeCompare(nomeB);
		}

		// Se mesmo estudante, ordenar por data de envio
		return (
			new Date(String(a.data_envio || 0)).getTime() -
			new Date(String(b.data_envio || 0)).getTime()
		);
	});
}

/**
 * Processa e prepara convites completos para o grid
 */
export function processarConvitesParaGrid(
	convites: ConviteLegado[],
): ConviteProcessado[] {
	const convitesPreparados = prepararConvitesParaGrid(convites);
	return ordenarConvites(convitesPreparados);
}

/**
 * Extrai cursos das orientações
 */
export function extrairCursos(orientacoes: OrientacaoComCurso[]): unknown[] {
	return orientacoes.map((orientacao) => orientacao.curso);
}

// Exportação padrão
const convitesRecebidosController = {
	getAnoSemestreAtual,
	filtrarPorCurso,
	filtrarPorAno,
	filtrarPorSemestre,
	filtrarPorFase,
	aplicarFiltros,
	obterPeriodoConvite,
	obterDescricaoFase,
	formatarData,
	prepararConvitesParaGrid,
	ordenarConvites,
	processarConvitesParaGrid,
	extrairCursos,
};

export default convitesRecebidosController;
