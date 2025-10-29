/**
 * Prepara os dados para criar uma nova orientação
 */
export function prepareDataForOrientacao(cursoSelecionado, codigoDocente) {
	return {
		id_curso: cursoSelecionado,
		codigo_docente: codigoDocente,
	};
}

/**
 * Valida os dados do formulário de orientação
 */
export function validateOrientacaoData(cursoSelecionado, codigoDocente) {
	const errors = [];

	if (!cursoSelecionado) errors.push("Curso é obrigatório");
	if (!codigoDocente) errors.push("Docente é obrigatório");

	if (errors.length > 0) {
		return {
			isValid: false,
			message: `Por favor, ${errors.join(" e ")}!`,
		};
	}

	return { isValid: true };
}

/**
 * Prepara os dados para criar um novo docente
 */
export function prepareDataForDocente(formData) {
	return {
		...formData,
		sala: formData.sala ? parseInt(formData.sala) : null,
		siape: formData.siape ? parseInt(formData.siape) : null,
	};
}

/**
 * Valida os dados do formulário de docente
 */
export function validateDocenteData(formData) {
	const errors = [];

	if (!formData.codigo) errors.push("Código é obrigatório");
	if (!formData.nome) errors.push("Nome é obrigatório");
	if (!formData.email) errors.push("Email é obrigatório");

	// Validação básica de email
	if (formData.email && !formData.email.includes("@")) {
		errors.push("Email inválido");
	}

	if (errors.length > 0) {
		return {
			isValid: false,
			message: `Por favor, preencha os campos obrigatórios (${errors.join(", ")})!`,
		};
	}

	return { isValid: true };
}

/**
 * Retorna dados resetados para formulário de orientação
 */
export function getResetOrientacaoFormData() {
	return {
		id_curso: "",
		codigo_docente: "",
	};
}

/**
 * Retorna dados resetados para formulário de docente
 */
export function getResetDocenteFormData() {
	return {
		codigo: "",
		nome: "",
		email: "",
		sala: "",
		siape: "",
	};
}

/**
 * Prepara dados de exclusão de orientação
 */
export function prepareDeleteData(row) {
	return {
		id_curso: row.id_curso,
		codigo_docente: row.codigo_docente,
	};
}

// Exportação padrão
const orientadoresController = {
	prepareDataForOrientacao,
	validateOrientacaoData,
	prepareDataForDocente,
	validateDocenteData,
	getResetOrientacaoFormData,
	getResetDocenteFormData,
	prepareDeleteData,
};

export default orientadoresController;

