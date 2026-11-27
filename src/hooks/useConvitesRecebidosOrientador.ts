import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import convitesService from "../services/convites-service";
import convitesRecebidosController from "../controllers/convites-recebidos-controller";
import type { Convite } from "../types/convite";
import type { TrabalhoConclusao } from "../types/trabalho-conclusao";

/** Extrai cursos únicos a partir dos convites (para membros de banca que não
 *  possuem orientações, e portanto não têm cursos vindos do endpoint de orientadores). */
function extrairCursosDoConvites(convites: Convite[]) {
	const vistos = new Set<number>();
	const cursos: TrabalhoConclusao["curso"][] = [];

	for (const convite of convites) {
		const tcc =
			convite.trabalhoConclusao ??
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(convite as any).TrabalhoConclusao ??
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(convite as any).trabalho_conclusao;

		const curso = tcc?.curso;
		if (curso?.id && !vistos.has(curso.id)) {
			vistos.add(curso.id);
			cursos.push(curso);
		}
	}

	return cursos;
}

interface ConviteSelecionado extends Convite {
	acao: boolean;
}

export function useConvitesRecebidosOrientador() {
	const { usuario } = useAuth();

	const [convites, setConvites] = useState<Convite[]>([]);
	const [cursos, setCursos] = useState<unknown[]>([]);

	/** Todos os convites brutos (sem filtragem), guardados para popular o
	 *  filtro de cursos quando o docente não possui orientações (ex.: banca). */
	const allConvitesRawRef = useRef<Convite[]>([]);
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

			// Guardar os convites brutos (sem filtros) para popular os cursos
			// no caso de docentes de banca que não possuem orientações.
			allConvitesRawRef.current = convitesRaw;

			// Se ainda não há cursos carregados (ex.: membro de banca sem
			// orientações), populá-los a partir dos próprios convites.
			setCursos((prevCursos) => {
				if (prevCursos.length === 0) {
					const cursosDoConvites = extrairCursosDoConvites(convitesRaw);
					return cursosDoConvites.length > 0 ? cursosDoConvites : prevCursos;
				}
				return prevCursos;
			});

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
