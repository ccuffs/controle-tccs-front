import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { OrientadorCurso } from "../types/curso";

export interface OrientadorPayload {
	codigo_docente: string;
	id_curso: number | string;
}

// GET - Buscar orientadores por curso
export async function getOrientadoresPorCurso(
	idCurso: number,
): Promise<OrientadorCurso[]> {
	try {
		const response = await axiosInstance.get<{ orientacoes: OrientadorCurso[] }>(
			`/orientadores/curso/${idCurso}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar orientadores:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar orientadores"));
	}
}

// POST - Criar nova orientação
export async function createOrientacao(
	data: OrientadorPayload,
): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/orientadores",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar orientação:", error);
		throw error;
	}
}

// DELETE - Remover orientação
export async function deleteOrientacao(
	idCurso: number | string,
	codigoDocente: string,
): Promise<unknown> {
	try {
		const response = await axiosInstance.delete<{ data: unknown }>(
			`/orientadores/${idCurso}/${codigoDocente}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar orientação:", error);
		throw error;
	}
}

// Exportação padrão para manter compatibilidade
const orientadoresService = {
	getOrientadoresPorCurso,
	createOrientacao,
	deleteOrientacao,
};

export default orientadoresService;
