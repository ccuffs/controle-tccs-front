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

// GET - Buscar orientadores por curso
export async function getOrientadoresCurso(idCurso) {
	try {
		const response = await axiosInstance.get(
			`/orientadores/curso/${idCurso}`,
		);
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar orientadores do curso:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar orientadores do curso",
		);
	}
}

// GET - Buscar docentes de banca por curso
export async function getDocentesBancaCurso(idCurso) {
	try {
		const response = await axiosInstance.get(
			`/banca-curso/curso/${idCurso}`,
		);
		return response.data?.docentesBanca || response.docentesBanca || [];
	} catch (error) {
		console.error("Erro ao buscar docentes de banca do curso:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar docentes de banca do curso",
		);
	}
}

// GET - Buscar ofertas TCC
export async function getOfertasTcc() {
	try {
		const response = await axiosInstance.get("/ofertas-tcc");
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

// GET - Buscar dicentes
export async function getDicentes(params) {
	try {
		const response = await axiosInstance.get("/dicentes", {
			params,
		});
		return response.dicentes || [];
	} catch (error) {
		console.error("Erro ao buscar dicentes:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar dicentes",
		);
	}
}

// GET - Buscar orientações
export async function getOrientacoes(params) {
	try {
		const response = await axiosInstance.get("/orientacoes", {
			params,
		});
		return response.orientacoes || [];
	} catch (error) {
		console.error("Erro ao buscar orientações:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar orientações",
		);
	}
}

// GET - Buscar trabalhos de conclusão
export async function getTrabalhosConclusao(params) {
	try {
		const response = await axiosInstance.get("/trabalho-conclusao", {
			params,
		});
		return response.data?.trabalhos || response.trabalhos || [];
	} catch (error) {
		console.error("Erro ao buscar trabalhos de conclusão:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar trabalhos de conclusão",
		);
	}
}

// GET - Buscar áreas TCC
export async function getAreasTcc() {
	try {
		const response = await axiosInstance.get("/areas-tcc");
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

// GET - Buscar defesas por TCC
export async function getDefesasPorTcc(idTcc) {
	try {
		const response = await axiosInstance.get(`/defesas/tcc/${idTcc}`);
		return response.data?.defesas || response.defesas || [];
	} catch (error) {
		console.error("Erro ao buscar defesas:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar defesas",
		);
	}
}

// GET - Buscar convites
export async function getConvites(params) {
	try {
		const response = await axiosInstance.get("/convites", {
			params,
		});
		return response.data?.convites || response.convites || [];
	} catch (error) {
		console.error("Erro ao buscar convites:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao buscar convites",
		);
	}
}

// PUT - Atualizar trabalho de conclusão
export async function atualizarTrabalhoConclusao(idTcc, data) {
	try {
		const response = await axiosInstance.put(
			`/trabalho-conclusao/${idTcc}`,
			data,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar trabalho de conclusão:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao atualizar trabalho de conclusão",
		);
	}
}

// DELETE - Deletar orientação
export async function deletarOrientacao(idOrientacao) {
	try {
		const response = await axiosInstance.delete(
			`/orientacoes/${idOrientacao}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar orientação:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao deletar orientação",
		);
	}
}

// DELETE - Deletar convite
export async function deletarConvite(idTcc, codigoDocente, fase) {
	try {
		const response = await axiosInstance.delete(
			`/convites/${idTcc}/${codigoDocente}/${fase}`,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao deletar convite:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao deletar convite",
		);
	}
}

// POST - Criar convite
export async function criarConvite(data) {
	try {
		const response = await axiosInstance.post("/convites", {
			formData: data,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao criar convite:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao criar convite",
		);
	}
}

// POST - Criar orientação
export async function criarOrientacao(data) {
	try {
		const response = await axiosInstance.post("/orientacoes", {
			formData: data,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao criar orientação:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao criar orientação",
		);
	}
}

// POST - Gerenciar banca de defesa
export async function gerenciarBancaDefesa(payload) {
	try {
		const response = await axiosInstance.post(
			"/defesas/gerenciar-banca",
			payload,
		);
		return response.data;
	} catch (error) {
		console.error("Erro ao gerenciar banca de defesa:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao gerenciar banca de defesa",
		);
	}
}

// POST - Agendar defesa
export async function agendarDefesa(payload) {
	try {
		const response = await axiosInstance.post("/defesas/agendar", payload);
		return response.data;
	} catch (error) {
		console.error("Erro ao agendar defesa:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao agendar defesa",
		);
	}
}

// POST - Upload de PDF para processar dicentes
export async function uploadPdfDicentes(formData) {
	try {
		const response = await axiosInstance.post(
			"/dicentes/processar-pdf",
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			},
		);
		return response;
	} catch (error) {
		console.error("Erro ao fazer upload do PDF:", error);
		throw new Error(
			error.response?.data?.message ||
				error.message ||
				"Erro ao fazer upload do PDF",
		);
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
