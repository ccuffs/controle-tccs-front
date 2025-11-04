import { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { useAuth } from "../contexts/AuthContext";
import declaracoesService from "../services/declaracoes-service";
import declaracoesController from "../controllers/declaracoes-controller";

export function useEmitirDeclaracoes() {
	const { usuario } = useAuth();

	const [declaracoes, setDeclaracoes] = useState([]);
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

			const data = await declaracoesService.getDeclaracoes(params);

			setDeclaracoes(data.declaracoes);
			setAnosDisponiveis(data.anosDisponiveis);
			setSemestresDisponiveis(data.semestresDisponiveis);
		} catch (error) {
			console.error("Erro ao carregar declarações:", error);
			setDeclaracoes([]);
			setAnosDisponiveis([]);
			setSemestresDisponiveis([]);
			setSnackbarMessage(error.message || "Erro ao carregar declarações");
			setSnackbarOpen(true);
		} finally {
			setLoading(false);
		}
	}

	async function handleBaixarDeclaracao(declaracao) {
		try {
			// Determinar tipo de participação
			const tipoParticipacao = declaracoesController.obterTipoParticipacao(
				declaracao.foi_orientador,
			);

			// Abrir declaração em nova aba
			const novaAba = window.open("", "_blank");

			if (!novaAba) {
				setSnackbarMessage(
					"Por favor, permita pop-ups para visualizar a declaração",
				);
				setSnackbarOpen(true);
				return;
			}

			// Buscar HTML da declaração
			const htmlDeclaracao = await declaracoesService.gerarDeclaracaoHtml(
				declaracao.id_tcc,
				tipoParticipacao,
			);

			// Gerar CSS de impressão
			const cssImpressao = declaracoesController.gerarCssImpressao();

			// Escrever o HTML na nova aba com CSS de impressão
			novaAba.document.write(cssImpressao + htmlDeclaracao);
			novaAba.document.close();

			// Configurar conversão para PDF
			novaAba.onload = () => {
				// Função para converter para PDF automaticamente
				const converterParaPDFAutomatico = async () => {
					try {
						// Nome do arquivo
						const nomeArquivo =
							declaracoesController.gerarNomeArquivoPdf(
								declaracao.nome_dicente,
								tipoParticipacao,
							);

						// Configurações do PDF
						const opt =
							declaracoesController.obterConfiguracoesPdf(
								nomeArquivo,
							);

						// Gerar e baixar o PDF
						await html2pdf()
							.set(opt)
							.from(novaAba.document.body)
							.save();
					} catch (error) {
						console.error("Erro ao converter para PDF:", error);
					}
				};

				// Executar conversão para PDF automaticamente quando a página carregar
				setTimeout(() => {
					converterParaPDFAutomatico();
				}, 1000);
			};

			setSnackbarMessage(
				"Declaração aberta! PDF será baixado automaticamente.",
			);
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
		handleCloseSnackbar,
	};
}

