import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Docente } from "../types/docente";

export interface DocentePayload {
	codigo: string;
	email: string;
	nome: string;
	sala?: number | string | null;
	siape?: number | string | null;
	id_curso?: number | string;
}

// GET - Buscar todos os docentes
export async function getDocentes(): Promise<Docente[]> {
	try {
		const response = await axiosInstance.get<{ docentes: Docente[] }>(
			"/docentes",
		);
		return response.docentes || [];
	} catch (error) {
		console.error("Erro ao buscar docentes:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar docentes"));
	}
}

// POST - Criar novo docente
export async function createDocente(
	data: DocentePayload,
): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/docentes",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar docente:", error);
		throw error;
	}
}

// PUT - Atualizar docente (codigo identifica o registro)
export async function updateDocente(data: Partial<DocentePayload> & { codigo: string }): Promise<unknown> {
	try {
		return await axiosInstance.put("/docentes", { formData: data });
	} catch (error) {
		console.error("Erro ao atualizar docente:", error);
		throw error;
	}
}

// Exportação padrão para manter compatibilidade
const docentesService = {
	updateDocente,
	getDocentes,
	createDocente,
};

export default docentesService;
