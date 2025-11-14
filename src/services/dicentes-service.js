import axiosInstance from "../auth/axios.js";

// GET - Buscar dicente por ID de usuário
export async function getDicenteByUsuario(usuarioId) {
	try {
		const response = await axiosInstance.get(
			`/dicentes/usuario/${usuarioId}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar dicente por usuário:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar dicente",
		);
	}
}

// GET - Buscar todos os dicentes
export async function getDicentes() {
	try {
		const response = await axiosInstance.get("/dicentes");
		return response.dicentes || [];
	} catch (error) {
		console.error("Erro ao buscar dicentes:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar dicentes",
		);
	}
}

// POST - Criar novo dicente
export async function createDicente(data) {
	try {
		const response = await axiosInstance.post("/dicentes", {
			formData: data,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao criar dicente:", error);
		throw error;
	}
}

// PUT - Atualizar dicente existente
export async function updateDicente(matricula, data) {
	try {
		const response = await axiosInstance.put(`/dicentes/${matricula}`, {
			formData: data,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar dicente:", error);
		throw error;
	}
}

// DELETE - Remover dicente
export async function deleteDicente(matricula) {
	try {
		const response = await axiosInstance.delete(`/dicentes/${matricula}`);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar dicente:", error);
		throw error;
	}
}

// Exportação padrão para manter compatibilidade
const dicentesService = {
	getDicenteByUsuario,
	getDicentes,
	createDicente,
	updateDicente,
	deleteDicente,
};

export default dicentesService;
