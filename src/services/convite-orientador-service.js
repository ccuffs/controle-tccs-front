import axiosInstance from "../auth/axios.js";

/**
 * GET - Buscar orientadores por curso
 */
export async function getOrientadoresPorCurso(idCurso) {
	try {
		const response = await axiosInstance.get(
			`/orientadores/curso/${idCurso}`,
		);

		// Extrair os docentes das orientações
		const orientacoes =
			response.data?.orientacoes || response.orientacoes || [];
		const docentes = orientacoes
			.map((orientacao) => orientacao.docente)
			.filter(Boolean);

		return docentes;
	} catch (error) {
		console.error("Erro ao carregar orientadores do curso:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao carregar lista de orientadores do curso",
		);
	}
}

/**
 * POST - Enviar convite de orientação
 */
export async function enviarConviteOrientacao(dadosConvite) {
	try {
		const response = await axiosInstance.post("/convites", {
			formData: dadosConvite,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao enviar convite:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao enviar convite. Tente novamente.",
		);
	}
}

// Exportação padrão
const conviteOrientadorService = {
	getOrientadoresPorCurso,
	enviarConviteOrientacao,
};

export default conviteOrientadorService;

