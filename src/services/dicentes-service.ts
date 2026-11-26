import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Dicente } from "../types/dicente";

export interface DicentePayload {
	matricula: string | number;
	nome: string;
	email: string;
}

// GET - Buscar dicente por ID de usuário
export async function getDicenteByUsuario(
	usuarioId: string,
): Promise<Dicente> {
	try {
		const response = await axiosInstance.get<Dicente>(
			`/dicentes/usuario/${usuarioId}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar dicente por usuário:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar dicente"));
	}
}

// GET - Buscar todos os dicentes
export async function getDicentes(): Promise<Dicente[]> {
	try {
		const response = await axiosInstance.get<{ dicentes: Dicente[] }>(
			"/dicentes",
		);
		return response.dicentes || [];
	} catch (error) {
		console.error("Erro ao buscar dicentes:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar dicentes"));
	}
}

// POST - Criar novo dicente
/** Discente com os TCCs que atendem aos filtros (quando há filtros de período/curso). */
export interface DicenteComTccs extends Dicente {
	trabalhosConclusao?: { id: number; ano: number; semestre: number; id_curso: number; fase: number }[];
}

// GET - Discentes com TCC no período/curso informados (sem filtros: todos os discentes)
export async function getDicentesFiltrados(filtros: {
	ano?: number;
	semestre?: number;
	id_curso?: string;
}): Promise<DicenteComTccs[]> {
	const params = new URLSearchParams();
	if (filtros.ano) params.set("ano", String(filtros.ano));
	if (filtros.semestre) params.set("semestre", String(filtros.semestre));
	if (filtros.id_curso) params.set("id_curso", filtros.id_curso);
	const query = params.toString();
	try {
		const response = await axiosInstance.get<{ dicentes: DicenteComTccs[] }>(`/dicentes${query ? `?${query}` : ""}`);
		return response.dicentes || [];
	} catch (error) {
		console.error("Erro ao buscar dicentes:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar discentes"));
	}
}

export async function createDicente(
	data: DicentePayload,
): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/dicentes",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar dicente:", error);
		throw error;
	}
}

// PUT - Atualizar dicente existente
export async function updateDicente(
	matricula: string,
	data: Partial<DicentePayload>,
): Promise<unknown> {
	try {
		const response = await axiosInstance.put<{ data: unknown }>(
			`/dicentes/${matricula}`,
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar dicente:", error);
		throw error;
	}
}

// DELETE - Remover dicente
export async function deleteDicente(matricula: string): Promise<unknown> {
	try {
		const response = await axiosInstance.delete<{ data: unknown }>(
			`/dicentes/${matricula}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar dicente:", error);
		throw error;
	}
}

// Exportação padrão para manter compatibilidade
const dicentesService = {
	getDicentesFiltrados,
	getDicenteByUsuario,
	getDicentes,
	createDicente,
	updateDicente,
	deleteDicente,
};

export default dicentesService;
