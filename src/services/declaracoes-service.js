import axiosInstance from "../auth/axios.js";

// GET - Buscar todos os cursos
export async function getCursos() {
	try {
		const response = await axiosInstance.get("/cursos");
		return response.cursos || [];
	} catch (error) {
		console.error("Erro ao buscar cursos:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar cursos",
		);
	}
}

// GET - Buscar declarações com filtros
export async function getDeclaracoes(params) {
	try {
		const queryString = new URLSearchParams();
		if (params.curso) queryString.append("curso", params.curso);
		if (params.ano) queryString.append("ano", params.ano);
		if (params.semestre) queryString.append("semestre", params.semestre);
		if (params.fase) queryString.append("fase", params.fase);

		const response = await axiosInstance.get(
			`/declaracoes/?${queryString.toString()}`,
		);
		return {
			declaracoes: response.declaracoes || [],
			anosDisponiveis: response.anosDisponiveis || [],
			semestresDisponiveis: response.semestresDisponiveis || [],
		};
	} catch (error) {
		console.error("Erro ao buscar declarações:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar declarações",
		);
	}
}

// GET - Gerar declaração em HTML
export async function gerarDeclaracaoHtml(idTcc, tipoParticipacao) {
	try {
		const response = await axiosInstance.get(
			`/declaracoes/gerar/${idTcc}/${tipoParticipacao}`,
			{
				responseType: "text",
			},
		);
		return response;
	} catch (error) {
		console.error("Erro ao gerar declaração:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao gerar declaração",
		);
	}
}

// Exportação padrão
const declaracoesService = {
	getCursos,
	getDeclaracoes,
	gerarDeclaracaoHtml,
};

export default declaracoesService;
