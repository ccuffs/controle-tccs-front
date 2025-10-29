import React, {
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from "react";
import {
	Box,
	Typography,
	Button,
	Alert,
	CircularProgress,
	Stack,
	Checkbox,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";
import CustomDataGrid from "./CustomDataGrid";
import FiltrosPesquisa from "./FiltrosPesquisa";

const GerenciarDisponibilidadeBanca = forwardRef((props, ref) => {
	const { usuario } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(getAnoSemestreAtual().ano);
	const [semestre, setSemestre] = useState(getAnoSemestreAtual().semestre);
	const [fase, setFase] = useState(1);
	const [grade, setGrade] = useState(null);
	const [disponibilidades, setDisponibilidades] = useState({});
	const [disponibilidadesOriginais, setDisponibilidadesOriginais] = useState(
		{},
	);
	// Mapa de slots ("YYYY-MM-DD-HH:mm:ss") bloqueados -> tipo ("banca" | "indisp")
	const [bloqueados, setBloqueados] = useState(new Map());
	const [rows, setRows] = useState([]);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState(null);

	// Expor métodos para o componente pai
	useImperativeHandle(ref, () => ({
		hasUnsavedChanges: () => {
			return calcularNumeroAlteracoes() > 0;
		},
		confirmNavigation: () => {
			const alteracoes = calcularNumeroAlteracoes();
			if (alteracoes > 0) {
				setShowConfirmDialog(true);
				return false; // Retorna false para indicar que a navegação foi bloqueada
			}
			return true; // Retorna true para permitir navegação
		},
	}));

	function getAnoSemestreAtual() {
		const data = new Date();
		const ano = data.getFullYear();
		const semestre = data.getMonth() < 6 ? 1 : 2;
		return { ano, semestre };
	}

	// Buscar cursos do orientador
	useEffect(() => {
		getCursosOrientador();
	}, []);

	// Buscar grade de disponibilidade quando curso, ano, semestre ou fase mudam
	useEffect(() => {
		if (cursoSelecionado) {
			buscarGradeDisponibilidade();
		} else {
			setGrade(null);
			setRows([]);
		}
	}, [cursoSelecionado, ano, semestre, fase]);

	// Gerar linhas para o DataGrid quando a grade, disponibilidades ou bloqueios mudarem
	useEffect(() => {
		if (grade && grade.horarios && grade.datas) {
			const novasRows = grade.horarios.map((hora, index) => {
				const row = {
					id: index,
					horario: formatarHora(hora),
					...grade.datas.reduce((acc, data) => {
						acc[`data_${data}`] = {
							data: data,
							hora: hora,
							disponivel: isDisponivel(data, hora),
						};
						return acc;
					}, {}),
				};
				return row;
			});
			setRows(novasRows);
		} else {
			setRows([]);
		}
	}, [grade, disponibilidades, bloqueados]);

	// Gerenciar aviso de navegação quando há mudanças não sincronizadas
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

		// Adicionar listener para beforeunload (fechar aba/navegador)
		window.addEventListener("beforeunload", handleBeforeUnload);

		// Cleanup
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [disponibilidades, disponibilidadesOriginais]);

	// Interceptar navegação via links do menu principal e Navbar
	useEffect(() => {
		// Interceptar cliques em links de navegação (menu principal)
		const handleLinkClick = (event) => {
			// Verificar se é um link de navegação (não dentro do componente atual)
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

		// Interceptar cliques em botões da Navbar (ListItemButton) - usar capture para interceptar antes do React Router
		const handleNavbarClick = (event) => {
			// Verificar se é um clique em ListItemButton da Navbar
			const listItemButton = event.target.closest('[role="button"]');
			if (listItemButton && listItemButton.closest(".MuiDrawer-paper")) {
				const alteracoes = calcularNumeroAlteracoes();
				if (alteracoes > 0) {
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();
					setShowConfirmDialog(true);
				}
			}
		};

		// Interceptar cliques no título da Navbar (Dashboard) - usar capture para interceptar antes do React Router
		const handleTitleClick = (event) => {
			// Verificar se é um clique no título do sistema
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

		// Adicionar listeners para interceptar navegação (usando capture para interceptar antes do React Router)
		document.addEventListener("click", handleLinkClick);
		document.addEventListener("click", handleNavbarClick, true); // capture = true
		document.addEventListener("click", handleTitleClick, true); // capture = true

		return () => {
			document.removeEventListener("click", handleLinkClick);
			document.removeEventListener("click", handleNavbarClick, true);
			document.removeEventListener("click", handleTitleClick, true);
		};
	}, [disponibilidades, disponibilidadesOriginais]);

	async function getCursosOrientador() {
		try {
			const codigoDocente = usuario.codigo || usuario.id;
			const response = await axiosInstance.get(
				`/orientadores/docente/${codigoDocente}`,
			);
			const cursosOrientador = response.orientacoes || [];
			setCursos(cursosOrientador.map((orientacao) => orientacao.curso));
			if (cursosOrientador.length === 1) {
				setCursoSelecionado(cursosOrientador[0].curso.id);
			}
		} catch (error) {
			setCursos([]);
		}
	}

	const buscarGradeDisponibilidade = async () => {
		if (!cursoSelecionado) return;

		try {
			setLoading(true);
			setError("");

			// Obter código do docente do contexto
			const codigoDocente = usuario.codigo || usuario.id;

			// Buscar ofertas para o curso, ano, semestre e fase selecionados
			const responseOfertas = await axiosInstance.get("/ofertas-tcc", {
				params: {
					ano: ano,
					semestre: semestre,
					id_curso: cursoSelecionado,
					fase: fase,
				},
			});

			if (responseOfertas.ofertas && responseOfertas.ofertas.length > 0) {
				const oferta = responseOfertas.ofertas[0];

				const response = await axiosInstance.get(
					`/disponibilidade-banca/grade/${codigoDocente}/${oferta.ano}/${oferta.semestre}/${oferta.id_curso}/${oferta.fase}`,
				);

				if (response.grade) {
					setGrade(response.grade);

					// Converter disponibilidades existentes para formato de checkbox
					const disponibilidadesMap = {};
					response.grade.disponibilidades.forEach((disp) => {
						const key = `${disp.data_defesa}-${disp.hora_defesa}`;
						disponibilidadesMap[key] = disp.disponivel;
					});

					// Inicializar todos os slots da grade (incluindo os não preenchidos)
					const todasDisponibilidades = {};
					if (response.grade.horarios && response.grade.datas) {
						response.grade.horarios.forEach((hora) => {
							response.grade.datas.forEach((data) => {
								const key = `${data}-${hora}`;
								// Se já existe no banco, usa o valor; senão, assume false (não disponível)
								todasDisponibilidades[key] =
									disponibilidadesMap[key] || false;
							});
						});
					}

					setDisponibilidades(todasDisponibilidades);
					setDisponibilidadesOriginais({ ...todasDisponibilidades });

					// Buscar defesas do semestre e marcar slots bloqueados para este docente
					try {
						const respDefesas = await axiosInstance.get(
							"/defesas",
							{
								params: {
									ano: oferta.ano,
									semestre: oferta.semestre,
								},
							},
						);
						const lista =
							respDefesas.defesas ||
							respDefesas.data?.defesas ||
							[];

						const toTwo = (n) => String(n).padStart(2, "0");
						const toDateKey = (iso) => {
							const dt = new Date(iso);
							const y = dt.getFullYear();
							const m = toTwo(dt.getMonth() + 1);
							const d = toTwo(dt.getDate());
							const hh = toTwo(dt.getHours());
							const mm = toTwo(dt.getMinutes());
							const ss = toTwo(dt.getSeconds());
							return {
								data: `${y}-${m}-${d}`,
								hora: `${hh}:${mm}:${ss}`,
							};
						};
						const addMinutesToTime = (timeStr, minutesToAdd) => {
							const [hh, mm, ss] = timeStr
								.split(":")
								.map((v) => parseInt(v, 10));
							const base = new Date(2000, 0, 1, hh, mm, ss || 0);
							base.setMinutes(base.getMinutes() + minutesToAdd);
							const h2 = toTwo(base.getHours());
							const m2 = toTwo(base.getMinutes());
							const s2 = toTwo(base.getSeconds());
							return `${h2}:${m2}:${s2}`;
						};

						const novosBloqueados = new Map();
						lista.forEach((def) => {
							if (
								String(def.membro_banca) ===
									String(codigoDocente) &&
								def.data_defesa
							) {
								const { data, hora } = toDateKey(
									def.data_defesa,
								);
								const keyAtual = `${data}-${hora}`;
								const keySeguinte = `${data}-${addMinutesToTime(hora, 30)}`;
								const keyAnterior = `${data}-${addMinutesToTime(hora, -30)}`;
								// Defesa e imediatamente seguinte
								novosBloqueados.set(keyAtual, "banca");
								novosBloqueados.set(keySeguinte, "banca");
								// Imediatamente anterior
								novosBloqueados.set(keyAnterior, "indisp");
							}
						});
						setBloqueados(novosBloqueados);

						// Remover do banco quaisquer disponibilidades já salvas que coincidam com slots bloqueados (inclui o segundo horário)
						try {
							const existentesBloqueados = (
								response.grade.disponibilidades || []
							).filter((d) =>
								novosBloqueados.has(
									`${d.data_defesa}-${d.hora_defesa}`,
								),
							);
							if (existentesBloqueados.length > 0) {
								await Promise.allSettled(
									existentesBloqueados.map((d) =>
										axiosInstance.delete(
											`/disponibilidade-banca/${oferta.ano}/${oferta.semestre}/${oferta.id_curso}/${oferta.fase}/${codigoDocente}/${d.data_defesa}/${d.hora_defesa}`,
										),
									),
								);
								// Reflete localmente como indisponível
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
						// Se falhar o carregamento das defesas, apenas não bloqueia
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
			setError("Erro ao carregar grade de disponibilidade");
			setGrade(null);
			setBloqueados(new Map());
		} finally {
			setLoading(false);
		}
	};

	const handleCheckboxChange = async (data, hora, checked) => {
		if (!cursoSelecionado) return;
		// Impedir alteração em slots bloqueados por defesa
		const keyBloq = `${data}-${hora}`;
		if (bloqueados.has(keyBloq)) return;

		// Atualizar estado local imediatamente para feedback visual
		const key = `${data}-${hora}`;
		setDisponibilidades((prev) => ({
			...prev,
			[key]: checked,
		}));
	};

	const handleHeaderClick = (data) => {
		if (!cursoSelecionado || !grade) {
			console.log("Retornando - curso ou grade não disponível");
			return;
		}

		// Verificar se todos os horários da data estão selecionados
		const todosHorarios = grade.horarios.map((hora) => `${data}-${hora}`);
		const horariosSelecionados = todosHorarios
			.filter((key) => !bloqueados.has(key))
			.filter((key) => disponibilidades[key]);

		// Se todos estão selecionados, desselecionar todos; senão, selecionar todos
		const todosSelecionados =
			horariosSelecionados.length ===
			todosHorarios.filter((k) => !bloqueados.has(k)).length;
		const novoValor = !todosSelecionados;

		// Atualizar todos os horários da data
		const novasDisponibilidades = { ...disponibilidades };
		todosHorarios.forEach((key) => {
			if (!bloqueados.has(key)) {
				novasDisponibilidades[key] = novoValor;
			}
		});

		setDisponibilidades(novasDisponibilidades);
	};

	const sincronizarDisponibilidades = async () => {
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

			// Buscar oferta para obter a fase
			const responseOfertas = await axiosInstance.get("/ofertas-tcc", {
				params: {
					ano: ano,
					semestre: semestre,
					id_curso: cursoSelecionado,
					fase: fase,
				},
			});

			if (responseOfertas.ofertas && responseOfertas.ofertas.length > 0) {
				const oferta = responseOfertas.ofertas[0];

				// Preparar todas as disponibilidades para envio
				const disponibilidadesParaEnviar = [];

				if (grade && grade.horarios && grade.datas) {
					grade.horarios.forEach((hora) => {
						grade.datas.forEach((data) => {
							const key = `${data}-${hora}`;
							const disponivel = bloqueados.has(key)
								? false
								: Boolean(disponibilidades[key]);

							disponibilidadesParaEnviar.push({
								ano: parseInt(ano),
								semestre: parseInt(semestre),
								id_curso: parseInt(cursoSelecionado),
								fase: parseInt(fase),
								codigo_docente: codigoDocente,
								data_defesa: data,
								hora_defesa: hora,
								disponivel: disponivel,
							});
						});
					});
				}

				// Enviar todas as disponibilidades de uma vez usando a rota de sincronização
				await axiosInstance.post("/disponibilidade-banca/sincronizar", {
					disponibilidades: disponibilidadesParaEnviar,
				});

				// Atualizar o estado original para refletir as mudanças salvas
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
			setError("Erro ao sincronizar disponibilidades");
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmNavigation = () => {
		setShowConfirmDialog(false);
		if (pendingNavigation) {
			window.location.href = pendingNavigation;
			setPendingNavigation(null);
		} else {
			// Se não há navegação pendente, significa que foi uma mudança de aba ou clique na Navbar
			// Permitir a navegação (o React Router já processou o clique)
		}
	};

	const handleCancelNavigation = () => {
		setShowConfirmDialog(false);
		setPendingNavigation(null);
	};

	const handleSincronizarESair = async () => {
		await sincronizarDisponibilidades();
		setShowConfirmDialog(false);
		if (pendingNavigation) {
			window.location.href = pendingNavigation;
			setPendingNavigation(null);
		} else {
			// Se não há navegação pendente, significa que foi uma mudança de aba ou clique na Navbar
			// Permitir a navegação (o React Router já processou o clique)
		}
	};

	const formatarData = (data) => {
		const [ano, mes, dia] = data.split("-");
		return `${dia}/${mes}/${ano}`;
	};

	const formatarHora = (hora) => {
		return hora.substring(0, 5); // Remove os segundos
	};

	// Utilitários para lidar com Set/Map em 'bloqueados' de forma segura
	const isSlotBloqueado = (key) => {
		if (!bloqueados) return false;
		if (typeof bloqueados.has === "function") return bloqueados.has(key);
		return false;
	};

	const tipoBloqueio = (key) => {
		// Quando for Map, retorna "banca" | "indisp"; caso contrário, undefined
		if (bloqueados instanceof Map) return bloqueados.get(key);
		return undefined;
	};

	const isDisponivel = (data, hora) => {
		const key = `${data}-${hora}`;
		// Se houver defesa agendada, o slot é tratado como indisponível
		if (isSlotBloqueado(key)) return false;
		return disponibilidades[key] || false;
	};

	// Calcular número de alterações em relação ao estado original
	const calcularNumeroAlteracoes = () => {
		let alteracoes = 0;

		// Verificar alterações nas disponibilidades
		Object.keys(disponibilidades).forEach((key) => {
			const valorAtual = disponibilidades[key];
			const valorOriginal = disponibilidadesOriginais[key];

			// Se o valor mudou, conta como alteração
			if (valorAtual !== valorOriginal) {
				alteracoes++;
			}
		});

		// Verificar se há chaves no original que não estão no atual
		Object.keys(disponibilidadesOriginais).forEach((key) => {
			if (!(key in disponibilidades)) {
				alteracoes++;
			}
		});

		return alteracoes;
	};

	const isDataCompleta = (data) => {
		if (!grade || !grade.horarios) return false;

		const todosHorarios = grade.horarios.map((hora) => `${data}-${hora}`);
		const elegiveis = todosHorarios.filter((k) => !isSlotBloqueado(k));
		const horariosSelecionados = elegiveis.filter(
			(key) => disponibilidades[key],
		);

		return (
			horariosSelecionados.length === elegiveis.length &&
			elegiveis.length > 0
		);
	};

	const isDataParcial = (data) => {
		if (!grade || !grade.horarios) return false;

		const todosHorarios = grade.horarios.map((hora) => `${data}-${hora}`);
		const elegiveis = todosHorarios.filter((k) => !isSlotBloqueado(k));
		const horariosSelecionados = elegiveis.filter(
			(key) => disponibilidades[key],
		);

		return (
			horariosSelecionados.length > 0 &&
			horariosSelecionados.length < elegiveis.length
		);
	};

	// Gerar colunas dinamicamente baseadas nas datas da grade
	const generateColumns = () => {
		if (!grade || !grade.datas) return [];

		const baseColumns = [
			{
				field: "horario",
				headerName: "Horário",
				width: 120,
				sortable: false,
				headerAlign: "center",
				align: "center",
				headerClassName: "header-horario",
			},
		];

		const dataColumns = grade.datas.map((data) => ({
			field: `data_${data}`,
			headerName: formatarData(data),
			width: 165,
			sortable: false,
			headerClassName: isDataCompleta(data)
				? "header-completa"
				: isDataParcial(data)
					? "header-parcial"
					: "header-padrao",
			headerAlign: "center",
			renderHeader: (params) => (
				<span
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						userSelect: "none",
					}}
					onClick={(e) => {
						e.stopPropagation();
						handleHeaderClick(data);
					}}
				>
					{formatarData(data)}
				</span>
			),
			renderCell: (params) => {
				const cellData = params.value;
				if (!cellData) return null;
				const key = `${cellData.data}-${cellData.hora}`;
				const isBlocked = isSlotBloqueado(key);

				if (isBlocked) {
					return (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								opacity: 0.6,
							}}
						>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								{tipoBloqueio(key) === "indisp"
									? "Horário Indisponível"
									: "Banca de TCC"}
							</Typography>
						</Box>
					);
				}

				return (
					<Box sx={{ display: "flex", justifyContent: "center" }}>
						<Checkbox
							checked={cellData.disponivel}
							onChange={(e) =>
								handleCheckboxChange(
									cellData.data,
									cellData.hora,
									e.target.checked,
								)
							}
							disabled={loading}
							color="primary"
						/>
					</Box>
				);
			},
		}));

		return [...baseColumns, ...dataColumns];
	};

	if (loading && !grade) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="400px"
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant="h6" component="h3" gutterBottom>
				Gerenciar Disponibilidade para Bancas
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 2 }}>
					{success}
				</Alert>
			)}

			<Stack
				// direction="row"
				spacing={2}
				// alignItems="center"
				sx={{ mb: 3 }}
			>
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
					habilitarCurso
					habilitarAno
					habilitarSemestre
					habilitarFase
					habilitarFiltroOrientacao={false}
					habilitarFiltroTodasFases={false}
					mostrarTodosCursos={false}
					loading={loading}
				/>
				<Button
					variant="contained"
					color="primary"
					onClick={sincronizarDisponibilidades}
					disabled={
						!cursoSelecionado ||
						!ano ||
						!semestre ||
						!fase ||
						loading
					}
					sx={{ maxWidth: 180 }}
				>
					{loading
						? "Sincronizando..."
						: `Sincronizar${calcularNumeroAlteracoes() > 0 ? ` (${calcularNumeroAlteracoes()})` : ""}`}
				</Button>
			</Stack>

			{grade && rows.length > 0 && (
				<CustomDataGrid
					rows={rows}
					columns={generateColumns()}
					pageSize={10}
					checkboxSelection={false}
					rowSpanning={false}
					disableSelectionOnClick
					getRowId={(row) => row.id}
					rowHeight={56}
					sx={{
						"& .header-padrao": {
							backgroundColor: "info.light",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							"&:hover": {
								backgroundColor: "info.dark",
							},
						},
						"& .header-completa": {
							backgroundColor: "success.main",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							position: "relative",
							"&:hover": {
								backgroundColor: "success.dark",
							},
							"&::after": {
								content: '""',
								position: "absolute",
								top: 2,
								right: 2,
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: "white",
							},
						},
						"& .header-parcial": {
							backgroundColor: "primary.main",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							position: "relative",
							"&:hover": {
								backgroundColor: "primary.dark",
							},
							"&::after": {
								content: '""',
								position: "absolute",
								top: 2,
								right: 2,
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: "orange",
							},
						},
						"& .header-horario": {
							backgroundColor: "grey.100",
							fontWeight: "bold",
							borderRight: "1px solid #e0e0e0",
						},
						"& .MuiDataGrid-cell[data-field='horario']": {
							backgroundColor: "grey.100",
							fontWeight: "bold",
							borderRight: "1px solid #e0e0e0",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						},
						"& .MuiCheckbox-root": {
							"& .MuiSvgIcon-root": {
								fontSize: "1.2rem",
							},
						},
						"& .MuiCheckbox-root.Mui-checked": {
							"& .MuiSvgIcon-root": {
								fontSize: "1.2rem",
							},
						},
						"& .MuiDataGrid-cell": {
							border: "0.5px solid #f0f0f0",
						},
						"& .MuiDataGrid-columnHeader": {
							border: "0.5px solid #f0f0f0",
						},
					}}
				/>
			)}

			{cursoSelecionado && !grade && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Nenhuma data de defesa configurada para esta oferta.
				</Alert>
			)}

			{!cursoSelecionado && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Selecione um curso para gerenciar a disponibilidade.
				</Alert>
			)}

			{cursoSelecionado && ano && semestre && fase && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Marque os horários disponíveis na grade abaixo e clique em
					"Sincronizar" para salvar suas disponibilidades.
					<br />
					<strong>Dica:</strong> Clique no título de uma data para
					selecionar/desselecionar todos os horários daquele dia.
				</Alert>
			)}

			{/* Diálogo de confirmação para navegação com mudanças não sincronizadas */}
			<Dialog
				open={showConfirmDialog}
				onClose={handleCancelNavigation}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Alterações não sincronizadas</DialogTitle>
				<DialogContent>
					<Typography>
						Você tem {calcularNumeroAlteracoes()} alteração(ões) não
						sincronizada(s) na sua disponibilidade para bancas.
					</Typography>
					<Typography sx={{ mt: 2 }}>O que deseja fazer?</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelNavigation} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={handleConfirmNavigation}
						color="error"
						variant="outlined"
					>
						Sair sem sincronizar
					</Button>
					<Button
						onClick={handleSincronizarESair}
						color="primary"
						variant="contained"
						disabled={loading}
					>
						{loading ? "Sincronizando..." : "Sincronizar e sair"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
});

GerenciarDisponibilidadeBanca.displayName = "GerenciarDisponibilidadeBanca";

export default GerenciarDisponibilidadeBanca;
