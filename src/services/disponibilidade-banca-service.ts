import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { BancaCurso, OrientadorCurso } from "../types/curso";
import type { Defesa, GradeDisponibilidade } from "../types/defesa";
import type { OfertaTcc } from "../types/tema-tcc";

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

// GET - Buscar cursos do membro de banca
export async function getCursosBanca(codigoDocente: string): Promise<BancaCurso[]> {
	try {
		const response = await axiosInstance.get<{ cursos: BancaCurso[] }>(
			`/banca-curso/docente/${codigoDocente}`,
		);
		return response.cursos || [];
	} catch (error) {
		console.error("Erro ao buscar cursos da banca:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar cursos da banca"));
	}
}

// GET - Buscar ofertas TCC
export async function getOfertasTcc(
	params?: Record<string, unknown>,
): Promise<OfertaTcc[]> {
	try {
		const response = await axiosInstance.get<{ ofertas: OfertaTcc[] }>(
			"/ofertas-tcc",
			{ params },
		);
		return response.ofertas || [];
	} catch (error) {
		console.error("Erro ao buscar ofertas TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar ofertas TCC"));
	}
}

// GET - Buscar grade de disponibilidade
export async function getGradeDisponibilidade(
	codigoDocente: string,
	ano: number | string,
	semestre: number | string,
	idCurso: number | string,
	fase: number | string,
): Promise<GradeDisponibilidade> {
	try {
		const response = await axiosInstance.get<{ grade: GradeDisponibilidade }>(
			`/disponibilidade-banca/grade/${codigoDocente}/${ano}/${semestre}/${idCurso}/${fase}`,
		);
		return response.grade;
	} catch (error) {
		console.error("Erro ao buscar grade de disponibilidade:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar grade de disponibilidade"),
		);
	}
}

// GET - Buscar defesas
export async function getDefesas(
	params?: Record<string, unknown>,
): Promise<Defesa[]> {
	try {
		const response = await axiosInstance.get<{
			defesas?: Defesa[];
			data?: { defesas?: Defesa[] };
		}>("/defesas", { params });
		return response.defesas || response.data?.defesas || [];
	} catch (error) {
		console.error("Erro ao buscar defesas:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar defesas"));
	}
}

// DELETE - Remover disponibilidade
export async function removerDisponibilidade(
	ano: number | string,
	semestre: number | string,
	idCurso: number | string,
	fase: number | string,
	codigoDocente: string,
	dataDefesa: string,
	horaDefesa: string,
): Promise<unknown> {
	try {
		const response = await axiosInstance.delete<{ data: unknown }>(
			`/disponibilidade-banca/${ano}/${semestre}/${idCurso}/${fase}/${codigoDocente}/${dataDefesa}/${horaDefesa}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao remover disponibilidade:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao remover disponibilidade"),
		);
	}
}

// POST - Sincronizar disponibilidades
export async function sincronizarDisponibilidades(
	disponibilidades: unknown[],
): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/disponibilidade-banca/sincronizar",
			{ disponibilidades },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao sincronizar disponibilidades:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao sincronizar disponibilidades"),
		);
	}
}

// Exportação padrão
const disponibilidadeBancaService = {
	getCursosOrientador,
	getCursosBanca,
	getOfertasTcc,
	getGradeDisponibilidade,
	getDefesas,
	removerDisponibilidade,
	sincronizarDisponibilidades,
};

export default disponibilidadeBancaService;
