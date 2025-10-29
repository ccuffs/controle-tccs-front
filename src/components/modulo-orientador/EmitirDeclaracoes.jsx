import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Alert, Snackbar } from "@mui/material";
import { Download } from "@mui/icons-material";
import html2pdf from "html2pdf.js";

import axios from "../../auth/axios";
import { useAuth } from "../../contexts/AuthContext";

import CustomDataGrid from "../CustomDataGrid";
import FiltrosPesquisa from "../FiltrosPesquisa";

export default function EmitirDeclaracoes() {
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

	useEffect(() => {
		carregarCursos();
	}, []);

	// Efeito para pré-selecionar curso quando usuário tem apenas um
	useEffect(() => {
		if (
			usuario?.cursos &&
			usuario.cursos.length === 1 &&
			!cursoSelecionado
		) {
			setCursoSelecionado(usuario.cursos[0].id);
		}
	}, [usuario, cursoSelecionado]);

	// Carregar declarações apenas quando pelo menos o curso estiver selecionado
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
	}, [cursoSelecionado, ano, semestre, fase]);

	const carregarCursos = async () => {
		try {
			const response = await axios.get("/cursos");
			setCursos(response?.cursos || []);

			// Se o usuário tem apenas um curso, pré-selecioná-lo
			if (usuario?.cursos && usuario.cursos.length === 1) {
				setCursoSelecionado(usuario.cursos[0].id);
			}
		} catch (error) {
			console.error("Erro ao carregar cursos:", error);
		}
	};

	const carregarDeclaracoes = async () => {
		// Só carregar se pelo menos o curso estiver selecionado
		if (!cursoSelecionado) {
			return;
		}

		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.append("curso", cursoSelecionado);
			if (ano) params.append("ano", ano);
			if (semestre) params.append("semestre", semestre);
			if (fase) params.append("fase", fase);

			const response = await axios.get(
				`/declaracoes/?${params.toString()}`,
			);

			// O axios interceptor já retorna response.data, então response já é o objeto de dados
			setDeclaracoes(response?.declaracoes || []);
			setAnosDisponiveis(response?.anosDisponiveis || []);
			setSemestresDisponiveis(response?.semestresDisponiveis || []);
		} catch (error) {
			console.error("Erro ao carregar declarações:", error);
			setDeclaracoes([]);
			setAnosDisponiveis([]);
			setSemestresDisponiveis([]);
		} finally {
			setLoading(false);
		}
	};

	const handleBaixarDeclaracao = async (declaracao) => {
		try {
			// Determinar tipo de participação baseado no campo foi_orientador
			const tipoParticipacao = declaracao.foi_orientador
				? "orientacao"
				: "banca";

			// Construir URL da API
			const url = `/declaracoes/gerar/${declaracao.id_tcc}/${tipoParticipacao}`;

			// Abrir declaração em nova aba
			const novaAba = window.open("", "_blank");

			if (!novaAba) {
				setSnackbarMessage(
					"Por favor, permita pop-ups para visualizar a declaração",
				);
				setSnackbarOpen(true);
				return;
			}

			// Fazer requisição para obter o HTML da declaração
			const response = await axios.get(url, {
				responseType: "text",
			});

			// Adicionar CSS específico para impressão A4 sem headers/footers
			const cssImpressao = `
				<style>
					@media print {
						@page {
							size: A4;
							margin: 0.5in;
						}

						/* Remove headers e footers do navegador */
						@page {
							@top-left { content: ""; }
							@top-center { content: ""; }
							@top-right { content: ""; }
							@bottom-left { content: ""; }
							@bottom-center { content: ""; }
							@bottom-right { content: ""; }
						}

						/* Garante que o conteúdo ocupe toda a página */
						body {
							margin: 0;
							padding: 0;
							font-size: 12pt;
							line-height: 1.4;
						}

						/* Otimiza para A4 */
						* {
							-webkit-print-color-adjust: exact;
							color-adjust: exact;
						}
					}
				</style>
			`;

			// Escrever o HTML na nova aba com CSS de impressão
			novaAba.document.write(cssImpressao + response);
			novaAba.document.close();

			// Adicionar função para converter para PDF na nova aba
			novaAba.onload = () => {
				// Função para converter para PDF automaticamente usando html2pdf local
				const converterParaPDFAutomatico = async () => {
					try {
						// Configurações do PDF
						const opt = {
							margin: 0.5,
							filename: `declaracao_${declaracao.nome_dicente}_${tipoParticipacao}.pdf`,
							image: { type: "jpeg", quality: 0.98 },
							html2canvas: {
								scale: 2,
								useCORS: true,
								letterRendering: true,
							},
							jsPDF: {
								unit: "in",
								format: "a4",
								orientation: "portrait",
							},
						};

						// Gerar e baixar o PDF usando a biblioteca html2pdf já importada
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

			let mensagemErro = "Erro ao gerar declaração";
			if (error.response?.data?.message) {
				mensagemErro = error.response.data.message;
			}

			setSnackbarMessage(mensagemErro);
			setSnackbarOpen(true);
		}
	};

	const handleCloseSnackbar = () => {
		setSnackbarOpen(false);
	};

	const columns = [
		{
			field: "nome_dicente",
			headerName: "Nome do Discente",
			width: 250,
			flex: 1,
		},
		{
			field: "titulo_tcc",
			headerName: "Título do TCC",
			width: 300,
			flex: 2,
		},
		{
			field: "periodo",
			headerName: "Período",
			width: 120,
			renderCell: (params) => {
				return `${params.row.ano}/${params.row.semestre}`;
			},
		},
		{
			field: "fase_descricao",
			headerName: "Fase",
			width: 100,
			renderCell: (params) => {
				const fases = {
					0: "Orientação",
					1: "Projeto",
					2: "TCC",
				};
				return fases[params.row.fase] || `Fase ${params.row.fase}`;
			},
		},
		{
			field: "tipo_participacao",
			headerName: "Participação",
			width: 120,
			renderCell: (params) => {
				return params.row.foi_orientador ? "Orientador" : "Banca";
			},
		},
		{
			field: "acoes",
			headerName: "Ações",
			width: 150,
			sortable: false,
			renderCell: (params) => {
				return (
					<Button
						variant="contained"
						color="primary"
						size="small"
						startIcon={<Download />}
						onClick={() => handleBaixarDeclaracao(params.row)}
						sx={{ fontSize: "0.75rem" }}
					>
						Baixar Declaração
					</Button>
				);
			},
		},
	];

	return (
		<Box>
			<Typography variant="h5" component="h2" gutterBottom>
				Emitir Declarações
			</Typography>

			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				Aqui você pode baixar declarações dos trabalhos em que
				participou como orientador ou membro de banca.
			</Typography>

			<Box sx={{ mb: 3 }}>
				<FiltrosPesquisa
					cursoSelecionado={cursoSelecionado}
					setCursoSelecionado={setCursoSelecionado}
					ano={ano}
					setAno={setAno}
					semestre={semestre}
					setSemestre={setSemestre}
					fase={fase}
					setFase={setFase}
					cursos={cursos}
					habilitarCurso={true}
					habilitarAno={true}
					habilitarSemestre={true}
					habilitarFase={true}
					mostrarTodosCursos={true}
					habilitarFiltroTodasFases={true}
					habilitarFiltroOrientacao={true}
					habilitarFiltroProjeto={true}
					habilitarFiltroTcc={true}
					loading={loading}
					anosDisponiveis={anosDisponiveis}
					semestresDisponiveis={semestresDisponiveis}
				/>
			</Box>

			{cursoSelecionado ? (
				<Box sx={{ height: 600, width: "100%" }}>
					<CustomDataGrid
						rows={declaracoes}
						columns={columns}
						pageSize={10}
						loading={loading}
						checkboxSelection={false}
						disableSelectionOnClick={true}
						getRowId={(row) =>
							`${row.id_tcc}_${row.tipo_participacao}`
						}
					/>
				</Box>
			) : (
				<Box
					sx={{
						height: 400,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						border: "2px dashed",
						borderColor: "grey.300",
						borderRadius: 2,
						backgroundColor: "grey.50",
					}}
				>
					<Typography variant="h6" color="text.secondary">
						Selecione um curso para visualizar as declarações
						disponíveis
					</Typography>
				</Box>
			)}

			<Snackbar
				open={snackbarOpen}
				autoHideDuration={3000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity="success"
					sx={{ width: "100%" }}
				>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</Box>
	);
}
