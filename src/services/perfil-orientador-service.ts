import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Docente } from "../types/docente";

// GET - Buscar perfil do docente logado
export async function getMeuPerfil(): Promise<Docente> {
	try {
		const response = await axiosInstance.get<{ docente: Docente }>(
			"/docentes/meu-perfil",
		);
		return response.docente;
	} catch (error) {
		console.error("Erro ao buscar perfil do docente:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar perfil do docente"),
		);
	}
}

// PUT - Atualizar dados do docente
export async function atualizarDocente(data: unknown): Promise<unknown> {
	try {
		const response = await axiosInstance.put<{ data: unknown }>(
			"/docentes/",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar docente:", error);
		throw new Error(getErrorMessage(error, "Erro ao atualizar docente"));
	}
}

// Exportação padrão
const perfilOrientadorService = {
	getMeuPerfil,
	atualizarDocente,
};

export default perfilOrientadorService;
