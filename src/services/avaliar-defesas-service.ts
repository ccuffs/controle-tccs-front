import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Defesa } from "../types/defesa";
import type { Orientacao } from "../types/trabalho-conclusao";
import type { OrientadorCurso } from "../types/curso";

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

// GET - Buscar orientações
export async function getOrientacoes(
	params?: Record<string, unknown>,
): Promise<Orientacao[]> {
	try {
		const response = await axiosInstance.get<{ orientacoes: Orientacao[] }>(
			"/orientacoes",
			{ params },
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar orientações:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar orientações"));
	}
}

// GET - Buscar defesas
export async function getDefesas(
	params?: Record<string, unknown>,
): Promise<Defesa[]> {
	try {
		const response = await axiosInstance.get<{ defesas: Defesa[] }>(
			"/defesas",
			{ params },
		);
		return response.defesas || [];
	} catch (error) {
		console.error("Erro ao buscar defesas:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar defesas"));
	}
}

// PUT - Salvar avaliação de defesa
export async function salvarAvaliacaoDefesa(
	idTcc: number,
	membroBanca: string,
	data: { avaliacao: number; fase: number },
): Promise<unknown> {
	try {
		const response = await axiosInstance.put<{ data: unknown }>(
			`/defesas/${idTcc}/${membroBanca}`,
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao salvar avaliação de defesa:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao salvar avaliação de defesa"),
		);
	}
}

// PUT - Atualizar trabalho de conclusão
export async function atualizarTrabalhoConclusao(
	idTcc: number,
	data: unknown,
): Promise<unknown> {
	try {
		const response = await axiosInstance.put<{ data: unknown }>(
			`/trabalho-conclusao/${idTcc}`,
			data,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar trabalho de conclusão:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao atualizar trabalho de conclusão"),
		);
	}
}

// GET - Gerar ata de defesa em HTML
export async function gerarAtaDefesaHtml(
	idTcc: number,
	fase: number,
	local = "",
): Promise<string> {
	try {
		const params = local ? { local } : {};
		const response = await axiosInstance.get<string>(
			`/defesas/ata/${idTcc}/${fase}`,
			{ params, responseType: "text" },
		);
		return response;
	} catch (error) {
		console.error("Erro ao gerar ata de defesa:", error);
		throw new Error(getErrorMessage(error, "Erro ao gerar ata de defesa"));
	}
}

// Exportação padrão
const avaliarDefesasService = {
	getCursosOrientador,
	getOrientacoes,
	getDefesas,
	salvarAvaliacaoDefesa,
	atualizarTrabalhoConclusao,
	gerarAtaDefesaHtml,
};

export default avaliarDefesasService;
