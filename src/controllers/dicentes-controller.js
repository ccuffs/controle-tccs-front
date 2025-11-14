/**
 * Prepara os dados de um dicente para edição
 */
export function prepareEditData(data) {
	return {
		matricula: data.matricula,
		nome: data.nome || "",
		email: data.email || "",
	};
}

/**
 * Valida os dados do formulário
 */
export function validateFormData(formData, isEditing) {
	const errors = [];

	if (!formData.matricula && !isEditing) {
		errors.push("Matrícula é obrigatória");
	}
	if (!formData.nome) errors.push("Nome é obrigatório");
	if (!formData.email) errors.push("Email é obrigatório");

	// Validação básica de email
	if (formData.email && !formData.email.includes("@")) {
		errors.push("Email inválido");
	}

	if (errors.length > 0) {
		return {
			isValid: false,
			message: `Por favor, preencha todos os campos obrigatórios: ${errors.join(", ")}!`,
		};
	}

	return { isValid: true };
}

/**
 * Prepara os dados para envio à API na criação
 */
export function prepareDataForCreate(formData) {
	return {
		...formData,
		matricula: parseInt(formData.matricula),
	};
}

/**
 * Prepara os dados para envio à API na edição
 */
export function prepareDataForUpdate(formData) {
	return {
		nome: formData.nome,
		email: formData.email,
	};
}

/**
 * Formata a contagem de dicentes para exibição
 */
export function formatDicentesCount(count) {
	return `${count} dicente${count !== 1 ? "s" : ""} encontrado${
		count !== 1 ? "s" : ""
	}`;
}

/**
 * Encontra um curso pelo ID na lista de cursos
 */
export function findCursoById(cursos, cursoId) {
	return cursos.find((c) => c.id === cursoId) || null;
}

// Exportação padrão
const dicentesController = {
	prepareEditData,
	validateFormData,
	prepareDataForCreate,
	prepareDataForUpdate,
	formatDicentesCount,
	findCursoById,
};

export default dicentesController;
