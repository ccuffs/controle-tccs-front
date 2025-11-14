import axiosInstance from "../auth/axios.js";

// GET - Buscar ano-semestre atual
export async function getAnoSemestreAtual() {
	try {
		const response = await axiosInstance.get("/ano-semestre/atual");
		return response;
	} catch (error) {
		console.error("Erro ao buscar ano-semestre atual:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar ano-semestre atual",
		);
	}
}

// GET - Buscar lista de anos-semestres
export async function getAnoSemestres() {
	try {
		const response = await axiosInstance.get("/ano-semestre");
		return response || [];
	} catch (error) {
		console.error("Erro ao buscar anos-semestres:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar anos-semestres",
		);
	}
}

// GET - Buscar orientadores definidos
export async function getOrientadoresDefinidos(params) {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get(
			`/dashboard/orientadores-definidos?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar orientadores definidos:", error);
		throw error;
	}
}

// GET - Buscar TCC por etapa
export async function getTccPorEtapa(params) {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get(
			`/dashboard/tcc-por-etapa?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar TCC por etapa:", error);
		throw error;
	}
}

// GET - Buscar defesas agendadas
export async function getDefesasAgendadas(params) {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get(
			`/dashboard/defesas-agendadas?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar defesas agendadas:", error);
		throw error;
	}
}

// GET - Buscar convites por período
export async function getConvitesPorPeriodo(params) {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get(
			`/dashboard/convites-por-periodo?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar convites por período:", error);
		throw error;
	}
}

// GET - Buscar status de convites de orientação
export async function getConvitesOrientacaoStatus(params) {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get(
			`/dashboard/convites-orientacao-status?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error(
			"Erro ao buscar status de convites de orientação:",
			error,
		);
		throw error;
	}
}

// GET - Buscar status de convites de banca
export async function getConvitesBancaStatus(params) {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get(
			`/dashboard/convites-banca-status?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar status de convites de banca:", error);
		throw error;
	}
}

// GET - Buscar orientandos por docente
export async function getOrientandosPorDocente(params) {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get(
			`/dashboard/orientandos-por-docente?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar orientandos por docente:", error);
		throw error;
	}
}

// GET - Buscar defesas aceitas por docente
export async function getDefesasAceitasPorDocente(params) {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get(
			`/dashboard/defesas-aceitas-por-docente?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar defesas aceitas por docente:", error);
		throw error;
	}
}

// GET - Buscar orientações por docente (para orientadores)
export async function getOrientacoesPorDocente(codigoDocente) {
	try {
		const response = await axiosInstance.get(
			`/orientadores/docente/${codigoDocente}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar orientações por docente:", error);
		throw error;
	}
}

// Exportação padrão
const dashboardService = {
	getAnoSemestreAtual,
	getAnoSemestres,
	getOrientadoresDefinidos,
	getTccPorEtapa,
	getDefesasAgendadas,
	getConvitesPorPeriodo,
	getConvitesOrientacaoStatus,
	getConvitesBancaStatus,
	getOrientandosPorDocente,
	getDefesasAceitasPorDocente,
	getOrientacoesPorDocente,
};

export default dashboardService;
