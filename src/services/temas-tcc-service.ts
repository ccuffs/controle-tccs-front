import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Curso, OrientadorCurso } from "../types/curso";
import type { AreaTcc, TemaTcc } from "../types/tema-tcc";

export interface TemaTccPayload {
	descricao: string;
	id_area_tcc: number | string;
	codigo_docente: string;
}

export interface AreaTccPayload {
	descricao: string;
	codigo_docente: string;
}

// GET - Buscar todos os cursos
export async function getCursos(): Promise<Curso[]> {
	try {
		const response = await axiosInstance.get<{ cursos: Curso[] }>("/cursos");
		return response.cursos || [];
	} catch (error) {
		console.error("Erro ao buscar cursos:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar cursos"));
	}
}

// GET - Buscar cursos do orientador
export async function getCursosOrientador(
	codigoDocente: string,
): Promise<OrientadorCurso[]> {
	try {
		const response = await axiosInstance.get<{ orientacoes: OrientadorCurso[] }>(
			`/orientadores/docente/${codigoDocente}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar cursos do orientador:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar cursos do orientador"),
		);
	}
}

// GET - Buscar docentes orientadores por curso
export async function getDocentesOrientadoresPorCurso(
	idCurso: number,
): Promise<OrientadorCurso[]> {
	try {
		const response = await axiosInstance.get<{ orientacoes: OrientadorCurso[] }>(
			`/orientadores/curso/${idCurso}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar docentes orientadores:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar docentes orientadores"),
		);
	}
}

// GET - Buscar áreas TCC por docente
export async function getAreasTccPorDocente(
	codigoDocente: string,
): Promise<AreaTcc[]> {
	try {
		const response = await axiosInstance.get<{ areas: AreaTcc[] }>(
			`/areas-tcc/docente/${codigoDocente}`,
		);
		return response.areas || [];
	} catch (error) {
		console.error("Erro ao buscar áreas TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar áreas TCC"));
	}
}

// GET - Buscar temas por curso
export async function getTemasPorCurso(idCurso: number): Promise<TemaTcc[]> {
	try {
		const response = await axiosInstance.get<TemaTcc[]>(
			`/temas-tcc/curso/${idCurso}`,
		);
		return response || [];
	} catch (error) {
		console.error("Erro ao buscar temas TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar temas TCC"));
	}
}

// GET - Buscar temas por docente e curso
export async function getTemasPorCursoOrientador(
	codigoDocente: string,
	idCurso: number,
): Promise<TemaTcc[]> {
	try {
		const response = await axiosInstance.get<TemaTcc[]>(
			`/temas-tcc/docente/${codigoDocente}/curso/${idCurso}`,
		);
		return response || [];
	} catch (error) {
		console.error("Erro ao buscar temas TCC do orientador:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar temas TCC do orientador"),
		);
	}
}

// POST - Criar tema TCC
export async function criarTemaTcc(data: TemaTccPayload): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/temas-tcc",
			data,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar tema TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao criar tema TCC"));
	}
}

// POST - Criar área TCC
export async function criarAreaTcc(data: AreaTccPayload): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/areas-tcc",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar área TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao criar área TCC"));
	}
}

// PUT - Atualizar tema TCC (status ativo)
export async function atualizarTemaTcc(
	id: number,
	ativo: boolean,
): Promise<unknown> {
	try {
		const response = await axiosInstance.put<{ data: unknown }>(
			"/temas-tcc",
			{ id, ativo },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar tema TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao atualizar tema TCC"));
	}
}

// PATCH - Atualizar vagas da oferta do docente
export async function atualizarVagasOferta(
	codigoDocente: string,
	idCurso: number,
	vagas: number,
): Promise<unknown> {
	try {
		const response = await axiosInstance.patch<{ data: unknown }>(
			`/temas-tcc/docente/${codigoDocente}/curso/${idCurso}/vagas`,
			{ vagas },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar vagas da oferta:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao atualizar vagas da oferta"),
		);
	}
}

// DELETE - Deletar tema TCC
export async function deletarTemaTcc(id: number): Promise<unknown> {
	try {
		const response = await axiosInstance.delete<{ data: unknown }>(
			`/temas-tcc/${id}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar tema TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao deletar tema TCC"));
	}
}

export interface TemaTccCompleto {
	descricao: string;
	id_area_tcc: number;
	codigo_docente: string;
	ativo: boolean;
}

// POST - Criar tema já com status (retorna o tema criado)
export async function criarTemaCompleto(data: TemaTccCompleto): Promise<TemaTcc> {
	try {
		return await axiosInstance.post<TemaTcc>("/temas-tcc", data);
	} catch (error) {
		throw new Error(getErrorMessage(error, "Erro ao criar tema TCC"));
	}
}

// PUT - Atualizar todos os campos do tema
export async function editarTemaCompleto(id: number, data: TemaTccCompleto): Promise<void> {
	try {
		await axiosInstance.put("/temas-tcc", { id, ...data });
	} catch (error) {
		throw new Error(getErrorMessage(error, "Erro ao atualizar tema TCC"));
	}
}

/** Cria a área para o docente e devolve o id (a API não retorna o registro criado). */
export async function criarAreaERetornarId(descricao: string, codigoDocente: string): Promise<number> {
	await criarAreaTcc({ descricao, codigo_docente: codigoDocente });
	const areas = await getAreasTccPorDocente(codigoDocente);
	const criada = areas
		.filter((a) => a.descricao.trim().toLocaleLowerCase("pt-BR") === descricao.trim().toLocaleLowerCase("pt-BR"))
		.sort((a, b) => b.id - a.id)[0];
	if (!criada) throw new Error("A área foi criada, mas não foi encontrada. Recarregue a página.");
	return criada.id;
}

// Exportação padrão
const temasTccService = {
	criarTemaCompleto,
	editarTemaCompleto,
	criarAreaERetornarId,
	getCursos,
	getCursosOrientador,
	getDocentesOrientadoresPorCurso,
	getAreasTccPorDocente,
	getTemasPorCurso,
	getTemasPorCursoOrientador,
	criarTemaTcc,
	criarAreaTcc,
	atualizarTemaTcc,
	atualizarVagasOferta,
	deletarTemaTcc,
};

export default temasTccService;
