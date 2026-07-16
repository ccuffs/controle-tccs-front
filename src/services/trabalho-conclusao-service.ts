import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { TrabalhoConclusao } from "../types/trabalho-conclusao";

// GET - Buscar trabalho de conclusão por discente
export async function getTrabalhoConclusaoByDiscente(
	matricula: string,
): Promise<TrabalhoConclusao> {
	try {
		const response = await axiosInstance.get<TrabalhoConclusao>(
			`/trabalho-conclusao/discente/${matricula}`,
		);
		return response;
	} catch (error) {
		console.error("Erro ao buscar trabalho de conclusão:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar trabalho de conclusão"),
		);
	}
}

// Exportação padrão
const trabalhoConclusaoService = {
	getTrabalhoConclusaoByDiscente,
};

export default trabalhoConclusaoService;
