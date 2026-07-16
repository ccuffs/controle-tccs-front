interface ValidacaoResultado {
	isValid: boolean;
	message?: string;
}

interface LoginFormData {
	userId: string;
	senha: string;
}

interface LoginResultado {
	success: boolean;
	error?: string | null;
}

interface LoginProcessado {
	success: boolean;
	error: string | null;
}

/**
 * Valida os dados do formulário de login
 */
export function validateLoginForm(
	userId: string,
	senha: string,
): ValidacaoResultado {
	const errors: string[] = [];

	if (!userId) errors.push("ID do usuário é obrigatório");
	if (!senha) errors.push("Senha é obrigatória");

	if (errors.length > 0) {
		return {
			isValid: false,
			message: errors.join(" e "),
		};
	}

	return { isValid: true };
}

/**
 * Prepara os dados para reset do formulário de login
 */
export function getResetLoginFormData(): LoginFormData {
	return {
		userId: "",
		senha: "",
	};
}

/**
 * Processa o resultado do login
 */
export function processLoginResult(
	resultado: LoginResultado,
): LoginProcessado {
	if (resultado.success) {
		return {
			success: true,
			error: null,
		};
	}

	return {
		success: false,
		error: resultado.error || "Erro ao fazer login",
	};
}

/**
 * Trata erros de login
 */
export function handleLoginError(error: unknown): string {
	return error instanceof Error
		? error.message || "Erro ao fazer login"
		: "Erro ao fazer login";
}

// Exportação padrão
const loginController = {
	validateLoginForm,
	getResetLoginFormData,
	processLoginResult,
	handleLoginError,
};

export default loginController;
