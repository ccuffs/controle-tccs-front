import { useState, useEffect } from "react";
import conviteBancaService from "../services/convite-banca-service";
import conviteBancaController from "../controllers/convite-banca-controller";

/**
 * Hook customizado para gerenciar convites de banca
 */
export function useConviteBanca({
	open,
	idCurso,
	idTcc,
	convitesExistentes = [],
	conviteOrientacao = null,
	tipoConvite = "banca_projeto",
	docentesPreSelecionados = [],
	onConviteEnviado,
	onClose,
}) {
	// Estados de dados
	const [docentesBanca, setDocentesBanca] = useState([]);
	const [orientadoresSelecionados, setOrientadoresSelecionados] = useState(
		[],
	);
	const [mensagem, setMensagem] = useState("");

	// Estados de UI
	const [loading, setLoading] = useState(false);
	const [loadingDocentesBanca, setLoadingDocentesBanca] = useState(false);
	const [error, setError] = useState("");

	// Carregar docentes de banca quando o modal abrir
	useEffect(() => {
		if (open && idCurso) {
			carregarDocentesBanca();
		}
	}, [open, idCurso]);

	// Processar pré-seleção inteligente
	useEffect(() => {
		if (open) {
			const selecionadosIniciais =
				conviteBancaController.processarPreSelecao(
					tipoConvite,
					docentesPreSelecionados,
					convitesExistentes,
				);

			setOrientadoresSelecionados(selecionadosIniciais);
			setMensagem("");
			setError("");
		}
	}, [open, docentesPreSelecionados, convitesExistentes, tipoConvite]);

	// Carregar docentes de banca via API
	async function carregarDocentesBanca() {
		try {
			setLoadingDocentesBanca(true);
			const docentes =
				await conviteBancaService.getDocentesBancaPorCurso(idCurso);
			setDocentesBanca(docentes);
		} catch (error) {
			console.error(
				"Erro ao carregar docentes de banca do curso:",
				error,
			);
			setError(error.message);
		} finally {
			setLoadingDocentesBanca(false);
		}
	}

	// Processar convites existentes
	const convitesPendentes =
		conviteBancaController.obterConvitesPendentes(convitesExistentes);
	const convitesAceitos =
		conviteBancaController.obterConvitesAceitos(convitesExistentes);
	const convitesDisponiveis =
		conviteBancaController.calcularConvitesDisponiveis(convitesAceitos);
	const deveBotaoDesabilitado =
		conviteBancaController.deveBotaoEstarDesabilitado(
			convitesPendentes,
			convitesAceitos,
		);
	const podeEnviarMaisConvites = !deveBotaoDesabilitado;

	// Handler para enviar convites
	async function handleEnviarConvites() {
		// Validação
		const validacao = conviteBancaController.validarEnvioConvites(
			orientadoresSelecionados,
			convitesPendentes,
			convitesAceitos,
		);

		if (!validacao.valido) {
			setError(validacao.erro);
			return;
		}

		try {
			setLoading(true);
			setError("");

			// Preparar lista de convites
			const listaConvites = conviteBancaController.prepararListaConvites(
				idTcc,
				orientadoresSelecionados,
				mensagem,
				tipoConvite,
			);

			// Enviar convites via service
			await conviteBancaService.enviarConvitesBanca(listaConvites);

			// Callback de sucesso
			if (onConviteEnviado) {
				onConviteEnviado();
			}

			handleClose();
		} catch (error) {
			console.error("Erro ao enviar convites:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	}

	// Handler para fechar modal
	function handleClose() {
		setOrientadoresSelecionados([]);
		setMensagem("");
		setError("");
		onClose();
	}

	// Handler para mudança de seleção de orientadores
	function handleChangeOrientadores(event) {
		const value = event.target.value;

		// Calcular limite de seleção
		const limiteSelecao = conviteBancaController.calcularLimiteSelecao(
			convitesAceitos,
			convitesPendentes,
		);

		// Limitar seleção
		if (value.length <= limiteSelecao) {
			setOrientadoresSelecionados(
				typeof value === "string" ? value.split(",") : value,
			);
			setError(""); // Limpar erro ao selecionar corretamente
		} else {
			setError(
				`Você só pode selecionar até ${limiteSelecao} orientador(es). Atualmente tem ${convitesAceitos.length} aceito(s) + ${convitesPendentes.length} pendente(s).`,
			);
		}
	}

	// Função auxiliar para obter nome do docente
	function getDocenteBancaNome(codigo) {
		const docente = docentesBanca.find((o) => o.codigo === codigo);
		return docente ? docente.nome : codigo;
	}

	// Verificar se docente deve estar desabilitado
	function isDocenteDisabled(docente) {
		const ehOrientador = conviteBancaController.verificarEhOrientador(
			docente.codigo,
			conviteOrientacao,
		);

		const jaConvidado = conviteBancaController.verificarDocenteJaConvidado(
			docente.codigo,
			convitesExistentes,
			tipoConvite,
		);

		return jaConvidado || ehOrientador;
	}

	// Obter texto secundário do docente
	function getDocenteSecondaryText(docente) {
		const ehOrientador = conviteBancaController.verificarEhOrientador(
			docente.codigo,
			conviteOrientacao,
		);

		const foiRecusado = conviteBancaController.verificarDocenteRecusou(
			docente.codigo,
			convitesExistentes,
			tipoConvite,
		);

		const jaConvidado = conviteBancaController.verificarDocenteJaConvidado(
			docente.codigo,
			convitesExistentes,
			tipoConvite,
		);

		if (ehOrientador) {
			return "Orientador do TCC";
		} else if (foiRecusado) {
			return "Recusou convite anterior";
		} else if (jaConvidado) {
			return "Já convidado";
		}

		return "";
	}

	// Obter texto do botão
	const textoBotao = conviteBancaController.obterTextoBotao(
		loading,
		deveBotaoDesabilitado,
		convitesAceitos,
		convitesPendentes,
		convitesDisponiveis,
	);

	// Obter mensagem de status
	const mensagemStatus = conviteBancaController.obterMensagemStatus(
		convitesDisponiveis,
		convitesAceitos,
		convitesPendentes,
	);

	// Obter mensagem quando não pode enviar
	const mensagemNaoPodeEnviar =
		conviteBancaController.obterMensagemNaoPodeEnviar(
			convitesAceitos,
			convitesPendentes,
		);

	return {
		// Estados de dados
		docentesBanca,
		orientadoresSelecionados,
		mensagem,
		setMensagem,
		convitesPendentes,
		convitesAceitos,
		convitesDisponiveis,

		// Estados de UI
		loading,
		loadingDocentesBanca,
		error,
		deveBotaoDesabilitado,
		podeEnviarMaisConvites,

		// Handlers
		handleEnviarConvites,
		handleClose,
		handleChangeOrientadores,

		// Funções auxiliares
		getDocenteBancaNome,
		isDocenteDisabled,
		getDocenteSecondaryText,

		// Textos processados
		textoBotao,
		mensagemStatus,
		mensagemNaoPodeEnviar,
	};
}

