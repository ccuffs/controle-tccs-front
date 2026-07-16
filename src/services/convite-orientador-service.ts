import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Docente } from "../types/docente";
import type { OrientadorCurso } from "../types/curso";

export interface ConviteOrientacaoPayload {
	id_tcc: number;
	codigo_docente: string;
	mensagem_envio: string;
	fase: number;
}

/**
 * GET - Buscar orientadores por curso
 */
export async function getOrientadoresPorCurso(
	idCurso: number,
): Promise<Docente[]> {
	try {
		const response = await axiosInstance.get<{ orientacoes: OrientadorCurso[] }>(
			`/orientadores/curso/${idCurso}`,
		);

		// Extrair os docentes das orientações
		const orientacoes = response.orientacoes || [];
		const docentes = orientacoes
			.map((orientacao) => orientacao.docente)
			.filter((docente): docente is Docente => Boolean(docente));

		return docentes;
	} catch (error) {
		console.error("Erro ao carregar orientadores do curso:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao carregar lista de orientadores do curso"),
		);
	}
}

/**
 * POST - Enviar convite de orientação
 */
export async function enviarConviteOrientacao(
	dadosConvite: ConviteOrientacaoPayload,
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

// Exportação padrão
const conviteOrientadorService = {
	getOrientadoresPorCurso,
	enviarConviteOrientacao,
};

export default conviteOrientadorService;
