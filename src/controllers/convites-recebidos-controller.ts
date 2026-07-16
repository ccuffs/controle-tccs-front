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
	ano?: number;
	semestre?: number;
	titulo?: string | null;
}

interface ConviteLegado {
	fase?: number | string;
	orientacao?: boolean;
	mensagem_envio?: string;
	data_envio?: string;
	data_feedback?: string | null;
	trabalhoConclusao?: TrabalhoLegado;
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

/**
 * Filtra convites por curso
 */
export function filtrarPorCurso<T extends ConviteLegado>(
	convites: T[],
	cursoSelecionado: string | number | undefined,
): T[] {
	if (!cursoSelecionado) return convites;
	return convites.filter(
		(convite) =>
			convite?.trabalhoConclusao?.curso?.id === parseInt(String(cursoSelecionado)),
	);
}

/**
 * Filtra convites por ano
 */
export function filtrarPorAno<T extends ConviteLegado>(
	convites: T[],
	ano: string | number | undefined,
): T[] {
	if (!ano) return convites;
	return convites.filter(
		(convite) => convite?.trabalhoConclusao?.ano === parseInt(String(ano)),
	);
}

/**
 * Filtra convites por semestre
 */
export function filtrarPorSemestre<T extends ConviteLegado>(
	convites: T[],
	semestre: string | number | undefined,
): T[] {
	if (!semestre) return convites;
	return convites.filter(
		(convite) =>
			convite?.trabalhoConclusao?.semestre === parseInt(String(semestre)),
	);
}

/**
 * Filtra convites por fase
 */
export function filtrarPorFase<T extends ConviteLegado>(
	convites: T[],
	fase: string | number | undefined,
): T[] {
	if (fase === "") return convites;
	return convites.filter(
		(convite) => convite?.fase === parseInt(String(fase)),
	);
}

/**
 * Aplica todos os filtros aos convites
 */
export function aplicarFiltros<T extends ConviteLegado>(
	convites: T[],
	{ cursoSelecionado, ano, semestre, fase }: FiltrosConvites,
): T[] {
	let convitesFiltrados = convites;

	if (cursoSelecionado) {
		convitesFiltrados = filtrarPorCurso(
			convitesFiltrados,
			cursoSelecionado,
		);
	}

	if (ano) {
		convitesFiltrados = filtrarPorAno(convitesFiltrados, ano);
	}

	if (semestre) {
		convitesFiltrados = filtrarPorSemestre(convitesFiltrados, semestre);
	}

	if (fase !== "") {
		convitesFiltrados = filtrarPorFase(convitesFiltrados, fase);
	}

	return convitesFiltrados;
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
	return convites.map((convite) => ({
		...convite,
		nomeDicente: convite?.trabalhoConclusao?.dicente?.nome || "N/A",
		matriculaDicente:
			convite?.trabalhoConclusao?.dicente?.matricula || "N/A",
		tituloTcc: convite?.trabalhoConclusao?.titulo || "N/A",
		nomeCurso: convite?.trabalhoConclusao?.curso?.nome || "N/A",
		mensagemEnvio: convite?.mensagem_envio || "Sem mensagem",
		dataEnvio: formatarData(convite?.data_envio) || "N/A",
		dataFeedback: formatarData(convite?.data_feedback),
		foiRespondido: !!convite?.data_feedback,
		faseDescricao: obterDescricaoFase(convite?.fase, convite?.orientacao),
	}));
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
	obterDescricaoFase,
	formatarData,
	prepararConvitesParaGrid,
	ordenarConvites,
	processarConvitesParaGrid,
	extrairCursos,
};

export default convitesRecebidosController;
