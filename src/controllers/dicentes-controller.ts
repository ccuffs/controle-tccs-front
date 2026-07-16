import type { Curso } from "../types/curso";

export interface DicenteFormData {
	matricula: string | number;
	nome: string;
	email: string;
}

interface ValidacaoResultado {
	isValid: boolean;
	message?: string;
}

/**
 * Prepara os dados de um dicente para edição
 */
export function prepareEditData(data: Partial<DicenteFormData>): DicenteFormData {
	return {
		matricula: data.matricula ?? "",
		nome: data.nome || "",
		email: data.email || "",
	};
}

/**
 * Valida os dados do formulário
 */
export function validateFormData(
	formData: Partial<DicenteFormData>,
	isEditing: boolean,
): ValidacaoResultado {
	const errors: string[] = [];

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
export function prepareDataForCreate(
	formData: DicenteFormData,
): DicenteFormData & { matricula: number } {
	return {
		...formData,
		matricula: parseInt(String(formData.matricula)),
	};
}

/**
 * Prepara os dados para envio à API na edição
 */
export function prepareDataForUpdate(
	formData: DicenteFormData,
): { nome: string; email: string } {
	return {
		nome: formData.nome,
		email: formData.email,
	};
}

/**
 * Formata a contagem de dicentes para exibição
 */
export function formatDicentesCount(count: number): string {
	return `${count} dicente${count !== 1 ? "s" : ""} encontrado${
		count !== 1 ? "s" : ""
	}`;
}

/**
 * Encontra um curso pelo ID na lista de cursos
 */
export function findCursoById(
	cursos: Curso[],
	cursoId: number,
): Curso | null {
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
