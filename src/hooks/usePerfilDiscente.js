import { useState, useEffect } from "react";
import perfilDicenteService from "../services/perfil-dicente-service";
import perfilDicenteController from "../controllers/perfil-dicente-controller";

/**
 * Hook customizado para gerenciar perfil do dicente
 */
export function usePerfilDiscente() {
	// Estados de dados
	const [dicente, setDicente] = useState(null);
	const [email, setEmail] = useState("");

	// Estados de UI
	const [loading, setLoading] = useState(true);
	const [edit, setEdit] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");

	// Carregar dados ao montar componente
	useEffect(() => {
		getData();
	}, []);

	// Carregar dados do perfil
	async function getData() {
		try {
			setLoading(true);
			const response = await perfilDicenteService.getMeuPerfil();
			const dadosProcessados =
				perfilDicenteController.processarDadosDicente(response);

			setDicente(response);
			setEmail(dadosProcessados?.email || "");
		} catch (error) {
			console.log("Não foi possível retornar os dados do dicente: ", error);
			setMessageText(
				perfilDicenteController.obterMensagemErro(error),
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	}

	// Handler para ativar modo de edição
	function handleEdit() {
		setEdit(true);
	}

	// Handler para cancelar edição
	function handleCancelClick() {
		setEdit(false);
		setEmail(dicente?.email || "");
	}

	// Handler para atualizar email
	async function handleUpdateEmail() {
		try {
			await perfilDicenteService.atualizarEmailDicente(
				dicente.matricula,
				email,
			);

			setMessageText(perfilDicenteController.obterMensagemSucesso());
			setMessageSeverity("success");
			setEdit(false);
			await getData();
		} catch (error) {
			console.log("Não foi possível atualizar o email");
			setMessageText(error.message);
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	// Handler para fechar mensagem
	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	}

	// Verificar se dicente está carregado
	const isDicenteCarregado =
		perfilDicenteController.isDicenteCarregado(dicente);

	return {
		// Estados de dados
		dicente,
		email,
		setEmail,

		// Estados de UI
		loading,
		edit,
		openMessage,
		messageText,
		messageSeverity,

		// Estados computados
		isDicenteCarregado,

		// Handlers
		handleEdit,
		handleCancelClick,
		handleUpdateEmail,
		handleCloseMessage,
	};
}

