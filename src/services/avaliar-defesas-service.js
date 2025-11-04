import axiosInstance from "../auth/axios.js";

// GET - Buscar cursos do orientador
export async function getCursosOrientador(codigoDocente) {
	try {
		const response = await axiosInstance.get(
			`/orientadores/docente/${codigoDocente}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar cursos do orientador:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar cursos do orientador",
		);
	}
}

// GET - Buscar orientações
export async function getOrientacoes(params) {
	try {
		const response = await axiosInstance.get("/orientacoes", {
			params,
		});
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar orientações:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar orientações",
		);
	}
}

// GET - Buscar defesas
export async function getDefesas(params) {
	try {
		const response = await axiosInstance.get("/defesas", {
			params,
		});
		return response.defesas || [];
	} catch (error) {
		console.error("Erro ao buscar defesas:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar defesas",
		);
	}
}

// PUT - Salvar avaliação de defesa
export async function salvarAvaliacaoDefesa(idTcc, membroBanca, data) {
	try {
		const response = await axiosInstance.put(
			`/defesas/${idTcc}/${membroBanca}`,
			{
				formData: data,
			},
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao salvar avaliação de defesa:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao salvar avaliação de defesa",
		);
	}
}

// PUT - Atualizar trabalho de conclusão
export async function atualizarTrabalhoConclusao(idTcc, data) {
	try {
		const response = await axiosInstance.put(
			`/trabalho-conclusao/${idTcc}`,
			data,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar trabalho de conclusão:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao atualizar trabalho de conclusão",
		);
	}
}

// Exportação padrão
const avaliarDefesasService = {
	getCursosOrientador,
	getOrientacoes,
	getDefesas,
	salvarAvaliacaoDefesa,
	atualizarTrabalhoConclusao,
};

export default avaliarDefesasService;

