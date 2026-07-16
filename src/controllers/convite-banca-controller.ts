import type { Convite } from "../types/convite";

interface ValidacaoResultado {
	valido: boolean;
	erro: string | null;
}

/**
 * Filtra convites pendentes (sem data_feedback)
 */
export function obterConvitesPendentes(convites: Convite[]): Convite[] {
	return convites.filter((convite) => !convite.data_feedback);
}

/**
 * Filtra convites aceitos
 */
export function obterConvitesAceitos(convites: Convite[]): Convite[] {
	return convites.filter((convite) => convite.aceito === true);
}

/**
 * Filtra convites recusados
 */
export function obterConvitesRecusados(convites: Convite[]): Convite[] {
	return convites.filter(
		(convite) => convite.data_feedback && !convite.aceito,
	);
}

/**
 * Verifica se o botão de enviar convites deve estar desabilitado
 */
export function deveBotaoEstarDesabilitado(
	convitesPendentes: Convite[],
	convitesAceitos: Convite[],
): boolean {
	return (
		convitesPendentes.length === 2 || // 2 pendentes
		convitesAceitos.length === 2 || // 2 aceitos
		(convitesAceitos.length === 1 && convitesPendentes.length === 1) // 1 aceito + 1 pendente
	);
}

/**
 * Calcula quantos convites ainda podem ser enviados
 */
export function calcularConvitesDisponiveis(convitesAceitos: Convite[]): number {
	return 2 - convitesAceitos.length;
}

/**
 * Calcula limite de seleção baseado em convites simultâneos
 */
export function calcularLimiteSelecao(
	convitesAceitos: Convite[],
	convitesPendentes: Convite[],
): number {
	return 2 - convitesAceitos.length - convitesPendentes.length;
}

/**
 * Valida se pode enviar mais convites
 */
export function validarEnvioConvites(
	orientadoresSelecionados: string[],
	convitesPendentes: Convite[],
	convitesAceitos: Convite[],
): ValidacaoResultado {
	if (orientadoresSelecionados.length === 0) {
		return {
			valido: false,
			erro: "Por favor, selecione pelo menos um orientador",
		};
	}

	const totalConvitesAposEnvio =
		convitesPendentes.length +
		convitesAceitos.length +
		orientadoresSelecionados.length;

	if (totalConvitesAposEnvio > 2) {
		return {
			valido: false,
			erro: `Você só pode ter no máximo 2 convites simultâneos. Atualmente: ${
				convitesAceitos.length
			} aceito(s) + ${convitesPendentes.length} pendente(s). Máximo para enviar agora: ${
				2 - convitesPendentes.length - convitesAceitos.length
			}.`,
		};
	}

	return { valido: true, erro: null };
}

/**
 * Verifica se um docente já foi convidado
 */
export function verificarDocenteJaConvidado(
	codigoDocente: string,
	convites: Convite[],
	tipoConvite: string,
): boolean {
	return convites.some(
		(convite) =>
			convite.codigo_docente === codigoDocente &&
			(!convite.data_feedback ||
				convite.aceito ||
				// Para etapa 7 (banca final), também excluir docentes que recusaram
				(tipoConvite === "banca_trabalho" &&
					convite.data_feedback &&
					!convite.aceito)),
	);
}

/**
 * Verifica se um docente recusou o convite
 */
export function verificarDocenteRecusou(
	codigoDocente: string,
	convites: Convite[],
	tipoConvite: string,
): boolean {
	return convites.some(
		(convite) =>
			convite.codigo_docente === codigoDocente &&
			convite.data_feedback &&
			!convite.aceito &&
			tipoConvite === "banca_trabalho",
	);
}

/**
 * Verifica se o docente é o orientador atual
 */
export function verificarEhOrientador(
	codigoDocente: string,
	conviteOrientacao: Convite | null | undefined,
): boolean {
	return Boolean(
		conviteOrientacao &&
			conviteOrientacao.codigo_docente === codigoDocente &&
			conviteOrientacao.aceito === true,
	);
}

/**
 * Processa pré-seleção inteligente de docentes
 */
