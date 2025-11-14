import axiosInstance from "../auth/axios.js";

/**
 * GET - Buscar dados do perfil do dicente logado
 */
export async function getMeuPerfil() {
	try {
		const response = await axiosInstance.get("/dicentes/meu-perfil");
		return response;
	} catch (error) {
		console.error("Erro ao carregar dados do dicente:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao carregar dados. Você pode não estar vinculado a um perfil de discente.",
		);
	}
}

/**
 * PUT - Atualizar email do dicente
 */
export async function atualizarEmailDicente(matricula, email) {
	try {
		const response = await axiosInstance.put(`/dicentes/${matricula}`, {
			formData: {
				matricula: matricula,
				email: email || "",
			},
		});
		return response;
	} catch (error) {
		console.error("Erro ao atualizar email do dicente:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Falha ao atualizar email!",
		);
	}
}

// Exportação padrão
const perfilDicenteService = {
	getMeuPerfil,
	atualizarEmailDicente,
};

export default perfilDicenteService;
