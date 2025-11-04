import axiosInstance from "../auth/axios.js";

// GET - Buscar cursos do orientador
export async function getCursosOrientador(codigoDocente) {
	try {
		const response = await axiosInstance.get(
			`/orientadores/docente/${codigoDocente}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar cursos do orientador:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar cursos do orientador",
		);
	}
}

// GET - Buscar ofertas TCC
export async function getOfertasTcc(params) {
	try {
		const response = await axiosInstance.get("/ofertas-tcc", {
			params,
		});
		return response.ofertas || [];
	} catch (error) {
		console.error("Erro ao buscar ofertas TCC:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar ofertas TCC",
		);
	}
}

// GET - Buscar grade de disponibilidade
export async function getGradeDisponibilidade(
	codigoDocente,
	ano,
	semestre,
	idCurso,
	fase,
) {
	try {
		const response = await axiosInstance.get(
			`/disponibilidade-banca/grade/${codigoDocente}/${ano}/${semestre}/${idCurso}/${fase}`,
		);
		return response.grade;
	} catch (error) {
		console.error("Erro ao buscar grade de disponibilidade:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar grade de disponibilidade",
		);
	}
}

// GET - Buscar defesas
export async function getDefesas(params) {
	try {
		const response = await axiosInstance.get("/defesas", {
			params,
		});
		return response.defesas || response.data?.defesas || [];
	} catch (error) {
		console.error("Erro ao buscar defesas:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar defesas",
		);
	}
}

// DELETE - Remover disponibilidade
export async function removerDisponibilidade(
	ano,
	semestre,
	idCurso,
	fase,
	codigoDocente,
	dataDefesa,
	horaDefesa,
) {
	try {
		const response = await axiosInstance.delete(
			`/disponibilidade-banca/${ano}/${semestre}/${idCurso}/${fase}/${codigoDocente}/${dataDefesa}/${horaDefesa}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao remover disponibilidade:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao remover disponibilidade",
		);
	}
}

// POST - Sincronizar disponibilidades
export async function sincronizarDisponibilidades(disponibilidades) {
	try {
		const response = await axiosInstance.post(
			"/disponibilidade-banca/sincronizar",
			{
				disponibilidades,
			},
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao sincronizar disponibilidades:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao sincronizar disponibilidades",
		);
	}
}

// Exportação padrão
const disponibilidadeBancaService = {
	getCursosOrientador,
	getOfertasTcc,
	getGradeDisponibilidade,
	getDefesas,
	removerDisponibilidade,
	sincronizarDisponibilidades,
};

export default disponibilidadeBancaService;

