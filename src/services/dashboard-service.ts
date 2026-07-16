import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { OrientadorCurso } from "../types/curso";
import type {
	AnoSemestre,
	ConvitesPorPeriodoResponse,
	ConvitesStatusResponse,
	ItensResponse,
	OrientadoresDefinidosResponse,
	PorDocenteResponse,
	TccPorEtapaResponse,
	DefesaAgendada,
	EstudanteSemConviteBanca,
	DocenteSemDisponibilidadeBanca,
} from "../types/dashboard";

// GET - Buscar ano-semestre atual
export async function getAnoSemestreAtual(): Promise<AnoSemestre> {
	try {
		const response = await axiosInstance.get<AnoSemestre>(
			"/ano-semestre/atual",
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar ano-semestre atual:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar ano-semestre atual"));
	}
}

// GET - Buscar lista de anos-semestres
export async function getAnoSemestres(): Promise<AnoSemestre[]> {
	try {
		const response = await axiosInstance.get<AnoSemestre[]>("/ano-semestre");
		return response || [];
	} catch (error) {
		console.error("Erro ao buscar anos-semestres:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar anos-semestres"));
	}
}

// GET - Buscar orientadores definidos
export async function getOrientadoresDefinidos(
	params: URLSearchParams,
): Promise<OrientadoresDefinidosResponse> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<OrientadoresDefinidosResponse>(
			`/dashboard/orientadores-definidos?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar orientadores definidos:", error);
		throw error;
	}
}

// GET - Buscar TCC por etapa
export async function getTccPorEtapa(
	params: URLSearchParams,
): Promise<TccPorEtapaResponse> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<TccPorEtapaResponse>(
			`/dashboard/tcc-por-etapa?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar TCC por etapa:", error);
		throw error;
	}
}

// GET - Buscar defesas agendadas
export async function getDefesasAgendadas(
	params: URLSearchParams,
): Promise<ItensResponse<DefesaAgendada>> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<ItensResponse<DefesaAgendada>>(
			`/dashboard/defesas-agendadas?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar defesas agendadas:", error);
		throw error;
	}
}

// GET - Buscar convites por período
export async function getConvitesPorPeriodo(
	params: URLSearchParams,
): Promise<ConvitesPorPeriodoResponse> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<ConvitesPorPeriodoResponse>(
			`/dashboard/convites-por-periodo?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar convites por período:", error);
		throw error;
	}
}

// GET - Buscar status de convites de orientação
export async function getConvitesOrientacaoStatus(
	params: URLSearchParams,
): Promise<ConvitesStatusResponse> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<ConvitesStatusResponse>(
			`/dashboard/convites-orientacao-status?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar status de convites de orientação:", error);
		throw error;
	}
}

// GET - Buscar status de convites de banca
export async function getConvitesBancaStatus(
	params: URLSearchParams,
): Promise<ConvitesStatusResponse> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<ConvitesStatusResponse>(
			`/dashboard/convites-banca-status?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar status de convites de banca:", error);
		throw error;
	}
}

// GET - Buscar orientandos por docente
export async function getOrientandosPorDocente(
	params: URLSearchParams,
): Promise<PorDocenteResponse> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<PorDocenteResponse>(
			`/dashboard/orientandos-por-docente?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar orientandos por docente:", error);
		throw error;
	}
}

// GET - Buscar defesas aceitas por docente
export async function getDefesasAceitasPorDocente(
	params: URLSearchParams,
): Promise<PorDocenteResponse> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<PorDocenteResponse>(
			`/dashboard/defesas-aceitas-por-docente?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar defesas aceitas por docente:", error);
		throw error;
	}
}

// GET - Buscar orientações por docente (para orientadores)
export async function getOrientacoesPorDocente(
	codigoDocente: string,
): Promise<{ orientacoes: OrientadorCurso[] }> {
	try {
		const response = await axiosInstance.get<{ orientacoes: OrientadorCurso[] }>(
			`/orientadores/docente/${codigoDocente}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar orientações por docente:", error);
		throw error;
	}
}

// GET - Buscar estudantes sem convite de banca
export async function getEstudantesSemConviteBanca(
	params: URLSearchParams,
): Promise<ItensResponse<EstudanteSemConviteBanca>> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<ItensResponse<EstudanteSemConviteBanca>>(
			`/dashboard/estudantes-sem-convite-banca?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar estudantes sem convite de banca:", error);
		throw error;
	}
}

// GET - Buscar docentes sem disponibilidade de banca
export async function getDocentesSemDisponibilidadeBanca(
	params: URLSearchParams,
): Promise<ItensResponse<DocenteSemDisponibilidadeBanca>> {
	try {
		const queryString = new URLSearchParams(params).toString();
		const response = await axiosInstance.get<ItensResponse<DocenteSemDisponibilidadeBanca>>(
			`/dashboard/docentes-sem-disponibilidade-banca?${queryString}`,
		);
		return response;
	} catch (error) {
		console.error(
			"Erro ao buscar docentes sem disponibilidade de banca:",
			error,
		);
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
	getEstudantesSemConviteBanca,
	getDocentesSemDisponibilidadeBanca,
};

export default dashboardService;
