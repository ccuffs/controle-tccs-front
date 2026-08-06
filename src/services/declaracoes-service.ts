import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Curso } from "../types/curso";
import type { Declaracao, DeclaracoesFiltros } from "../types/declaracao";

interface DeclaracoesResponse {
	declaracoes: Declaracao[];
	anosDisponiveis: number[];
	semestresDisponiveis: number[];
}

// GET - Buscar todos os cursos
export async function getCursos(): Promise<Curso[]> {
	try {
		const response = await axiosInstance.get<{ cursos: Curso[] }>("/cursos");
		return response.cursos || [];
	} catch (error) {
		console.error("Erro ao buscar cursos:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar cursos"));
	}
}

// GET - Buscar declarações com filtros
export async function getDeclaracoes(
	params: DeclaracoesFiltros,
): Promise<DeclaracoesResponse> {
	try {
		const queryString = new URLSearchParams();
		if (params.curso) queryString.append("curso", String(params.curso));
		if (params.ano) queryString.append("ano", String(params.ano));
		if (params.semestre)
			queryString.append("semestre", String(params.semestre));
		if (params.fase) queryString.append("fase", String(params.fase));

		const response = await axiosInstance.get<Partial<DeclaracoesResponse>>(
			`/declaracoes/?${queryString.toString()}`,
		);
		return {
			declaracoes: response.declaracoes || [],
			anosDisponiveis: response.anosDisponiveis || [],
			semestresDisponiveis: response.semestresDisponiveis || [],
		};
	} catch (error) {
		console.error("Erro ao buscar declarações:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar declarações"));
	}
}

// GET - Gerar declaração em HTML
export async function gerarDeclaracaoHtml(
	idTcc: number,
	tipoParticipacao: string,
): Promise<string> {
	try {
		const response = await axiosInstance.get<string>(
			`/declaracoes/gerar/${idTcc}/${tipoParticipacao}`,
			{ responseType: "text" },
		);
		return response;
	} catch (error) {
		console.error("Erro ao gerar declaração:", error);
		throw new Error(getErrorMessage(error, "Erro ao gerar declaração"));
	}
}

// GET - Listar declarações de membros externos
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

// GET - Gerar declaração para membro externo em HTML
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

// GET - Gerar declaração consolidada (todos os estudantes em uma tabela)
export async function gerarDeclaracaoTabelaHtml(
	tipoParticipacao: "orientacao" | "banca",
	params: DeclaracoesFiltros = {},
): Promise<string> {
	try {
		const queryString = new URLSearchParams();
		if (params.curso) queryString.append("curso", String(params.curso));
		if (params.ano) queryString.append("ano", String(params.ano));
		if (params.semestre)
			queryString.append("semestre", String(params.semestre));
		if (params.fase) queryString.append("fase", String(params.fase));

		const qs = queryString.toString();
		const response = await axiosInstance.get<string>(
			`/declaracoes/gerar-tabela/${tipoParticipacao}${qs ? `?${qs}` : ""}`,
			{ responseType: "text" },
		);
		return response;
	} catch (error) {
		console.error("Erro ao gerar declaração em tabela:", error);
		throw new Error(
			getErrorMessage(
				error,
				"Erro ao gerar declaração consolidada. Verifique se há estudantes já avaliados em banca.",
			),
		);
	}
}

// Exportação padrão
const declaracoesService = {
	getCursos,
	getDeclaracoes,
	gerarDeclaracaoHtml,
	getDeclaracoesExternas,
	gerarDeclaracaoExternoHtml,
	gerarDeclaracaoTabelaHtml,
};

export default declaracoesService;
