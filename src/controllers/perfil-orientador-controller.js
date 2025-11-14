/**
 * Extrai dados do docente para edição
 */
export function extrairDadosDocente(docente) {
	return {
		siape: docente?.siape || "",
		sala: docente?.sala || "",
	};
}

/**
 * Prepara dados para atualização do docente
 */
export function prepararDadosAtualizacao(codigo, siape, sala) {
	return {
		codigo,
		siape: siape || null,
		sala: sala || null,
	};
}

/**
 * Valida se há mudanças nos dados
 */
export function temMudancas(
	siapeAtual,
	siapeOriginal,
	salaAtual,
	salaOriginal,
) {
	return siapeAtual !== siapeOriginal || salaAtual !== salaOriginal;
}

/**
 * Formata mensagem de erro de carregamento
 */
export function formatarMensagemErroCarregamento() {
	return "Erro ao carregar dados. Você pode não estar vinculado a um perfil de docente.";
}

/**
 * Formata mensagem de sucesso de atualização
 */
export function formatarMensagemSucesso() {
	return "SIAPE e Sala atualizados com sucesso!";
}

/**
 * Formata mensagem de erro de atualização
 */
export function formatarMensagemErroAtualizacao() {
	return "Falha ao atualizar SIAPE e Sala!";
}

// Exportação padrão
const perfilOrientadorController = {
	extrairDadosDocente,
	prepararDadosAtualizacao,
	temMudancas,
	formatarMensagemErroCarregamento,
	formatarMensagemSucesso,
	formatarMensagemErroAtualizacao,
};

export default perfilOrientadorController;
