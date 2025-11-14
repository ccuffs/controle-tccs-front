import axiosInstance from "../auth/axios.js";

/**
 * GET - Buscar docentes de banca por curso
 */
export async function getDocentesBancaPorCurso(idCurso) {
	try {
		const response = await axiosInstance.get(
			`/banca-curso/curso/${idCurso}`,
		);

		// Extrair os docentes da banca
		const docentesBanca =
			response.data?.docentesBanca || response.docentesBanca || [];
		const docentes = docentesBanca
			.map((banca) => banca.docente)
			.filter(Boolean);

		return docentes;
	} catch (error) {
		console.error("Erro ao carregar docentes de banca do curso:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao carregar lista de docentes de banca do curso",
		);
	}
}

/**
 * POST - Enviar convite de banca
 */
export async function enviarConviteBanca(dadosConvite) {
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

/**
 * POST - Enviar múltiplos convites de banca
 */
export async function enviarConvitesBanca(listaConvites) {
	try {
		const resultados = [];

		for (const convite of listaConvites) {
			const resultado = await enviarConviteBanca(convite);
			resultados.push(resultado);
		}

		return resultados;
	} catch (error) {
		console.error("Erro ao enviar convites:", error);
		throw error;
	}
}

// Exportação padrão
const conviteBancaService = {
	getDocentesBancaPorCurso,
	enviarConviteBanca,
	enviarConvitesBanca,
};

export default conviteBancaService;
