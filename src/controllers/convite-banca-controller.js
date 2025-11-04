/**
 * Filtra convites pendentes (sem data_feedback)
 */
export function obterConvitesPendentes(convites) {
	return convites.filter((convite) => !convite.data_feedback);
}

/**
 * Filtra convites aceitos
 */
export function obterConvitesAceitos(convites) {
	return convites.filter((convite) => convite.aceito === true);
}

/**
 * Filtra convites recusados
 */
export function obterConvitesRecusados(convites) {
	return convites.filter(
		(convite) => convite.data_feedback && !convite.aceito,
	);
}

/**
 * Verifica se o botão de enviar convites deve estar desabilitado
 */
export function deveBotaoEstarDesabilitado(convitesPendentes, convitesAceitos) {
	return (
		convitesPendentes.length === 2 || // 2 pendentes
		convitesAceitos.length === 2 || // 2 aceitos
		(convitesAceitos.length === 1 && convitesPendentes.length === 1) // 1 aceito + 1 pendente
	);
}

/**
 * Calcula quantos convites ainda podem ser enviados
 */
export function calcularConvitesDisponiveis(convitesAceitos) {
	return 2 - convitesAceitos.length;
}

/**
 * Calcula limite de seleção baseado em convites simultâneos
 */
export function calcularLimiteSelecao(convitesAceitos, convitesPendentes) {
	return 2 - convitesAceitos.length - convitesPendentes.length;
}

/**
 * Valida se pode enviar mais convites
 */
export function validarEnvioConvites(
	orientadoresSelecionados,
	convitesPendentes,
	convitesAceitos,
) {
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
	codigoDocente,
	convites,
	tipoConvite,
) {
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
	codigoDocente,
	convites,
	tipoConvite,
) {
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
export function verificarEhOrientador(codigoDocente, conviteOrientacao) {
	return (
		conviteOrientacao &&
		conviteOrientacao.codigo_docente === codigoDocente &&
		conviteOrientacao.aceito === true
	);
}

/**
 * Processa pré-seleção inteligente de docentes
 */
export function processarPreSelecao(
	tipoConvite,
	docentesPreSelecionados,
	convitesExistentes,
) {
	let selecionadosIniciais = [];

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
	idTcc,
	codigoDocente,
	mensagem,
	tipoConvite,
) {
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
	idTcc,
	orientadoresSelecionados,
	mensagem,
	tipoConvite,
) {
	return orientadoresSelecionados.map((codigoDocente) =>
		prepararDadosConvite(idTcc, codigoDocente, mensagem, tipoConvite),
	);
}

/**
 * Obtém o texto do botão baseado no estado
 */
export function obterTextoBotao(
	loading,
	deveBotaoDesabilitado,
	convitesAceitos,
	convitesPendentes,
	convitesDisponiveis,
) {
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
	convitesDisponiveis,
	convitesAceitos,
	convitesPendentes,
) {
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
	convitesAceitos,
	convitesPendentes,
) {
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

