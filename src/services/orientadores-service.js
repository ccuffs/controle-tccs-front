import axiosInstance from "../auth/axios.js";

// GET - Buscar orientadores por curso
export async function getOrientadoresPorCurso(idCurso) {
	try {
		const response = await axiosInstance.get(
			`/orientadores/curso/${idCurso}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar orientadores:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar orientadores",
		);
	}
}

// POST - Criar nova orientação
export async function createOrientacao(data) {
	try {
		const response = await axiosInstance.post("/orientadores", {
			formData: data,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao criar orientação:", error);
		throw error;
	}
}

// DELETE - Remover orientação
export async function deleteOrientacao(idCurso, codigoDocente) {
	try {
		const response = await axiosInstance.delete(
			`/orientadores/${idCurso}/${codigoDocente}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar orientação:", error);
		throw error;
	}
}

// Exportação padrão para manter compatibilidade
const orientadoresService = {
	getOrientadoresPorCurso,
	createOrientacao,
	deleteOrientacao,
};

export default orientadoresService;
