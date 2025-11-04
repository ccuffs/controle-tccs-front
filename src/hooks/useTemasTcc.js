import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import temasTccService from "../services/temas-tcc-service";
import temasTccController from "../controllers/temas-tcc-controller";

export function useTemasTcc(isOrientadorView = false) {
	const { usuario } = useAuth();

	const [temas, setTemas] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [docentesOrientadores, setDocentesOrientadores] = useState([]);
	const [areasTcc, setAreasTcc] = useState([]);
	const [formData, setFormData] = useState(
		temasTccController.prepararFormDataInicial(
			isOrientadorView,
			usuario?.codigo || usuario?.id,
		),
	);
	const [openMessage, setOpenMessage] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);
	const [openAreaModal, setOpenAreaModal] = useState(false);
	const [openVagasModal, setOpenVagasModal] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");
	const [temaDelete, setTemaDelete] = useState(null);
	const [temaVagas, setTemaVagas] = useState(
		temasTccController.prepararVagasInicial(),
	);
	const [novaAreaData, setNovaAreaData] = useState(
		temasTccController.prepararNovaAreaInicial(),
	);

	// Carregar cursos ao montar
	useEffect(() => {
		if (isOrientadorView) {
			getCursosOrientador();
		} else {
			getCursos();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOrientadorView]);

	// Carregar dados quando curso muda
	useEffect(() => {
		if (cursoSelecionado) {
			if (isOrientadorView) {
				getTemasPorCursoOrientador();
				getAreasTccOrientador();
			} else {
				getDocentesOrientadoresPorCurso();
				getTemasPorCurso();
			}
		} else {
			setDocentesOrientadores([]);
			setTemas([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cursoSelecionado, isOrientadorView]);

	// Carregar áreas quando docente muda
	useEffect(() => {
		if (formData.codigo_docente) {
			getAreasTccPorDocente(formData.codigo_docente);
		} else {
			setAreasTcc([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData.codigo_docente]);

	async function getCursos() {
		try {
			const cursosData = await temasTccService.getCursos();
			setCursos(cursosData);
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		}
	}

	async function getCursosOrientador() {
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
			if (!codigoDocente) return;

			const cursosOrientador =
				await temasTccService.getCursosOrientador(codigoDocente);
			const cursosExtraidos =
				temasTccController.extrairCursos(cursosOrientador);
			setCursos(cursosExtraidos);

			const cursoUnico =
				temasTccController.devPreSelecionarCurso(cursosExtraidos);
			if (cursoUnico) {
				setCursoSelecionado(cursoUnico);
			}
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de cursos do orientador: ",
				error,
			);
			setCursos([]);
		}
	}

	async function getDocentesOrientadoresPorCurso() {
		try {
			const orientadores =
				await temasTccService.getDocentesOrientadoresPorCurso(
					cursoSelecionado,
				);
			setDocentesOrientadores(orientadores);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de docentes orientadores: ",
				error,
			);
			setDocentesOrientadores([]);
		}
	}

	async function getAreasTccPorDocente(codigoDocente) {
		try {
			const areas = await temasTccService.getAreasTccPorDocente(
				codigoDocente,
			);
			setAreasTcc(areas);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de áreas TCC: ",
				error,
			);
			setAreasTcc([]);
		}
	}

	async function getTemasPorCurso() {
		try {
			const temasData = await temasTccService.getTemasPorCurso(
				cursoSelecionado,
			);
			setTemas(temasData);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de temas TCC: ",
				error,
			);
			setTemas([]);
		}
	}

	async function getTemasPorCursoOrientador() {
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
			if (!codigoDocente) return;

			const temasData =
				await temasTccService.getTemasPorCursoOrientador(
					codigoDocente,
					cursoSelecionado,
				);
			setTemas(temasData);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de temas TCC do orientador: ",
				error,
			);
			setTemas([]);
		}
	}

	async function getAreasTccOrientador() {
		try {
			const codigoDocente = usuario?.codigo || usuario?.id;
			if (!codigoDocente) return;

			const areas = await temasTccService.getAreasTccPorDocente(
				codigoDocente,
			);
			setAreasTcc(areas);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de áreas TCC do orientador: ",
				error,
			);
			setAreasTcc([]);
		}
	}

	function handleDelete(row) {
		setTemaDelete(row.id);
		setOpenDialog(true);
	}

	function handleOpenVagasModal(tema) {
		const dadosVagas = temasTccController.prepararDadosVagas(
			tema,
			isOrientadorView,
			usuario,
		);
		setTemaVagas(dadosVagas);
		setOpenVagasModal(true);
	}

	function handleCloseVagasModal() {
		setOpenVagasModal(false);
		setTemaVagas(temasTccController.prepararVagasInicial());
	}

	async function handleUpdateVagas() {
		try {
			await temasTccService.atualizarVagasOferta(
				temaVagas.codigoDocente,
				cursoSelecionado,
				temaVagas.vagas,
			);

			const mensagem =
				temasTccController.formatarMensagemSucessoVagas(
					isOrientadorView,
					temaVagas.docenteNome,
				);
			setMessageText(mensagem);
			setMessageSeverity("success");
			setOpenMessage(true);

			// Atualizar lista
			if (cursoSelecionado) {
				if (isOrientadorView) {
					await getTemasPorCursoOrientador();
				} else {
					await getTemasPorCurso();
				}
			}

			handleCloseVagasModal();
		} catch (error) {
			console.log("Não foi possível atualizar as vagas da oferta", error);
			setMessageText(
				error.message || "Falha ao atualizar vagas da oferta!",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	function handleInputChange(e) {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	}

	function handleCursoChange(e) {
		setCursoSelecionado(e.target.value);
		setFormData(
			temasTccController.prepararFormDataInicial(
				isOrientadorView,
				usuario?.codigo || usuario?.id,
			),
		);
	}

	function handleNovaAreaChange(e) {
		setNovaAreaData({ ...novaAreaData, [e.target.name]: e.target.value });
	}

	function handleOpenAreaModal() {
		const validacao = temasTccController.validarAberturaModalArea(
			isOrientadorView,
			usuario?.codigo || usuario?.id,
			formData.codigo_docente,
		);

		if (!validacao.valido) {
			setMessageText(validacao.mensagem);
			setMessageSeverity("error");
			setOpenMessage(true);
			return;
		}

		const dadosArea = temasTccController.prepararDadosNovaArea(
			validacao.codigoDocente,
			"",
		);
		setNovaAreaData(dadosArea);
		setOpenAreaModal(true);
	}

	function handleCloseAreaModal() {
		setOpenAreaModal(false);
		setNovaAreaData(temasTccController.prepararNovaAreaInicial());
	}

	async function handleCreateArea() {
		try {
			if (
				!temasTccController.validarDescricaoArea(
					novaAreaData.descricao,
				)
			) {
				setMessageText("Por favor, preencha a descrição da área!");
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			await temasTccService.criarAreaTcc(novaAreaData);

			setMessageText("Área TCC criada com sucesso!");
			setMessageSeverity("success");
			handleCloseAreaModal();

			// Atualizar lista de áreas
			if (isOrientadorView) {
				await getAreasTccOrientador();
			} else {
				await getAreasTccPorDocente(formData.codigo_docente);
			}
		} catch (error) {
			console.log(
				"Não foi possível criar a área TCC no banco de dados",
				error,
			);
			setMessageText(error.message || "Falha ao criar área TCC!");
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	async function handleAddTema() {
		try {
			if (
				!temasTccController.validarCamposTema(
					formData.descricao,
					formData.id_area_tcc,
					formData.codigo_docente,
				)
			) {
				setMessageText(
					"Por favor, preencha todos os campos obrigatórios!",
				);
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			await temasTccService.criarTemaTcc(formData);

			setMessageText("Tema TCC adicionado com sucesso!");
			setMessageSeverity("success");
			setFormData(
				temasTccController.prepararFormDataInicial(
					isOrientadorView,
					usuario?.codigo || usuario?.id,
				),
			);

			// Atualizar lista
			if (isOrientadorView) {
				await getTemasPorCursoOrientador();
			} else {
				await getTemasPorCurso();
			}
		} catch (error) {
			console.log(
				"Não foi possível inserir o tema TCC no banco de dados",
				error,
			);
			setMessageText(error.message || "Falha ao gravar tema TCC!");
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	function handleCancelClick() {
		setFormData(
			temasTccController.prepararFormDataInicial(
				isOrientadorView,
				usuario?.codigo || usuario?.id,
			),
		);
	}

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") return;
		setOpenMessage(false);
	}

	function handleClose() {
		setOpenDialog(false);
	}

	async function handleDeleteClick() {
		try {
			if (!temaDelete) return;

			await temasTccService.deletarTemaTcc(temaDelete);
			setMessageText("Tema TCC removido com sucesso!");
			setMessageSeverity("success");

			// Atualizar lista
			if (cursoSelecionado) {
				if (isOrientadorView) {
					await getTemasPorCursoOrientador();
				} else {
					await getTemasPorCurso();
				}
			}
		} catch (error) {
			console.log(
				"Não foi possível remover o tema TCC no banco de dados",
				error,
			);
			setMessageText(error.message || "Falha ao remover tema TCC!");
			setMessageSeverity("error");
		} finally {
			setTemaDelete(null);
			setOpenDialog(false);
			setOpenMessage(true);
		}
	}

	function handleNoDeleteClick() {
		setOpenDialog(false);
		setTemaDelete(null);
	}

	async function handleToggleAtivo(tema) {
		try {
			const novoStatus = !tema.ativo;

			await temasTccService.atualizarTemaTcc(tema.id, novoStatus);

			setMessageText(
				`Tema ${novoStatus ? "ativado" : "desativado"} com sucesso!`,
			);
			setMessageSeverity("success");

			// Atualizar lista
			if (cursoSelecionado) {
				if (isOrientadorView) {
					await getTemasPorCursoOrientador();
				} else {
					await getTemasPorCurso();
				}
			}
		} catch (error) {
			console.log("Não foi possível alterar o status do tema", error);
			setMessageText(
				error.message || "Falha ao alterar status do tema!",
			);
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	// Calcular estatísticas
	const estatisticas = temasTccController.calcularEstatisticasTemas(temas);

	return {
		// Estados de dados
		temas,
		cursos,
		cursoSelecionado,
		docentesOrientadores,
		areasTcc,
		formData,
		novaAreaData,
		temaVagas,
		setTemaVagas,
		estatisticas,
		// Estados de UI
		openMessage,
		openDialog,
		openAreaModal,
		openVagasModal,
		messageText,
		messageSeverity,
		// Handlers de curso
		handleCursoChange,
		// Handlers de formulário
		handleInputChange,
		handleNovaAreaChange,
		handleAddTema,
		handleCancelClick,
		// Handlers de área
		handleOpenAreaModal,
		handleCloseAreaModal,
		handleCreateArea,
		// Handlers de vagas
		handleOpenVagasModal,
		handleCloseVagasModal,
		handleUpdateVagas,
		// Handlers de tema
		handleToggleAtivo,
		handleDelete,
		handleDeleteClick,
		handleNoDeleteClick,
		// Handlers de mensagem e dialog
		handleCloseMessage,
		handleClose,
	};
}

