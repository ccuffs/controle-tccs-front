/**
 * Valida se o email foi alterado
 */
export function validarEmailAlterado(emailOriginal, emailNovo) {
	return emailOriginal !== emailNovo;
}

/**
 * Valida formato de email (opcional - pode expandir)
 */
export function validarFormatoEmail(email) {
	if (!email) return true; // Email vazio é válido

	const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regexEmail.test(email);
}

/**
 * Processa dados do dicente para exibição
 */
export function processarDadosDicente(dicente) {
	if (!dicente) return null;

	return {
		nome: dicente.nome || "",
		matricula: dicente.matricula || "",
		email: dicente.email || "",
	};
}

/**
 * Prepara dados para atualização
 */
export function prepararDadosAtualizacao(matricula, email) {
	return {
		matricula: matricula,
		email: email || "",
	};
}

/**
 * Obtém mensagem de erro padrão
 */
export function obterMensagemErro(error) {
	return (
		error?.message ||
		"Erro ao carregar dados. Você pode não estar vinculado a um perfil de discente."
	);
}

/**
 * Obtém mensagem de sucesso para atualização
 */
export function obterMensagemSucesso() {
	return "Email atualizado com sucesso!";
}

/**
 * Verifica se dicente está carregado
 */
export function isDicenteCarregado(dicente) {
	return !!dicente;
}

// Exportação padrão
const perfilDicenteController = {
	validarEmailAlterado,
	validarFormatoEmail,
	processarDadosDicente,
	prepararDadosAtualizacao,
	obterMensagemErro,
	obterMensagemSucesso,
	isDicenteCarregado,
};

export default perfilDicenteController;

