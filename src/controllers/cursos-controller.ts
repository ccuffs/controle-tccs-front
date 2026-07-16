export interface CursoFormData {
	id: number | "";
	codigo: number | string;
	nome: string;
	turno: string;
}

interface ValidacaoResultado {
	isValid: boolean;
	message?: string;
}

/**
 * Prepara os dados de um curso para edição
 */
export function prepareEditData(data: {
	id?: number | "" | null;
	codigo?: number | string | null;
	nome?: string | null;
	turno?: string | null;
}): CursoFormData {
	return {
		id: data.id ?? "",
		codigo: data.codigo || "",
		nome: data.nome || "",
		turno: data.turno || "",
	};
}

/**
 * Prepara os dados de turno para edição
 */
export function getTurnoFromData(data: { turno?: string | null }): string {
	return data.turno || "";
}

/**
 * Valida os dados do formulário
 */
export function validateFormData(
	formData: Partial<CursoFormData>,
	_edit: boolean,
): ValidacaoResultado {
	const errors: string[] = [];

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
export function prepareDataForCreate(formData: CursoFormData): {
	codigo: number | string;
	nome: string;
	turno: string;
} {
	return {
		codigo: formData.codigo,
		nome: formData.nome,
		turno: formData.turno,
	};
}

/**
 * Prepara os dados para envio à API na edição
 */
export function prepareDataForUpdate(
	formData: CursoFormData,
): CursoFormData & { id: number } {
	return formData as CursoFormData & { id: number };
}

/**
 * Reset do formulário
 */
export function getResetFormData(): CursoFormData {
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
export function getResetTurno(): string {
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
