import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Dicente } from "../types/dicente";

/**
 * GET - Buscar dados do perfil do dicente logado
 */
export async function getMeuPerfil(): Promise<Dicente> {
	try {
		const response = await axiosInstance.get<Dicente>("/dicentes/meu-perfil");
		return response;
	} catch (error) {
		console.error("Erro ao carregar dados do dicente:", error);
		throw new Error(
			getErrorMessage(
				error,
				"Erro ao carregar dados. Você pode não estar vinculado a um perfil de discente.",
			),
		);
	}
}

/**
 * PUT - Atualizar email do dicente
 */
export async function atualizarEmailDicente(
	matricula: string,
	email: string,
): Promise<unknown> {
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
		throw new Error(getErrorMessage(error, "Falha ao atualizar email!"));
	}
}

// Exportação padrão
const perfilDicenteService = {
	getMeuPerfil,
	atualizarEmailDicente,
};

export default perfilDicenteService;
