import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type { Curso, OrientadorCurso } from "../types/curso";
import type { Docente } from "../types/docente";
import type { Dicente } from "../types/dicente";
import type { Orientacao, TrabalhoConclusao } from "../types/trabalho-conclusao";
import type { AreaTcc, OfertaTcc } from "../types/tema-tcc";
import type { Defesa } from "../types/defesa";
import type { Convite } from "../types/convite";

export interface UploadPdfDetalhe {
	matricula: string;
	nome: string;
	status: string;
}

export interface UploadPdfResponse {
	message: string;
	totalEncontrados: number;
	sucessos: number;
	erros: number;
	detalhes: UploadPdfDetalhe[];
	orientacoesIncluidas: boolean;
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

// GET - Buscar orientadores por curso
export async function getOrientadoresCurso(
	idCurso: number,
): Promise<OrientadorCurso[]> {
	try {
		const response = await axiosInstance.get<{ orientacoes: OrientadorCurso[] }>(
			`/orientadores/curso/${idCurso}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar orientadores do curso:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar orientadores do curso"),
		);
	}
}

// GET - Buscar docentes de banca por curso
export async function getDocentesBancaCurso(
	idCurso: number,
): Promise<{ docente: Docente }[]> {
	try {
		const response = await axiosInstance.get<{
			data?: { docentesBanca?: { docente: Docente }[] };
			docentesBanca?: { docente: Docente }[];
		}>(`/banca-curso/curso/${idCurso}`);
		return response.data?.docentesBanca || response.docentesBanca || [];
	} catch (error) {
		console.error("Erro ao buscar docentes de banca do curso:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar docentes de banca do curso"),
		);
	}
}

// GET - Buscar ofertas TCC
export async function getOfertasTcc(): Promise<OfertaTcc[]> {
	try {
		const response = await axiosInstance.get<{ ofertas: OfertaTcc[] }>(
			"/ofertas-tcc",
		);
		return response.ofertas || [];
	} catch (error) {
		console.error("Erro ao buscar ofertas TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar ofertas TCC"));
	}
}

// GET - Buscar dicentes
export async function getDicentes(
	params?: Record<string, unknown>,
): Promise<Dicente[]> {
	try {
		const response = await axiosInstance.get<{ dicentes: Dicente[] }>(
			"/dicentes",
			{ params },
		);
		return response.dicentes || [];
	} catch (error) {
		console.error("Erro ao buscar dicentes:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar dicentes"));
	}
}

// GET - Buscar orientações
export async function getOrientacoes(
	params?: Record<string, unknown>,
): Promise<Orientacao[]> {
	try {
		const response = await axiosInstance.get<{ orientacoes: Orientacao[] }>(
			"/orientacoes",
			{ params },
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar orientações:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar orientações"));
	}
}

// GET - Buscar trabalhos de conclusão
export async function getTrabalhosConclusao(
	params?: Record<string, unknown>,
): Promise<TrabalhoConclusao[]> {
	try {
		const response = await axiosInstance.get<{
			data?: { trabalhos?: TrabalhoConclusao[] };
			trabalhos?: TrabalhoConclusao[];
		}>("/trabalho-conclusao", { params });
		return response.data?.trabalhos || response.trabalhos || [];
	} catch (error) {
		console.error("Erro ao buscar trabalhos de conclusão:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao buscar trabalhos de conclusão"),
		);
	}
}

// GET - Buscar áreas TCC
export async function getAreasTcc(): Promise<AreaTcc[]> {
	try {
		const response = await axiosInstance.get<{ areas: AreaTcc[] }>(
			"/areas-tcc",
		);
		return response.areas || [];
	} catch (error) {
		console.error("Erro ao buscar áreas TCC:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar áreas TCC"));
	}
}

// GET - Buscar defesas por TCC
export async function getDefesasPorTcc(idTcc: number): Promise<Defesa[]> {
	try {
		const response = await axiosInstance.get<{
			data?: { defesas?: Defesa[] };
			defesas?: Defesa[];
		}>(`/defesas/tcc/${idTcc}`);
		return response.data?.defesas || response.defesas || [];
	} catch (error) {
		console.error("Erro ao buscar defesas:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar defesas"));
	}
}

// GET - Buscar convites
export async function getConvites(
	params?: Record<string, unknown>,
): Promise<Convite[]> {
	try {
		const response = await axiosInstance.get<{
			data?: { convites?: Convite[] };
			convites?: Convite[];
		}>("/convites", { params });
		return response.data?.convites || response.convites || [];
	} catch (error) {
		console.error("Erro ao buscar convites:", error);
		throw new Error(getErrorMessage(error, "Erro ao buscar convites"));
	}
}

// PUT - Atualizar trabalho de conclusão
export async function atualizarTrabalhoConclusao(
	idTcc: number,
	data: unknown,
): Promise<unknown> {
	try {
		const response = await axiosInstance.put<{ data: unknown }>(
			`/trabalho-conclusao/${idTcc}`,
			data,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar trabalho de conclusão:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao atualizar trabalho de conclusão"),
		);
	}
}

// DELETE - Deletar orientação
export async function deletarOrientacao(idOrientacao: number): Promise<unknown> {
	try {
		const response = await axiosInstance.delete<{ data: unknown }>(
			`/orientacoes/${idOrientacao}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar orientação:", error);
		throw new Error(getErrorMessage(error, "Erro ao deletar orientação"));
	}
}

// DELETE - Deletar convite
export async function deletarConvite(
	idTcc: number,
	codigoDocente: string,
	fase: number,
): Promise<unknown> {
	try {
		const response = await axiosInstance.delete<{ data: unknown }>(
			`/convites/${idTcc}/${codigoDocente}/${fase}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar convite:", error);
		throw new Error(getErrorMessage(error, "Erro ao deletar convite"));
	}
}

// POST - Criar convite
export async function criarConvite(data: unknown): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/convites",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar convite:", error);
		throw new Error(getErrorMessage(error, "Erro ao criar convite"));
	}
}

// POST - Criar orientação
export async function criarOrientacao(data: unknown): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/orientacoes",
			{ formData: data },
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar orientação:", error);
		throw new Error(getErrorMessage(error, "Erro ao criar orientação"));
	}
}

// POST - Gerenciar banca de defesa
export async function gerenciarBancaDefesa(payload: unknown): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/defesas/gerenciar-banca",
			payload,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao gerenciar banca de defesa:", error);
		throw new Error(
			getErrorMessage(error, "Erro ao gerenciar banca de defesa"),
		);
	}
}

// POST - Agendar defesa
export async function agendarDefesa(payload: unknown): Promise<unknown> {
	try {
		const response = await axiosInstance.post<{ data: unknown }>(
			"/defesas/agendar",
			payload,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao agendar defesa:", error);
		throw new Error(getErrorMessage(error, "Erro ao agendar defesa"));
	}
}

// POST - Upload de PDF para processar dicentes
export async function uploadPdfDicentes(
	formData: FormData,
): Promise<UploadPdfResponse> {
	try {
		const response = await axiosInstance.post<UploadPdfResponse>(
			"/dicentes/processar-pdf",
			formData,
			{ headers: { "Content-Type": "multipart/form-data" } },
		);
		return response;
	} catch (error) {
		console.error("Erro ao fazer upload do PDF:", error);
		throw new Error(getErrorMessage(error, "Erro ao fazer upload do PDF"));
	}
}

// Exportação padrão
const orientacaoService = {
	getCursos,
	getCursosOrientador,
	getOrientadoresCurso,
	getDocentesBancaCurso,
	getOfertasTcc,
	getDicentes,
	getOrientacoes,
	getTrabalhosConclusao,
	getAreasTcc,
	getDefesasPorTcc,
	getConvites,
	atualizarTrabalhoConclusao,
	deletarOrientacao,
	deletarConvite,
	criarConvite,
	criarOrientacao,
	gerenciarBancaDefesa,
	agendarDefesa,
	uploadPdfDicentes,
};

export default orientacaoService;
