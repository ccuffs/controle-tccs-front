import { useState, useEffect } from "react";
import perfilOrientadorService from "../services/perfil-orientador-service";
import perfilOrientadorController from "../controllers/perfil-orientador-controller";

export function usePerfilOrientador() {
	const [docente, setDocente] = useState(null);
	const [siape, setSiape] = useState("");
	const [sala, setSala] = useState("");
	const [loading, setLoading] = useState(true);
	const [edit, setEdit] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");

	// Carregar dados ao montar o componente
	useEffect(() => {
		getData();
	}, []);

	async function getData() {
		try {
			setLoading(true);
			const docenteData = await perfilOrientadorService.getMeuPerfil();
			setDocente(docenteData);

			const dadosExtraidos =
				perfilOrientadorController.extrairDadosDocente(docenteData);
			setSiape(dadosExtraidos.siape);
			setSala(dadosExtraidos.sala);
		} catch (error) {
			console.log(
				"Não foi possível retornar os dados do docente: ",
				error,
			);
			setMessageText(
				error.message ||
					perfilOrientadorController.formatarMensagemErroCarregamento(),
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	}

	function handleEdit() {
		setEdit(true);
	}

	function handleCancelClick() {
		setEdit(false);
		const dadosOriginais =
			perfilOrientadorController.extrairDadosDocente(docente);
		setSiape(dadosOriginais.siape);
		setSala(dadosOriginais.sala);
	}

	async function handleUpdateSiape() {
		try {
			const dadosAtualizacao =
				perfilOrientadorController.prepararDadosAtualizacao(
					docente.codigo,
					siape,
					sala,
				);

			await perfilOrientadorService.atualizarDocente(dadosAtualizacao);

			setMessageText(
				perfilOrientadorController.formatarMensagemSucesso(),
			);
			setMessageSeverity("success");
			setEdit(false);
			await getData();
		} catch (error) {
			console.log("Não foi possível atualizar o SIAPE e Sala", error);
			setMessageText(
				error.message ||
					perfilOrientadorController.formatarMensagemErroAtualizacao(),
			);
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") return;
		setOpenMessage(false);
	}

	return {
		// Estados de dados
		docente,
		siape,
		setSiape,
		sala,
		setSala,
		// Estados de UI
		loading,
		edit,
		openMessage,
		messageText,
		messageSeverity,
		// Handlers
		handleEdit,
		handleCancelClick,
		handleUpdateSiape,
		handleCloseMessage,
	};
}

