/**
 * Obtém o ano e semestre atual
 */
export function getAnoSemestreAtual() {
	const data = new Date();
	const ano = data.getFullYear();
	const semestre = data.getMonth() < 6 ? 1 : 2;
	return { ano, semestre };
}

/**
 * Filtra convites por curso
 */
export function filtrarPorCurso(convites, cursoSelecionado) {
	if (!cursoSelecionado) return convites;
	return convites.filter(
		(convite) =>
			convite?.TrabalhoConclusao?.Curso?.id ===
			parseInt(cursoSelecionado),
	);
}

/**
 * Filtra convites por ano
 */
export function filtrarPorAno(convites, ano) {
	if (!ano) return convites;
	return convites.filter(
		(convite) => convite?.TrabalhoConclusao?.ano === parseInt(ano),
	);
}

/**
 * Filtra convites por semestre
 */
export function filtrarPorSemestre(convites, semestre) {
	if (!semestre) return convites;
	return convites.filter(
		(convite) =>
			convite?.TrabalhoConclusao?.semestre === parseInt(semestre),
	);
}

/**
 * Filtra convites por fase
 */
export function filtrarPorFase(convites, fase) {
	if (fase === "") return convites;
	return convites.filter((convite) => convite?.fase === parseInt(fase));
}

/**
 * Aplica todos os filtros aos convites
 */
export function aplicarFiltros(
	convites,
	{ cursoSelecionado, ano, semestre, fase },
) {
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
 * Mapeia fase para texto descritivo
 */
export function obterDescricaoFase(fase) {
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
export function formatarData(data) {
	if (!data) return null;
	return new Date(data).toLocaleDateString("pt-BR");
}

/**
 * Prepara dados dos convites para exibição no grid
 */
export function prepararConvitesParaGrid(convites) {
	return convites.map((convite) => ({
		...convite,
		nomeDicente: convite?.TrabalhoConclusao?.Dicente?.nome || "N/A",
		matriculaDicente:
			convite?.TrabalhoConclusao?.Dicente?.matricula || "N/A",
		tituloTcc: convite?.TrabalhoConclusao?.titulo || "N/A",
		nomeCurso: convite?.TrabalhoConclusao?.Curso?.nome || "N/A",
		mensagemEnvio: convite?.mensagem_envio || "Sem mensagem",
		dataEnvio: formatarData(convite?.data_envio) || "N/A",
		dataFeedback: formatarData(convite?.data_feedback),
		foiRespondido: !!convite?.data_feedback,
		faseDescricao: obterDescricaoFase(convite?.fase),
	}));
}

/**
 * Ordena convites para exibição
 * Prioriza convites não respondidos, depois ordena por nome do estudante e data de envio
 */
export function ordenarConvites(convites) {
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
		return new Date(a.data_envio || 0) - new Date(b.data_envio || 0);
	});
}

/**
 * Processa e prepara convites completos para o grid
 */
export function processarConvitesParaGrid(convites) {
	const convitesPreparados = prepararConvitesParaGrid(convites);
	return ordenarConvites(convitesPreparados);
}

/**
 * Extrai cursos das orientações
 */
export function extrairCursos(orientacoes) {
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
