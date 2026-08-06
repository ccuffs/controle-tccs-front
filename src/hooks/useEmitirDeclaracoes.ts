import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import declaracoesService, {
	getDeclaracoesExternas,
	gerarDeclaracaoExternoHtml,
	gerarDeclaracaoTabelaHtml,
} from "../services/declaracoes-service";
import declaracoesController from "../controllers/declaracoes-controller";
import type { Curso } from "../types/curso";
import type { Declaracao } from "../types/declaracao";

export function useEmitirDeclaracoes() {
	const { usuario } = useAuth();

	const [declaracoes, setDeclaracoes] = useState<Declaracao[]>([]);
	const [declaracoesExternas, setDeclaracoesExternas] = useState<Declaracao[]>(
		[],
	);
	const [loading, setLoading] = useState(false);
	const [gerandoTabela, setGerandoTabela] = useState(false);
	const [cursos, setCursos] = useState<Curso[]>([]);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
		"success",
	);

	// Estados dos filtros
	const [cursoSelecionado, setCursoSelecionado] = useState<string | number>(
		"",
	);
	const [ano, setAno] = useState<string | number>("");
	const [semestre, setSemestre] = useState<string | number>("");
	const [fase, setFase] = useState<string | number>("");

	// Estados para options dos filtros
	const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
	const [semestresDisponiveis, setSemestresDisponiveis] = useState<number[]>(
		[],
	);

	// Carregar cursos ao montar o componente
	useEffect(() => {
		carregarCursos();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Efeito para pré-selecionar curso quando usuário tem apenas um
	useEffect(() => {
		const cursoUnico =
			declaracoesController.obterCursoUnicoUsuario(usuario);
		if (cursoUnico && !cursoSelecionado) {
			setCursoSelecionado(cursoUnico);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usuario]);

	// Carregar declarações quando filtros mudarem
	useEffect(() => {
		if (cursoSelecionado) {
			carregarDeclaracoes();
		} else {
			// Limpar dados quando não há curso selecionado
			setDeclaracoes([]);
			setAnosDisponiveis([]);
			setSemestresDisponiveis([]);
			// Resetar filtros quando não há curso selecionado
			setAno("");
			setSemestre("");
			setFase("");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cursoSelecionado, ano, semestre, fase]);

	function mostrarSnackbar(message: string, severity: "success" | "error" = "success") {
		setSnackbarMessage(message);
		setSnackbarSeverity(severity);
		setSnackbarOpen(true);
	}

	async function carregarCursos() {
		try {
			const cursosData = await declaracoesService.getCursos();
			setCursos(cursosData);

			// Se o usuário tem apenas um curso, pré-selecioná-lo
			const cursoUnico =
				declaracoesController.obterCursoUnicoUsuario(usuario);
			if (cursoUnico) {
				setCursoSelecionado(cursoUnico);
			}
		} catch (error) {
			console.error("Erro ao carregar cursos:", error);
			mostrarSnackbar(
				error instanceof Error ? error.message : "Erro ao carregar cursos",
				"error",
			);
		}
	}

	async function carregarDeclaracoes() {
		// Só carregar se pelo menos o curso estiver selecionado
		if (!declaracoesController.validarCursoSelecionado(cursoSelecionado)) {
			return;
		}

		setLoading(true);
		try {
			const params = {
				curso: cursoSelecionado,
				ano,
				semestre,
				fase,
			};

			const [data, externas] = await Promise.all([
				declaracoesService.getDeclaracoes(params),
				getDeclaracoesExternas(params).catch(() => []),
			]);

			const declaracoesOrdenadas = [...data.declaracoes]
				.filter((d) => !d.externo)
				.sort((a, b) =>
					(a.nome_dicente || "").localeCompare(b.nome_dicente || "", "pt-BR", { sensitivity: "base" })
				);
			const externasOrdenadas = [...externas].sort((a, b) =>
				(a.nome_docente || "").localeCompare(b.nome_docente || "", "pt-BR", { sensitivity: "base" })
			);

			setDeclaracoes(declaracoesOrdenadas);
			setDeclaracoesExternas(externasOrdenadas);
			setAnosDisponiveis(data.anosDisponiveis);
			setSemestresDisponiveis(data.semestresDisponiveis);
		} catch (error) {
			console.error("Erro ao carregar declarações:", error);
			setDeclaracoes([]);
			setDeclaracoesExternas([]);
			setAnosDisponiveis([]);
			setSemestresDisponiveis([]);
			mostrarSnackbar(
				error instanceof Error ? error.message : "Erro ao carregar declarações",
				"error",
			);
		} finally {
			setLoading(false);
		}
	}

	async function handleBaixarDeclaracaoExterno(declaracao: Declaracao) {
		try {
			const novaAba = window.open("", "_blank");

			if (!novaAba) {
				mostrarSnackbar(
					"Por favor, permita pop-ups para visualizar a declaração",
					"error",
				);
				return;
			}

			const htmlDeclaracao = await gerarDeclaracaoExternoHtml(
				declaracao.id_tcc,
				declaracao.codigo_docente ?? "",
			);

			const cssImpressao = declaracoesController.gerarCssImpressao();
			const htmlFinal = declaracoesController.injetarCssNoHead(htmlDeclaracao, cssImpressao);
			novaAba.document.write(htmlFinal);
			novaAba.document.close();

			mostrarSnackbar("Declaração aberta em nova aba.");
		} catch (error) {
			console.error("Erro ao gerar declaração para externo:", error);
			mostrarSnackbar(
				error instanceof Error ? error.message : "Erro ao gerar declaração",
				"error",
			);
		}
	}

	async function handleBaixarDeclaracao(declaracao: Declaracao) {
		try {
			const tipoParticipacao = declaracoesController.obterTipoParticipacao(
				declaracao.foi_orientador,
			);

			const novaAba = window.open("", "_blank");

			if (!novaAba) {
				mostrarSnackbar(
					"Por favor, permita pop-ups para visualizar a declaração",
					"error",
				);
				return;
			}

			const htmlDeclaracao = await declaracoesService.gerarDeclaracaoHtml(
				declaracao.id_tcc,
				tipoParticipacao,
			);

			const cssImpressao = declaracoesController.gerarCssImpressao();
			const htmlFinal = declaracoesController.injetarCssNoHead(htmlDeclaracao, cssImpressao);
			novaAba.document.write(htmlFinal);
			novaAba.document.close();

			mostrarSnackbar("Declaração aberta em nova aba.");
		} catch (error) {
			console.error("Erro ao gerar declaração:", error);
			mostrarSnackbar(
				error instanceof Error ? error.message : "Erro ao gerar declaração",
				"error",
			);
		}
	}

	async function handleBaixarDeclaracaoTabela(
		tipoParticipacao: "orientacao" | "banca",
	) {
		if (!declaracoesController.validarCursoSelecionado(cursoSelecionado)) {
			mostrarSnackbar("Selecione um curso para gerar a declaração", "error");
			return;
		}

		setGerandoTabela(true);
		try {
			const novaAba = window.open("", "_blank");

			if (!novaAba) {
				mostrarSnackbar(
					"Por favor, permita pop-ups para visualizar a declaração",
					"error",
				);
				return;
			}

			const htmlDeclaracao = await gerarDeclaracaoTabelaHtml(tipoParticipacao, {
				curso: cursoSelecionado,
				ano,
				semestre,
				fase,
			});

			const cssImpressao = declaracoesController.gerarCssImpressao();
			const htmlFinal = declaracoesController.injetarCssNoHead(
				htmlDeclaracao,
				cssImpressao,
			);
			novaAba.document.write(htmlFinal);
			novaAba.document.close();

			mostrarSnackbar("Declaração consolidada aberta em nova aba.");
		} catch (error) {
			console.error("Erro ao gerar declaração em tabela:", error);
			mostrarSnackbar(
				error instanceof Error
					? error.message
					: "Erro ao gerar declaração consolidada",
				"error",
			);
		} finally {
			setGerandoTabela(false);
		}
	}

	function handleCloseSnackbar() {
		setSnackbarOpen(false);
	}

	return {
		// Estados de dados
		declaracoes,
		declaracoesExternas,
		cursos,
		// Estados de filtros
		cursoSelecionado,
		setCursoSelecionado,
		ano,
		setAno,
		semestre,
		setSemestre,
		fase,
		setFase,
		anosDisponiveis,
		semestresDisponiveis,
		// Estados de UI
		loading,
		gerandoTabela,
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,
		// Handlers
		handleBaixarDeclaracao,
		handleBaixarDeclaracaoExterno,
		handleBaixarDeclaracaoTabela,
		handleCloseSnackbar,
	};
}
