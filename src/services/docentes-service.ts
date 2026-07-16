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

// Exportação padrão para manter compatibilidade
const docentesService = {
	getDocentes,
	createDocente,
};

export default docentesService;
