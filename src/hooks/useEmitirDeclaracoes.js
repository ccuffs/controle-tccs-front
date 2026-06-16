import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import declaracoesService, {
	getDeclaracoesExternas,
	gerarDeclaracaoExternoHtml,
} from "../services/declaracoes-service";
import declaracoesController from "../controllers/declaracoes-controller";

export function useEmitirDeclaracoes() {
	const { usuario } = useAuth();

	const [declaracoes, setDeclaracoes] = useState([]);
	const [declaracoesExternas, setDeclaracoesExternas] = useState([]);
	const [loading, setLoading] = useState(false);
	const [cursos, setCursos] = useState([]);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");

	// Estados dos filtros
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState("");
	const [semestre, setSemestre] = useState("");
	const [fase, setFase] = useState("");

	// Estados para options dos filtros
	const [anosDisponiveis, setAnosDisponiveis] = useState([]);
	const [semestresDisponiveis, setSemestresDisponiveis] = useState([]);

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
			setSnackbarMessage(error.message || "Erro ao carregar cursos");
			setSnackbarOpen(true);
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
			setSnackbarMessage(error.message || "Erro ao carregar declarações");
			setSnackbarOpen(true);
		} finally {
			setLoading(false);
		}
	}

	async function handleBaixarDeclaracaoExterno(declaracao) {
		try {
			const novaAba = window.open("", "_blank");

			if (!novaAba) {
				setSnackbarMessage("Por favor, permita pop-ups para visualizar a declaração");
				setSnackbarOpen(true);
				return;
			}

			const htmlDeclaracao = await gerarDeclaracaoExternoHtml(
				declaracao.id_tcc,
				declaracao.codigo_docente,
			);

			const cssImpressao = declaracoesController.gerarCssImpressao();
			const htmlFinal = declaracoesController.injetarCssNoHead(htmlDeclaracao, cssImpressao);
			novaAba.document.write(htmlFinal);
			novaAba.document.close();

			setSnackbarMessage("Declaração aberta em nova aba.");
			setSnackbarOpen(true);
		} catch (error) {
			console.error("Erro ao gerar declaração para externo:", error);
			setSnackbarMessage(error.message || "Erro ao gerar declaração");
			setSnackbarOpen(true);
		}
	}

	async function handleBaixarDeclaracao(declaracao) {
		try {
			const tipoParticipacao = declaracoesController.obterTipoParticipacao(
				declaracao.foi_orientador,
			);

			const novaAba = window.open("", "_blank");

			if (!novaAba) {
				setSnackbarMessage(
					"Por favor, permita pop-ups para visualizar a declaração",
				);
				setSnackbarOpen(true);
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

			setSnackbarMessage("Declaração aberta em nova aba.");
			setSnackbarOpen(true);
		} catch (error) {
			console.error("Erro ao gerar declaração:", error);
			setSnackbarMessage(error.message || "Erro ao gerar declaração");
			setSnackbarOpen(true);
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
		snackbarOpen,
		snackbarMessage,
		// Handlers
		handleBaixarDeclaracao,
		handleBaixarDeclaracaoExterno,
		handleCloseSnackbar,
	};
}
