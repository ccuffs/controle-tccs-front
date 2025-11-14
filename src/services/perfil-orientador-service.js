import axiosInstance from "../auth/axios.js";

// GET - Buscar perfil do docente logado
export async function getMeuPerfil() {
	try {
		const response = await axiosInstance.get("/docentes/meu-perfil");
		return response.docente;
	} catch (error) {
		console.error("Erro ao buscar perfil do docente:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar perfil do docente",
		);
	}
}

// PUT - Atualizar dados do docente
export async function atualizarDocente(data) {
	try {
		const response = await axiosInstance.put("/docentes/", {
			formData: data,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar docente:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao atualizar docente",
		);
	}
}

// Exportação padrão
const perfilOrientadorService = {
	getMeuPerfil,
	atualizarDocente,
};

export default perfilOrientadorService;
