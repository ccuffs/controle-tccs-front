import axiosInstance from "../auth/axios.js";

// GET - Buscar convites do docente
export async function getConvitesDocente(codigoDocente) {
	try {
		const response = await axiosInstance.get(
			`/convites/docente/${codigoDocente}`,
		);
		return response.convites || [];
	} catch (error) {
		console.error("Erro ao buscar convites do docente:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar convites do docente",
		);
	}
}

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

// PUT - Responder convite (aceitar ou rejeitar)
export async function responderConvite(idTcc, codigoDocente, fase, aceito) {
	try {
		const response = await axiosInstance.put(
			`/convites/${idTcc}/${codigoDocente}/${fase}`,
			{
				aceito,
			},
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao responder convite:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao responder convite",
		);
	}
}

// Exportação padrão
const convitesService = {
	getConvitesDocente,
	getCursosOrientador,
	responderConvite,
};

export default convitesService;

