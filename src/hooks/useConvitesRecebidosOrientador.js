import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import convitesService from "../services/convites-service";
import convitesRecebidosController from "../controllers/convites-recebidos-controller";

export function useConvitesRecebidosOrientador() {
	const { usuario } = useAuth();

	const [convites, setConvites] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(
		convitesRecebidosController.getAnoSemestreAtual().ano,
	);
	const [semestre, setSemestre] = useState(
		convitesRecebidosController.getAnoSemestreAtual().semestre,
	);
	const [fase, setFase] = useState("");

	const [openMessage, setOpenMessage] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");
	const [conviteSelecionado, setConviteSelecionado] = useState(null);
	const [loading, setLoading] = useState(false);

	// Carregar cursos do orientador ao montar o componente
	useEffect(() => {
		if (usuario?.id) {
			getCursosOrientador();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usuario]);

	// Carregar convites quando filtros mudarem
	useEffect(() => {
		if (usuario?.id) {
			getData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usuario, cursoSelecionado, ano, semestre, fase]);

	async function getCursosOrientador() {
		try {
			const codigoDocente = usuario.codigo || usuario.id;
			const cursosOrientador = await convitesService.getCursosOrientador(
				codigoDocente,
			);
			const cursosExtraidos =
				convitesRecebidosController.extrairCursos(cursosOrientador);
			setCursos(cursosExtraidos);
		} catch (error) {
			console.log("Erro ao buscar cursos do orientador:", error);
			setCursos([]);
			setMessageText(
				error.message || "Erro ao carregar cursos do orientador.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	async function getData() {
		try {
			setLoading(true);

			if (!usuario?.id) {
				setConvites([]);
				return;
			}

			// Buscar convites do orientador logado
			const convitesRaw = await convitesService.getConvitesDocente(
				usuario.id,
			);

			// Aplicar filtros
			const convitesFiltrados =
				convitesRecebidosController.aplicarFiltros(convitesRaw, {
					cursoSelecionado,
					ano,
					semestre,
					fase,
				});

			setConvites(convitesFiltrados);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de convites: ",
				error,
			);
			setConvites([]);
			setMessageText(error.message || "Erro ao carregar convites.");
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	}

	function handleResponderConvite(convite, aceito) {
		setConviteSelecionado({ ...convite, acao: aceito });
		setOpenDialog(true);
	}

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	}

	function handleClose() {
		setOpenDialog(false);
		setConviteSelecionado(null);
	}

	async function handleConfirmarResposta() {
		try {
			const { id_tcc, codigo_docente, fase, acao } = conviteSelecionado;

			await convitesService.responderConvite(
				id_tcc,
				codigo_docente,
				fase,
				acao,
			);

			setMessageText(
				`Convite ${acao ? "aceito" : "rejeitado"} com sucesso!`,
			);
			setMessageSeverity("success");
		} catch (error) {
			console.log("Não foi possível responder ao convite: ", error);
			setMessageText(
				error.message || "Falha ao responder ao convite!",
			);
			setMessageSeverity("error");
		} finally {
			setOpenDialog(false);
			setConviteSelecionado(null);
			setOpenMessage(true);
			await getData();
		}
	}

	function handleCancelarResposta() {
		setOpenDialog(false);
		setConviteSelecionado(null);
	}

	// Processar convites para o grid
	const convitesParaGrid = useMemo(() => {
		return convitesRecebidosController.processarConvitesParaGrid(
			convites,
		);
	}, [convites]);

	return {
		// Estados de filtros
		cursos,
		cursoSelecionado,
		setCursoSelecionado,
		ano,
		setAno,
		semestre,
		setSemestre,
		fase,
		setFase,
		// Estados de dados
		convitesParaGrid,
		// Estados de UI
		loading,
		openMessage,
		openDialog,
		messageText,
		messageSeverity,
		conviteSelecionado,
		// Handlers
		handleResponderConvite,
		handleCloseMessage,
		handleClose,
		handleConfirmarResposta,
		handleCancelarResposta,
	};
}

