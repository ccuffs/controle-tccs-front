import axiosInstance from "../auth/axios.js";

// GET - Buscar trabalho de conclusão por discente
export async function getTrabalhoConclusaoByDiscente(matricula) {
	try {
		const response = await axiosInstance.get(
			`/trabalho-conclusao/discente/${matricula}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar trabalho de conclusão:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar trabalho de conclusão",
		);
	}
}

// Exportação padrão
const trabalhoConclusaoService = {
	getTrabalhoConclusaoByDiscente,
};

export default trabalhoConclusaoService;

