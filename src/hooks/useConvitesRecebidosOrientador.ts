import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import convitesService from "../services/convites-service";
import convitesRecebidosController from "../controllers/convites-recebidos-controller";
import type { Convite } from "../types/convite";

interface ConviteSelecionado extends Convite {
	acao: boolean;
}

export function useConvitesRecebidosOrientador() {
	const { usuario } = useAuth();

	const [convites, setConvites] = useState<Convite[]>([]);
	const [cursos, setCursos] = useState<unknown[]>([]);
	const [cursoSelecionado, setCursoSelecionado] = useState<string | number>("");
	const [ano, setAno] = useState<string | number>(
		convitesRecebidosController.getAnoSemestreAtual().ano,
	);
	const [semestre, setSemestre] = useState<string | number>(
		convitesRecebidosController.getAnoSemestreAtual().semestre,
	);
	const [fase, setFase] = useState<string | number>("");

	const [openMessage, setOpenMessage] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState<"success" | "error">(
		"success",
	);
	const [conviteSelecionado, setConviteSelecionado] =
		useState<ConviteSelecionado | null>(null);
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
			const codigoDocente = usuario?.id;
			if (!codigoDocente) return;
			const cursosOrientador =
				await convitesService.getCursosOrientador(codigoDocente);
			const cursosExtraidos =
				convitesRecebidosController.extrairCursos(cursosOrientador);
			setCursos(cursosExtraidos);
		} catch (error) {
			console.log("Erro ao buscar cursos do orientador:", error);
			setCursos([]);
			setMessageText(
				error instanceof Error
					? error.message
					: "Erro ao carregar cursos do orientador.",
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

			const [convitesRaw, periodosLetivos] = await Promise.all([
				convitesService.getConvitesDocente(usuario.id),
				convitesService.getAnoSemestres(),
			]);

			const convitesFiltrados =
				convitesRecebidosController.aplicarFiltros(
					convitesRaw,
					{
						cursoSelecionado,
						ano,
						semestre,
						fase,
					},
					periodosLetivos,
				);

			setConvites(convitesFiltrados);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de convites: ",
				error,
			);
			setConvites([]);
			setMessageText(
				error instanceof Error ? error.message : "Erro ao carregar convites.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	}

	function handleResponderConvite(convite: Convite, aceito: boolean) {
		setConviteSelecionado({ ...convite, acao: aceito });
		setOpenDialog(true);
	}

	function handleCloseMessage(_event: unknown, reason?: string) {
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
		if (!conviteSelecionado) return;

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
				error instanceof Error ? error.message : "Falha ao responder ao convite!",
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
		return convitesRecebidosController.processarConvitesParaGrid(convites);
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
