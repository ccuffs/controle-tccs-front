import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Convite } from "../types/convite";
import type { OrientadorCurso } from "../types/curso";

// GET - Buscar convites do docente
export async function getConvitesDocente(
	codigoDocente: string,
): Promise<Convite[]> {
	try {
		const response = await axiosInstance.get<{ convites: Convite[] }>(
			`/convites/docente/${codigoDocente}`,
		);
		return response.convites || [];
	} catch (error) {
		console.error("Erro ao buscar convites do docente:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar convites do docente"),
		);
	}
}

// GET - Buscar cursos do orientador
export async function getCursosOrientador(
	codigoDocente: string,
): Promise<OrientadorCurso[]> {
	try {
		const response = await axiosInstance.get<{ orientacoes: OrientadorCurso[] }>(
			`/orientadores/docente/${codigoDocente}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar cursos do orientador:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar cursos do orientador"),
		);
	}
}

// PUT - Responder convite (aceitar ou rejeitar)
export async function responderConvite(
	idTcc: number,
	codigoDocente: string,
	fase: number,
	aceito: boolean,
): Promise<unknown> {
	try {
		const response = await axiosInstance.put<{ data: unknown }>(
			`/convites/${idTcc}/${codigoDocente}/${fase}`,
			{ aceito },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao responder convite:", error);
		throw new Error(getErrorMessage(error, "Erro ao responder convite"));
	}
}

export interface PeriodoLetivoConvite {
	ano: number;
	semestre: number;
	inicio?: string | Date | null;
	fim?: string | Date | null;
}

// GET - Calendário acadêmico (ano-semestre com início e fim)
export async function getAnoSemestres(): Promise<PeriodoLetivoConvite[]> {
	try {
		const response =
			await axiosInstance.get<PeriodoLetivoConvite[]>("/ano-semestre");
		return Array.isArray(response) ? response : [];
	} catch (error) {
		console.error("Erro ao buscar anos-semestres:", error);
		return [];
	}
}

// Exportação padrão
const convitesService = {
	getConvitesDocente,
	getCursosOrientador,
	responderConvite,
	getAnoSemestres,
};

export default convitesService;