export function processarPreSelecao(
	tipoConvite: string,
	docentesPreSelecionados: string[],
	convitesExistentes: Convite[] | null | undefined,
): string[] {
	let selecionadosIniciais: string[] = [];

	if (
		tipoConvite === "banca_trabalho" &&
		docentesPreSelecionados.length > 0 &&
		convitesExistentes
	) {
		// Para etapa 7 (banca final), verificar se já há convites respondidos na fase 2
		const convitesRespondidosFase2 = convitesExistentes.filter(
			(c) => c.data_feedback,
		);

		if (convitesRespondidosFase2.length === 0) {
			// Se não há convites respondidos, manter pré-seleção apenas para docentes não convidados na fase 2
			const docentesJaConvidadosFase2 = convitesExistentes.map(
				(c) => c.codigo_docente,
			);
			selecionadosIniciais = docentesPreSelecionados.filter(
				(codigo) => !docentesJaConvidadosFase2.includes(codigo),
			);
		}
		// Se há convites respondidos, não pré-selecionar ninguém (selecionadosIniciais = [])
	} else {
		// Para outras situações, usar pré-seleção normal
		selecionadosIniciais = docentesPreSelecionados || [];
	}

	return selecionadosIniciais;
}

/**
 * Prepara dados do convite para envio
 */
export function prepararDadosConvite(
	idTcc: number,
	codigoDocente: string,
	mensagem: string | undefined,
	tipoConvite: string,
): {
	id_tcc: number;
	codigo_docente: string;
	mensagem_envio: string;
	orientacao: boolean;
	fase: number;
} {
	const fase = tipoConvite === "banca_projeto" ? 1 : 2;
	const mensagemPadrao = `Convite para banca de avaliação - ${
		tipoConvite === "banca_projeto" ? "Projeto" : "Trabalho Final"
	}`;

	return {
		id_tcc: idTcc,
		codigo_docente: codigoDocente,
		mensagem_envio: mensagem || mensagemPadrao,
		orientacao: false,
		fase: fase,
	};
}

/**
 * Prepara múltiplos convites para envio
 */
export function prepararListaConvites(
	idTcc: number,
	orientadoresSelecionados: string[],
	mensagem: string | undefined,
	tipoConvite: string,
) {
	return orientadoresSelecionados.map((codigoDocente) =>
		prepararDadosConvite(idTcc, codigoDocente, mensagem, tipoConvite),
	);
}

/**
 * Obtém o texto do botão baseado no estado
 */
export function obterTextoBotao(
	loading: boolean,
	deveBotaoDesabilitado: boolean,
	convitesAceitos: Convite[],
	convitesPendentes: Convite[],
	convitesDisponiveis: number,
): string | null {
	if (loading) {
		return null; // Mostra CircularProgress
	}

	if (deveBotaoDesabilitado) {
		if (convitesAceitos.length === 2) {
			return "Banca Completa";
		} else if (convitesPendentes.length === 2) {
			return "Aguardando Respostas";
		} else {
			return "Aguardando Confirmação";
		}
	}

	return `Enviar ${convitesDisponiveis} Convite(s)`;
}

/**
 * Obtém mensagem de status dos convites
 */
export function obterMensagemStatus(
	convitesDisponiveis: number,
	convitesAceitos: Convite[],
	convitesPendentes: Convite[],
): string {
	let mensagem = `Você tem ${convitesDisponiveis} vaga(s) disponível(is) na banca.`;

	if (convitesAceitos.length === 2) {
		mensagem += " Você já tem 2 convites aceitos! 🎉";
	}

	if (convitesPendentes.length > 0) {
		mensagem += ` (${convitesPendentes.length} convite(s) aguardando resposta)`;
	}

	return mensagem;
}

/**
 * Obtém mensagem informativa quando não pode enviar convites
 */
export function obterMensagemNaoPodeEnviar(
	convitesAceitos: Convite[],
	convitesPendentes: Convite[],
): string {
	if (convitesAceitos.length === 2) {
		return "Sua banca está completa com 2 membros confirmados!";
	} else if (convitesPendentes.length === 2) {
		return "Você tem 2 convites pendentes. Aguarde as respostas antes de enviar novos convites.";
	} else {
		return "Você tem 1 convite aceito e 1 pendente. Aguarde a resposta do convite pendente.";
	}
}

// Exportação padrão
const conviteBancaController = {
	obterConvitesPendentes,
	obterConvitesAceitos,
	obterConvitesRecusados,
	deveBotaoEstarDesabilitado,
	calcularConvitesDisponiveis,
	calcularLimiteSelecao,
	validarEnvioConvites,
	verificarDocenteJaConvidado,
	verificarDocenteRecusou,
	verificarEhOrientador,
	processarPreSelecao,
	prepararDadosConvite,
	prepararListaConvites,
	obterTextoBotao,
	obterMensagemStatus,
	obterMensagemNaoPodeEnviar,
};

export default conviteBancaController;
