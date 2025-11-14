/**
 * Valida os dados do formulário de login
 */
export function validateLoginForm(userId, senha) {
	const errors = [];

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
export function getResetLoginFormData() {
	return {
		userId: "",
		senha: "",
	};
}

/**
 * Processa o resultado do login
 */
export function processLoginResult(resultado) {
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
export function handleLoginError(error) {
	return error.message || "Erro ao fazer login";
}

// Exportação padrão
const loginController = {
	validateLoginForm,
	getResetLoginFormData,
	processLoginResult,
	handleLoginError,
};

export default loginController;
