import { useState, useEffect, useImperativeHandle } from "react";
import { useAuth } from "../contexts/AuthContext";
import disponibilidadeBancaService from "../services/disponibilidade-banca-service";
import disponibilidadeBancaController from "../controllers/disponibilidade-banca-controller";

export function useGerenciarDisponibilidadeBanca(ref) {
	const { usuario } = useAuth();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(
		disponibilidadeBancaController.getAnoSemestreAtual().ano,
	);
	const [semestre, setSemestre] = useState(
		disponibilidadeBancaController.getAnoSemestreAtual().semestre,
	);
	const [fase, setFase] = useState(1);
	const [grade, setGrade] = useState(null);
	const [disponibilidades, setDisponibilidades] = useState({});
	const [disponibilidadesOriginais, setDisponibilidadesOriginais] =
		useState({});
	const [bloqueados, setBloqueados] = useState(new Map());
	const [rows, setRows] = useState([]);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState(null);

	// Calcular número de alterações
	const calcularNumeroAlteracoes = () => {
		return disponibilidadeBancaController.calcularNumeroAlteracoes(
			disponibilidades,
			disponibilidadesOriginais,
		);
	};

	// Expor métodos para o componente pai
	useImperativeHandle(ref, () => ({
		hasUnsavedChanges: () => {
			return calcularNumeroAlteracoes() > 0;
		},
		confirmNavigation: () => {
			const alteracoes = calcularNumeroAlteracoes();
			if (alteracoes > 0) {
				setShowConfirmDialog(true);
				return false;
			}
			return true;
		},
	}));

	// Buscar cursos do orientador
	useEffect(() => {
		getCursosOrientador();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Buscar grade quando filtros mudarem
	useEffect(() => {
		if (cursoSelecionado) {
			buscarGradeDisponibilidade();
		} else {
			setGrade(null);
			setRows([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cursoSelecionado, ano, semestre, fase]);

	// Gerar linhas para o DataGrid
	useEffect(() => {
		const novasRows = disponibilidadeBancaController.gerarRowsDataGrid(
			grade,
			disponibilidades,
			bloqueados,
		);
		setRows(novasRows);
	}, [grade, disponibilidades, bloqueados]);

	// Gerenciar aviso de navegação
	useEffect(() => {
		const handleBeforeUnload = (event) => {
			const alteracoes = calcularNumeroAlteracoes();
			if (alteracoes > 0) {
				event.preventDefault();
				event.returnValue =
					"Você tem alterações não sincronizadas. Deseja realmente sair?";
				return "Você tem alterações não sincronizadas. Deseja realmente sair?";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [disponibilidades, disponibilidadesOriginais]);

	// Interceptar navegação
	useEffect(() => {
		const handleLinkClick = (event) => {
			const target = event.target.closest("a");
			if (
				target &&
				target.href &&
				!target.href.includes("#") &&
				!target.closest('[role="tabpanel"]')
			) {
				const alteracoes = calcularNumeroAlteracoes();
				if (alteracoes > 0) {
					event.preventDefault();
					setPendingNavigation(target.href);
					setShowConfirmDialog(true);
				}
			}
		};

		const handleNavbarClick = (event) => {
			const listItemButton = event.target.closest('[role="button"]');
			if (
				listItemButton &&
				listItemButton.closest(".MuiDrawer-paper")
			) {
				const alteracoes = calcularNumeroAlteracoes();
				if (alteracoes > 0) {
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();
					setShowConfirmDialog(true);
				}
			}
		};

		const handleTitleClick = (event) => {
			const titleElement = event.target.closest(
				'[data-testid="system-title"]',
			);
			if (titleElement) {
				const alteracoes = calcularNumeroAlteracoes();
				if (alteracoes > 0) {
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();
					setShowConfirmDialog(true);
				}
			}
		};

		document.addEventListener("click", handleLinkClick);
		document.addEventListener("click", handleNavbarClick, true);
		document.addEventListener("click", handleTitleClick, true);

		return () => {
			document.removeEventListener("click", handleLinkClick);
			document.removeEventListener("click", handleNavbarClick, true);
			document.removeEventListener("click", handleTitleClick, true);
		};
	}, [disponibilidades, disponibilidadesOriginais]);

	async function getCursosOrientador() {
		try {
			const codigoDocente = usuario.codigo || usuario.id;
			const cursosOrientador =
				await disponibilidadeBancaService.getCursosOrientador(
					codigoDocente,
				);
			const cursosExtraidos =
				disponibilidadeBancaController.extrairCursos(cursosOrientador);
			setCursos(cursosExtraidos);

			if (cursosOrientador.length === 1) {
				setCursoSelecionado(cursosOrientador[0].curso.id);
			}
		} catch (error) {
			setCursos([]);
			setError(error.message);
		}
	}

	async function buscarGradeDisponibilidade() {
		if (!cursoSelecionado) return;

		try {
			setLoading(true);
			setError("");

			const codigoDocente = usuario.codigo || usuario.id;

			// Buscar ofertas
			const ofertas = await disponibilidadeBancaService.getOfertasTcc({
				ano,
				semestre,
				id_curso: cursoSelecionado,
				fase,
			});

			if (ofertas && ofertas.length > 0) {
				const oferta = ofertas[0];

				// Buscar grade
				const gradeData =
					await disponibilidadeBancaService.getGradeDisponibilidade(
						codigoDocente,
						oferta.ano,
						oferta.semestre,
						oferta.id_curso,
						oferta.fase,
					);

				if (gradeData) {
					setGrade(gradeData);

					// Converter disponibilidades
					const disponibilidadesMap =
						disponibilidadeBancaController.converterDisponibilidadesParaMapa(
							gradeData.disponibilidades,
						);

					// Inicializar todas as disponibilidades
					const todasDisponibilidades =
						disponibilidadeBancaController.inicializarTodasDisponibilidades(
							gradeData.horarios,
							gradeData.datas,
							disponibilidadesMap,
						);

					setDisponibilidades(todasDisponibilidades);
					setDisponibilidadesOriginais({ ...todasDisponibilidades });

					// Buscar defesas e processar bloqueios
					try {
						const defesas =
							await disponibilidadeBancaService.getDefesas({
								ano: oferta.ano,
								semestre: oferta.semestre,
							});

						const novosBloqueados =
							disponibilidadeBancaController.processarDefesasParaBloqueios(
								defesas,
								codigoDocente,
							);
						setBloqueados(novosBloqueados);

						// Remover disponibilidades bloqueadas do banco
						try {
							const existentesBloqueados =
								disponibilidadeBancaController.filtrarDisponibilidadesBloqueadas(
									gradeData.disponibilidades || [],
									novosBloqueados,
								);

							if (existentesBloqueados.length > 0) {
								await Promise.allSettled(
									existentesBloqueados.map((d) =>
										disponibilidadeBancaService.removerDisponibilidade(
											oferta.ano,
											oferta.semestre,
											oferta.id_curso,
											oferta.fase,
											codigoDocente,
											d.data_defesa,
											d.hora_defesa,
										),
									),
								);

								// Atualizar localmente
								setDisponibilidades((prev) => {
									const copia = { ...prev };
									existentesBloqueados.forEach((d) => {
										copia[
											`${d.data_defesa}-${d.hora_defesa}`
										] = false;
									});
									return copia;
								});
							}
						} catch (eDel) {
							// Ignora falhas de limpeza
						}
					} catch (e) {
						setBloqueados(new Map());
					}
				}
			} else {
				setGrade(null);
				setError(
					"Nenhuma oferta encontrada para os critérios selecionados",
				);
			}
		} catch (error) {
			console.error("Erro ao buscar grade de disponibilidade:", error);
			setError(error.message || "Erro ao carregar grade de disponibilidade");
			setGrade(null);
			setBloqueados(new Map());
		} finally {
			setLoading(false);
		}
	}

	function handleCheckboxChange(data, hora, checked) {
		if (!cursoSelecionado) return;

		const keyBloq = `${data}-${hora}`;
		if (disponibilidadeBancaController.isSlotBloqueado(bloqueados, keyBloq))
			return;

		const key = `${data}-${hora}`;
		setDisponibilidades((prev) => ({
			...prev,
			[key]: checked,
		}));
	}

	function handleHeaderClick(data) {
		if (!cursoSelecionado || !grade) return;

		const novasDisponibilidades =
			disponibilidadeBancaController.alternarSelecaoData(
				data,
				grade,
				disponibilidades,
				bloqueados,
			);

		setDisponibilidades(novasDisponibilidades);
	}

	async function sincronizarDisponibilidades() {
		if (!cursoSelecionado || !ano || !semestre) {
			setError(
				"Selecione curso, ano, semestre e fase antes de sincronizar",
			);
			return;
		}

		try {
			setLoading(true);
			setError("");

			const codigoDocente = usuario.codigo || usuario.id;

			// Buscar oferta
			const ofertas = await disponibilidadeBancaService.getOfertasTcc({
				ano,
				semestre,
				id_curso: cursoSelecionado,
				fase,
			});

			if (ofertas && ofertas.length > 0) {
				// Preparar disponibilidades para envio
				const disponibilidadesParaEnviar =
					disponibilidadeBancaController.prepararDisponibilidadesParaEnvio(
						grade,
						disponibilidades,
						bloqueados,
						ano,
						semestre,
						cursoSelecionado,
						fase,
						codigoDocente,
					);

				// Sincronizar
				await disponibilidadeBancaService.sincronizarDisponibilidades(
					disponibilidadesParaEnviar,
				);

				// Atualizar estado original
				setDisponibilidadesOriginais({ ...disponibilidades });

				setSuccess("Disponibilidades sincronizadas com sucesso!");
				setTimeout(() => setSuccess(""), 3000);
			} else {
				setError(
					"Nenhuma oferta encontrada para os critérios selecionados",
				);
			}
		} catch (error) {
			console.error("Erro ao sincronizar disponibilidades:", error);
			setError(error.message || "Erro ao sincronizar disponibilidades");
		} finally {
			setLoading(false);
		}
	}

	function handleConfirmNavigation() {
		setShowConfirmDialog(false);
		if (pendingNavigation) {
			window.location.href = pendingNavigation;
			setPendingNavigation(null);
		}
	}

	function handleCancelNavigation() {
		setShowConfirmDialog(false);
		setPendingNavigation(null);
	}

	async function handleSincronizarESair() {
		await sincronizarDisponibilidades();
		setShowConfirmDialog(false);
		if (pendingNavigation) {
			window.location.href = pendingNavigation;
			setPendingNavigation(null);
		}
	}

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
		grade,
		disponibilidades,
		bloqueados,
		rows,
		// Estados de UI
		loading,
		error,
		success,
		showConfirmDialog,
		// Funções
		calcularNumeroAlteracoes,
		handleCheckboxChange,
		handleHeaderClick,
		sincronizarDisponibilidades,
		handleConfirmNavigation,
		handleCancelNavigation,
		handleSincronizarESair,
	};
}

