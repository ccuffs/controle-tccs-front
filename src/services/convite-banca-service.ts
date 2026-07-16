import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Docente } from "../types/docente";

interface DocenteBancaResponse {
	data?: { docentesBanca?: { docente: Docente }[] };
	docentesBanca?: { docente: Docente }[];
}

export interface ConvitePayload {
	id_tcc: number;
	codigo_docente: string;
	fase: number;
	mensagem_envio: string;
	orientacao: boolean;
}

/**
 * GET - Buscar docentes de banca por curso
 */
export async function getDocentesBancaPorCurso(
	idCurso: number,
): Promise<Docente[]> {
	try {
		const response = await axiosInstance.get<DocenteBancaResponse>(
			`/banca-curso/curso/${idCurso}`,
		);

		// Extrair os docentes da banca
		const docentesBanca =
			response.data?.docentesBanca || response.docentesBanca || [];
		const docentes = docentesBanca
			.map((banca) => banca.docente)
			.filter(Boolean);

		return docentes;
	} catch (error) {
		console.error("Erro ao carregar docentes de banca do curso:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao carregar lista de docentes de banca do curso"),
		);
	}
}

/**
 * POST - Enviar convite de banca
 */
export async function enviarConviteBanca(
	dadosConvite: ConvitePayload,
): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/convites",
			{ formData: dadosConvite },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao enviar convite:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao enviar convite. Tente novamente."),
		);
	}
}

/**
 * POST - Enviar múltiplos convites de banca
 */
export async function enviarConvitesBanca(
	listaConvites: ConvitePayload[],
): Promise<unknown[]> {
	try {
		const resultados: unknown[] = [];

		for (const convite of listaConvites) {
			const resultado = await enviarConviteBanca(convite);
			resultados.push(resultado);
		}

		return resultados;
	} catch (error) {
		console.error("Erro ao enviar convites:", error);
		throw error;
	}
}

// Exportação padrão
const conviteBancaService = {
	getDocentesBancaPorCurso,
	enviarConviteBanca,
	enviarConvitesBanca,
};

export default conviteBancaService;
