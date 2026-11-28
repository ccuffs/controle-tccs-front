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

// GET - TCCs do próprio discente num período (a API restringe à matrícula de quem pede),
// com orientações e defesas (banca, datas e notas).
export async function getMeusTrabalhosNoPeriodo(periodo: {
	ano: number;
	semestre: number;
}): Promise<TrabalhoConclusao[]> {
	try {
		const response = await axiosInstance.get<{ trabalhos?: TrabalhoConclusao[] }>(
			`/trabalho-conclusao?ano=${periodo.ano}&semestre=${periodo.semestre}`,
		);
		return response.trabalhos || [];
	} catch (error) {
		console.error("Erro ao buscar trabalhos de conclusão do período:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar o TCC do período"),
		);
	}
}

// GET - Todos os TCCs do próprio discente (a API restringe à matrícula de quem pede)
export async function getMeusTrabalhos(): Promise<TrabalhoConclusao[]> {
	try {
		const response = await axiosInstance.get<{ trabalhos?: TrabalhoConclusao[] }>("/trabalho-conclusao");
		return response.trabalhos || [];
	} catch (error) {
		throw new Error(getErrorMessage(error, "Erro ao buscar seus TCCs"));
	}
}

// Exportação padrão
const trabalhoConclusaoService = {
	getTrabalhoConclusaoByDiscente,
	getTrabalhoConclusaoByDiscenteOfertaAtual,
	getMeusTrabalhosNoPeriodo,
	getMeusTrabalhos,
};

export default trabalhoConclusaoService;
