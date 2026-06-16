import axiosInstance from "../auth/axios.js";

// GET - Buscar docentes externos por nome (autocomplete)
export async function buscarExternosPorNome(nome) {
	try {
		const response = await axiosInstance.get("/docentes/buscar-externo", {
			params: { nome },
		});
		return response.docentes || [];
	} catch (error) {
		console.error("Erro ao buscar docentes externos:", error);
		return [];
	}
}

// GET - Listar membros externos de um TCC
export async function getMembrosExternosTcc(idTcc) {
	try {
		const response = await axiosInstance.get(`/defesas/externos/tcc/${idTcc}`);
		return response.membros || [];
	} catch (error) {
		console.error("Erro ao buscar membros externos:", error);
		throw new Error(
			error.response?.data?.message || error.message || "Erro ao buscar membros externos",
		);
	}
}

// POST - Adicionar membro externo à banca
export async function adicionarMembroExterno({ id_tcc, fase, data_hora_defesa, docente }) {
	try {
		const response = await axiosInstance.post("/defesas/membro-externo", {
			id_tcc,
			fase,
			data_hora_defesa,
			docente,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao adicionar membro externo:", error);
		throw new Error(
			error.response?.data?.message || error.message || "Erro ao adicionar membro externo",
		);
	}
}

// DELETE - Remover membro externo da banca
export async function removerMembroExterno(idTcc, codigoDocente, fase) {
	try {
		await axiosInstance.delete(`/defesas/externo/${idTcc}/${codigoDocente}/${fase}`);
	} catch (error) {
		console.error("Erro ao remover membro externo:", error);
		throw new Error(
			error.response?.data?.message || error.message || "Erro ao remover membro externo",
		);
	}
}

// GET - Listar declarações externas (para o orientador emitir)
export async function getDeclaracoesExternas(params = {}) {
	try {
		const queryString = new URLSearchParams();
		if (params.curso) queryString.append("curso", params.curso);
		if (params.ano) queryString.append("ano", params.ano);
		if (params.semestre) queryString.append("semestre", params.semestre);
		if (params.fase) queryString.append("fase", params.fase);

		const response = await axiosInstance.get(`/declaracoes/externas?${queryString.toString()}`);
		return response.declaracoes || [];
	} catch (error) {
		console.error("Erro ao buscar declarações externas:", error);
		throw new Error(
			error.response?.data?.message || error.message || "Erro ao buscar declarações externas",
		);
	}
}

// GET - Gerar declaração HTML para membro externo
export async function gerarDeclaracaoExternoHtml(idTcc, codigoDocente) {
	try {
		const response = await axiosInstance.get(
			`/declaracoes/gerar-externo/${idTcc}/${codigoDocente}`,
			{ responseType: "text" },
		);
		return response;
	} catch (error) {
		console.error("Erro ao gerar declaração para externo:", error);
		throw new Error(
			error.response?.data?.message || error.message || "Erro ao gerar declaração",
		);
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
