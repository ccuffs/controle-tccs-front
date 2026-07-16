import type { Convite } from "../types/convite";

/**
 * Valida se o orientador foi selecionado
 */
export function validarOrientadorSelecionado(
	orientadorSelecionado: string | null | undefined,
): { valido: boolean; erro: string | null } {
	if (!orientadorSelecionado) {
		return {
			valido: false,
			erro: "Por favor, selecione um orientador",
		};
	}

	return { valido: true, erro: null };
}

/**
 * Prepara dados do convite de orientação para envio
 */
export function prepararDadosConviteOrientacao(
	idTcc: number,
	orientadorSelecionado: string,
	mensagem: string | undefined,
	fase: number,
): {
	id_tcc: number;
	codigo_docente: string;
	mensagem_envio: string;
	fase: number;
} {
	return {
		id_tcc: idTcc,
		codigo_docente: orientadorSelecionado,
		mensagem_envio: mensagem || "Convite para orientação de TCC",
		fase: fase,
	};
}

/**
 * Formata data para exibição
 */
export function formatarData(data: string | null | undefined): string | null {
	if (!data) return null;
	return new Date(data).toLocaleDateString("pt-BR");
}

/**
 * Obtém o status do convite
 */
export function obterStatusConvite(
	convite: Convite | null | undefined,
): string | null {
	if (!convite) return null;

	return convite.aceito ? "Aceito" : "Pendente";
}

/**
 * Verifica se é modo visualização (convite existente)
 */
export function isModoVisualizacao(
	conviteExistente: Convite | null | undefined,
): boolean {
	return !!conviteExistente;
}

/**
 * Obtém o título do modal baseado no modo
 */
export function obterTituloModal(
	conviteExistente: Convite | null | undefined,
): string {
	return conviteExistente
		? "Convite de Orientador"
		: "Enviar Convite para Orientador";
}

interface ConviteExistenteProcessado {
	codigoDocente: string;
	mensagem: string;
	status: string | null;
	dataEnvio: string | null;
}

/**
 * Processa convite existente para exibição
 */
export function processarConviteExistente(
	convite: Convite | null | undefined,
): ConviteExistenteProcessado | null {
	if (!convite) return null;

	return {
		codigoDocente: convite.codigo_docente,
		mensagem: convite.mensagem_envio || "",
		status: obterStatusConvite(convite),
		dataEnvio: formatarData(convite.data_envio),
	};
}

// Exportação padrão
const conviteOrientadorController = {
	validarOrientadorSelecionado,
	prepararDadosConviteOrientacao,
	formatarData,
	obterStatusConvite,
	isModoVisualizacao,
	obterTituloModal,
	processarConviteExistente,
};

export default conviteOrientadorController;
