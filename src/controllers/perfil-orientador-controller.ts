import type { Docente } from "../types/docente";

/**
 * Extrai dados do docente para edição
 */
export function extrairDadosDocente(
	docente: Partial<Docente> | null | undefined,
): { siape: number | string; sala: number | string } {
	return {
		siape: docente?.siape || "",
		sala: docente?.sala || "",
	};
}

/**
 * Prepara dados para atualização do docente
 */
export function prepararDadosAtualizacao(
	codigo: string,
	siape: string | number | null,
	sala: string | number | null,
): { codigo: string; siape: string | number | null; sala: string | number | null } {
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
	siapeAtual: string | number,
	siapeOriginal: string | number,
	salaAtual: string | number,
	salaOriginal: string | number,
): boolean {
	return siapeAtual !== siapeOriginal || salaAtual !== salaOriginal;
}

/**
 * Formata mensagem de erro de carregamento
 */
export function formatarMensagemErroCarregamento(): string {
	return "Erro ao carregar dados. Você pode não estar vinculado a um perfil de docente.";
}

/**
 * Formata mensagem de sucesso de atualização
 */
export function formatarMensagemSucesso(): string {
	return "SIAPE e Sala atualizados com sucesso!";
}

/**
 * Formata mensagem de erro de atualização
 */
export function formatarMensagemErroAtualizacao(): string {
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
