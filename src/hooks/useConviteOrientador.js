import { useState, useEffect } from "react";
import conviteOrientadorService from "../services/convite-orientador-service";
import conviteOrientadorController from "../controllers/convite-orientador-controller";

/**
 * Hook customizado para gerenciar convites de orientação
 */
export function useConviteOrientador({
	open,
	idCurso,
	idTcc,
	conviteExistente = null,
	fase = 1,
	onConviteEnviado,
	onClose,
}) {
	// Estados de dados
	const [orientadores, setOrientadores] = useState([]);
	const [orientadorSelecionado, setOrientadorSelecionado] = useState("");
	const [mensagem, setMensagem] = useState("");

	// Estados de UI
	const [loading, setLoading] = useState(false);
	const [loadingOrientadores, setLoadingOrientadores] = useState(false);
	const [error, setError] = useState("");

	// Processar convite existente
	const conviteProcessado =
		conviteOrientadorController.processarConviteExistente(conviteExistente);
	const modoVisualizacao =
		conviteOrientadorController.isModoVisualizacao(conviteExistente);
	const tituloModal =
		conviteOrientadorController.obterTituloModal(conviteExistente);

	// Carregar orientadores quando o modal abrir
	useEffect(() => {
		if (open && idCurso) {
			carregarOrientadores();
			if (conviteExistente) {
				setOrientadorSelecionado(conviteExistente.codigo_docente);
				setMensagem(conviteExistente.mensagem_envio || "");
			}
		}
	}, [open, conviteExistente, idCurso]);

	// Carregar orientadores via API
	async function carregarOrientadores() {
		try {
			setLoadingOrientadores(true);
			const docentes =
				await conviteOrientadorService.getOrientadoresPorCurso(idCurso);
			setOrientadores(docentes);
		} catch (error) {
			console.error("Erro ao carregar orientadores do curso:", error);
			setError(error.message);
		} finally {
			setLoadingOrientadores(false);
		}
	}

	// Handler para enviar convite
	async function handleEnviarConvite() {
		// Validação
		const validacao =
			conviteOrientadorController.validarOrientadorSelecionado(
				orientadorSelecionado,
			);

		if (!validacao.valido) {
			setError(validacao.erro);
			return;
		}

		try {
			setLoading(true);
			setError("");

			// Preparar dados do convite
			const dadosConvite =
				conviteOrientadorController.prepararDadosConviteOrientacao(
					idTcc,
					orientadorSelecionado,
					mensagem,
					fase,
				);

			// Enviar convite via service
			await conviteOrientadorService.enviarConviteOrientacao(
				dadosConvite,
			);

			// Callback de sucesso
			if (onConviteEnviado) {
				onConviteEnviado();
			}

			handleClose();
		} catch (error) {
			console.error("Erro ao enviar convite:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	}

	// Handler para fechar modal
	function handleClose() {
		setOrientadorSelecionado("");
		setMensagem("");
		setError("");
		onClose();
	}

	return {
		// Estados de dados
		orientadores,
		orientadorSelecionado,
		setOrientadorSelecionado,
		mensagem,
		setMensagem,

		// Estados de UI
		loading,
		loadingOrientadores,
		error,

		// Dados processados
		conviteProcessado,
		modoVisualizacao,
		tituloModal,

		// Handlers
		handleEnviarConvite,
		handleClose,
	};
}
