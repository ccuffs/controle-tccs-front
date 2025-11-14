import axiosInstance from "../auth/axios.js";

// GET - Buscar todos os cursos
export async function getCursos() {
	try {
		const response = await axiosInstance.get("/cursos");
		return response.cursos || [];
	} catch (error) {
		console.error("Erro ao buscar cursos:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar cursos",
		);
	}
}

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

// GET - Buscar docentes orientadores por curso
export async function getDocentesOrientadoresPorCurso(idCurso) {
	try {
		const response = await axiosInstance.get(
			`/orientadores/curso/${idCurso}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar docentes orientadores:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar docentes orientadores",
		);
	}
}

// GET - Buscar áreas TCC por docente
export async function getAreasTccPorDocente(codigoDocente) {
	try {
		const response = await axiosInstance.get(
			`/areas-tcc/docente/${codigoDocente}`,
		);
		return response.areas || [];
	} catch (error) {
		console.error("Erro ao buscar áreas TCC:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar áreas TCC",
		);
	}
}

// GET - Buscar temas por curso
export async function getTemasPorCurso(idCurso) {
	try {
		const response = await axiosInstance.get(`/temas-tcc/curso/${idCurso}`);
		return response || [];
	} catch (error) {
		console.error("Erro ao buscar temas TCC:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar temas TCC",
		);
	}
}

// GET - Buscar temas por docente e curso
export async function getTemasPorCursoOrientador(codigoDocente, idCurso) {
	try {
		const response = await axiosInstance.get(
			`/temas-tcc/docente/${codigoDocente}/curso/${idCurso}`,
		);
		return response || [];
	} catch (error) {
		console.error("Erro ao buscar temas TCC do orientador:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar temas TCC do orientador",
		);
	}
}

// POST - Criar tema TCC
export async function criarTemaTcc(data) {
	try {
		const response = await axiosInstance.post("/temas-tcc", data);
		return response.data;
	} catch (error) {
		console.error("Erro ao criar tema TCC:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao criar tema TCC",
		);
	}
}

// POST - Criar área TCC
export async function criarAreaTcc(data) {
	try {
		const response = await axiosInstance.post("/areas-tcc", {
			formData: data,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao criar área TCC:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao criar área TCC",
		);
	}
}

// PUT - Atualizar tema TCC (status ativo)
export async function atualizarTemaTcc(id, ativo) {
	try {
		const response = await axiosInstance.put("/temas-tcc", {
			id,
			ativo,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar tema TCC:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao atualizar tema TCC",
		);
	}
}

// PATCH - Atualizar vagas da oferta do docente
export async function atualizarVagasOferta(codigoDocente, idCurso, vagas) {
	try {
		const response = await axiosInstance.patch(
			`/temas-tcc/docente/${codigoDocente}/curso/${idCurso}/vagas`,
			{
				vagas,
			},
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar vagas da oferta:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao atualizar vagas da oferta",
		);
	}
}

// DELETE - Deletar tema TCC
export async function deletarTemaTcc(id) {
	try {
		const response = await axiosInstance.delete(`/temas-tcc/${id}`);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar tema TCC:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao deletar tema TCC",
		);
	}
}

// Exportação padrão
const temasTccService = {
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
