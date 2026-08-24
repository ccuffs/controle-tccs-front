import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { TrabalhoConclusao } from "../types/trabalho-conclusao";

// GET - Buscar trabalho de conclusão por discente (mais recente, qualquer semestre)
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

// GET - Buscar trabalho de conclusão do discente na oferta/semestre atual
export async function getTrabalhoConclusaoByDiscenteOfertaAtual(
	matricula: string,
): Promise<TrabalhoConclusao | null> {
	try {
		const response = await axiosInstance.get<TrabalhoConclusao>(
			`/trabalho-conclusao/discente/${matricula}/oferta-atual`,
		);
		return response;
	} catch (error: unknown) {
		const status =
			(error as { response?: { status?: number } })?.response?.status;
		if (status === 404) {
			return null;
		}
		console.error(
			"Erro ao buscar trabalho de conclusão da oferta atual:",
			error,
		);
		throw new Error(
			getErrorMessage(
				error,
				"Erro ao buscar trabalho de conclusão da oferta atual",
			),
		);
	}
}

// Exportação padrão
const trabalhoConclusaoService = {
	getTrabalhoConclusaoByDiscente,
	getTrabalhoConclusaoByDiscenteOfertaAtual,
};

export default trabalhoConclusaoService;
