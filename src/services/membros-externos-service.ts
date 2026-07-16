import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Docente } from "../types/docente";
import type { Declaracao, DeclaracoesFiltros } from "../types/declaracao";

export interface DocenteExternoPayload {
	codigo?: string;
	nome?: string;
	email?: string;
	siape?: number;
	instituicao?: string;
}

export interface MembroExternoPayload {
	id_tcc: number;
	fase: number;
	data_hora_defesa: string;
	docente: DocenteExternoPayload;
}

// GET - Buscar docentes externos por nome (autocomplete)
export async function buscarExternosPorNome(
	nome: string,
): Promise<Docente[]> {
	try {
		const response = await axiosInstance.get<{ docentes: Docente[] }>(
			"/docentes/buscar-externo",
			{ params: { nome } },
		);
		return response.docentes || [];
	} catch (error) {
		console.error("Erro ao buscar docentes externos:", error);
		return [];
	}
}

// GET - Listar membros externos de um TCC
export async function getMembrosExternosTcc(
	idTcc: number,
): Promise<Docente[]> {
	try {
		const response = await axiosInstance.get<{ membros: Docente[] }>(
			`/defesas/externos/tcc/${idTcc}`,
		);
		return response.membros || [];
	} catch (error) {
		console.error("Erro ao buscar membros externos:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar membros externos"),
		);
	}
}

// POST - Adicionar membro externo à banca
export async function adicionarMembroExterno({
	id_tcc,
	fase,
	data_hora_defesa,
	docente,
}: MembroExternoPayload): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/defesas/membro-externo",
			{ id_tcc, fase, data_hora_defesa, docente },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao adicionar membro externo:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao adicionar membro externo"),
		);
	}
}

// DELETE - Remover membro externo da banca
export async function removerMembroExterno(
	idTcc: number,
	codigoDocente: string,
	fase: number,
): Promise<void> {
	try {
		await axiosInstance.delete(
			`/defesas/externo/${idTcc}/${codigoDocente}/${fase}`,
		);
	} catch (error) {
		console.error("Erro ao remover membro externo:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao remover membro externo"),
		);
	}
}

// GET - Listar declarações externas (para o orientador emitir)
export async function getDeclaracoesExternas(
	params: DeclaracoesFiltros = {},
): Promise<Declaracao[]> {
	try {
		const queryString = new URLSearchParams();
		if (params.curso) queryString.append("curso", String(params.curso));
		if (params.ano) queryString.append("ano", String(params.ano));
		if (params.semestre)
			queryString.append("semestre", String(params.semestre));
		if (params.fase) queryString.append("fase", String(params.fase));

		const response = await axiosInstance.get<{ declaracoes: Declaracao[] }>(
			`/declaracoes/externas?${queryString.toString()}`,
		);
		return response.declaracoes || [];
	} catch (error) {
		console.error("Erro ao buscar declarações externas:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar declarações externas"),
		);
	}
}

// GET - Gerar declaração HTML para membro externo
export async function gerarDeclaracaoExternoHtml(
	idTcc: number,
	codigoDocente: string,
): Promise<string> {
	try {
		const response = await axiosInstance.get<string>(
			`/declaracoes/gerar-externo/${idTcc}/${codigoDocente}`,
			{ responseType: "text" },
		);
		return response;
	} catch (error) {
		console.error("Erro ao gerar declaração para externo:", error);
		throw new Error(getErrorMessage(error, "Erro ao gerar declaração"));
	}
}

const membrosExternosService = {
	buscarExternosPorNome,
	getMembrosExternosTcc,
	adicionarMembroExterno,
	removerMembroExterno,
	getDeclaracoesExternas,
	gerarDeclaracaoExternoHtml,
};

export default membrosExternosService;
