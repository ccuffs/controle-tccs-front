/**
 * Prepara os dados de um curso para edição
 */
export function prepareEditData(data) {
	return {
		id: data.id,
		codigo: data.codigo || "",
		nome: data.nome || "",
		turno: data.turno || "",
	};
}

/**
 * Prepara os dados de turno para edição
 */
export function getTurnoFromData(data) {
	return data.turno || "";
}

/**
 * Valida os dados do formulário
 */
export function validateFormData(formData, edit) {
	const errors = [];

	if (!formData.codigo) errors.push("Código é obrigatório");
	if (!formData.nome) errors.push("Nome é obrigatório");
	if (!formData.turno) errors.push("Turno é obrigatório");

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
		codigo: formData.codigo,
		nome: formData.nome,
		turno: formData.turno,
	};
}

/**
 * Prepara os dados para envio à API na edição
 */
export function prepareDataForUpdate(formData) {
	return formData;
}

/**
 * Reset do formulário
 */
export function getResetFormData() {
	return {
		id: "",
		codigo: "",
		nome: "",
		turno: "",
	};
}

/**
 * Reset do turno selecionado
 */
export function getResetTurno() {
	return "";
}

// Exportação padrão
const cursosController = {
	prepareEditData,
	getTurnoFromData,
	validateFormData,
	prepareDataForCreate,
	prepareDataForUpdate,
	getResetFormData,
	getResetTurno,
};

export default cursosController;
