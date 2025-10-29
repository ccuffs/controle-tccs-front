import axiosInstance from "../auth/axios.js";

// GET - Buscar todos os docentes
export async function getDocentes() {
	try {
		const response = await axiosInstance.get("/docentes");
		return response.docentes || [];
	} catch (error) {
		console.error("Erro ao buscar docentes:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar docentes",
		);
	}
}

// POST - Criar novo docente
export async function createDocente(data) {
	try {
		const response = await axiosInstance.post("/docentes", {
			formData: data,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao criar docente:", error);
		throw error;
	}
}

// Exportação padrão para manter compatibilidade
const docentesService = {
	getDocentes,
	createDocente,
};

export default docentesService;

