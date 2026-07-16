import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Curso } from "../types/curso";

export interface CursoPayload {
	codigo: number | string;
	nome: string;
	turno: string;
}

// GET - Buscar todos os cursos
export async function getCursos(): Promise<Curso[]> {
	try {
		const response = await axiosInstance.get<{ cursos: Curso[] }>("/cursos");
		return response.cursos;
	} catch (error) {
		console.error("Erro ao buscar cursos:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar cursos"));
	}
}

// POST - Criar novo curso
export async function createCurso(data: CursoPayload): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/cursos/",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar curso:", error);
		throw error;
	}
}

// PUT - Atualizar curso existente
export async function updateCurso(
	data: CursoPayload & { id: number },
): Promise<unknown> {
	try {
		const response = await axiosInstance.put<{ data: unknown }>(
			"/cursos/",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar curso:", error);
		throw error;
	}
}

// DELETE - Remover curso
export async function deleteCurso(id: number): Promise<unknown> {
	try {
		const response = await axiosInstance.delete<{ data: unknown }>(
			`/cursos/${id}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar curso:", error);
		throw error;
	}
}

// Exportação padrão para manter compatibilidade
const cursosService = {
	getCursos,
	createCurso,
	updateCurso,
	deleteCurso,
};

export default cursosService;
