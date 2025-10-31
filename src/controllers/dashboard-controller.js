/**
 * Prepara os dados para o gráfico de estudantes com orientador
 */
export function prepareOrientadoresDefinidosData(orientadoresResponse) {
	return {
		total: orientadoresResponse?.total || 0,
		comOrientador: orientadoresResponse?.comOrientador || 0,
	};
}

/**
 * Prepara os dados de distribuição por etapa
 */
export function prepareEtapasData(etapasResponse) {
	const lista = (etapasResponse.distribuicao || []).map((e) => ({
		name: `Etapa ${e.etapa}`,
		value: e.quantidade,
		etapa: e.etapa,
	}));
	return lista;
}

/**
 * Prepara os dados de convites por período
 */
export function prepareConvitesData(convitesResponse) {
	return convitesResponse.pontos || [];
}

/**
 * Prepara os dados de status de convites de orientação
 */
export function prepareConvitesOrientacaoStatus(convitesResponse) {
	return {
		respondidos: convitesResponse.respondidos || 0,
		pendentes: convitesResponse.pendentes || 0,
		total: convitesResponse.total || 0,
	};
}

/**
 * Prepara os dados de status de convites de banca
 */
export function prepareConvitesBancaStatus(convitesResponse) {
	return {
		respondidos: convitesResponse.respondidos || 0,
		pendentes: convitesResponse.pendentes || 0,
		total: convitesResponse.total || 0,
	};
}

/**
 * Prepara os dados de orientandos por docente
 */
export function prepareOrientandosPorDocente(porDocenteResponse) {
	return (porDocenteResponse.itens || []).map((i) => ({
		docente: i.nome || i.codigo_docente,
		quantidade: i.quantidade || 0,
	}));
}

/**
 * Prepara os dados de defesas por docente
 */
export function prepareDefesasPorDocente(defesasResponse) {
	return (defesasResponse.itens || []).map((i) => ({
		docente: i.nome || i.codigo_docente,
		quantidade: i.quantidade || 0,
	}));
}

/**
 * Extrai cursos das orientações
 */
export function extractCursosFromOrientacoes(orientacoes) {
	const cursosSet = new Map();
	for (const o of orientacoes) {
		const c = o?.curso;
		if (c?.id && !cursosSet.has(c.id)) cursosSet.set(c.id, c);
	}
	return Array.from(cursosSet.values());
}

/**
 * Prepara os anos únicos a partir da lista de anos-semestres
 */
export function extractAnosUnicos(anosSemestres) {
	return Array.from(new Set(anosSemestres.map((p) => p.ano))).sort((a, b) => a - b);
}

/**
 * Calcula o label da fase
 */
export function getFaseLabel(fase) {
	const v = String(fase || "");
	if (!v) return "";
	return v === "1" ? "(Projeto)" : "(TCC)";
}

/**
 * Gera ticks para o gráfico de convites
 */
export function generateTicksConvites(dadosConvites) {
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
}

/**
 * Calcula altura dinâmica para gráficos
 */
export function calculateHeight(data, minHeight = 240, maxHeight = 800) {
	const n = Array.isArray(data) ? data.length : 0;
	return Math.max(minHeight, Math.min(maxHeight, n * 28 + 80));
}

/**
 * Prepara parâmetros de query para chamadas de API
 */
export function buildQueryParams(filtros) {
	const params = new URLSearchParams();
	if (filtros.ano) params.set("ano", String(filtros.ano));
	if (filtros.semestre) params.set("semestre", String(filtros.semestre));
	if (filtros.fase) params.set("fase", String(filtros.fase));
	if (filtros.id_curso) params.set("id_curso", String(filtros.id_curso));
	if (filtros.codigo_docente)
		params.set("codigo_docente", String(filtros.codigo_docente));
	return params;
}

// Exportação padrão
const dashboardController = {
	prepareOrientadoresDefinidosData,
	prepareEtapasData,
	prepareConvitesData,
	prepareConvitesOrientacaoStatus,
	prepareConvitesBancaStatus,
	prepareOrientandosPorDocente,
	prepareDefesasPorDocente,
	extractCursosFromOrientacoes,
	extractAnosUnicos,
	getFaseLabel,
	generateTicksConvites,
	calculateHeight,
	buildQueryParams,
};

export default dashboardController;

