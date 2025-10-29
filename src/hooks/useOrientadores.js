import { useState, useEffect, useCallback } from "react";
import orientadoresController from "../controllers/orientadores-controller.js";
import orientadoresService from "../services/orientadores-service.js";
import docentesService from "../services/docentes-service.js";
import cursosService from "../services/cursos-service.js";

export function useOrientadores() {
	const [orientadores, setOrientadores] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [docentes, setDocentes] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [formData, setFormData] = useState({
		id_curso: "",
		codigo_docente: "",
	});
	const [novoDocenteData, setNovoDocenteData] = useState({
		codigo: "",
		nome: "",
		email: "",
		sala: "",
		siape: "",
	});
	const [openMessage, setOpenMessage] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);
	const [openDocenteModal, setOpenDocenteModal] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");
	const [orientacaoDelete, setOrientacaoDelete] = useState(null);

	const getCursos = useCallback(async () => {
		try {
			const cursosData = await cursosService.getCursos();
			setCursos(cursosData || []);
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		}
	}, []);

	const getDocentes = useCallback(async () => {
		try {
			const docentesData = await docentesService.getDocentes();
			setDocentes(docentesData || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de docentes: ",
				error,
			);
			setDocentes([]);
		}
	}, []);

	const getOrientadoresPorCurso = useCallback(async (idCurso) => {
		try {
			const orientadoresData =
				await orientadoresService.getOrientadoresPorCurso(idCurso);
			setOrientadores(orientadoresData || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de orientadores: ",
				error,
			);
			setOrientadores([]);
		}
	}, []);

	useEffect(() => {
		getCursos();
		getDocentes();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (cursoSelecionado) {
			getOrientadoresPorCurso(cursoSelecionado);
		} else {
			setOrientadores([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cursoSelecionado]);

	const handleInputChange = useCallback((e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}, []);

	const handleCursoChange = useCallback((e) => {
		setCursoSelecionado(e.target.value);
	}, []);

	const handleNovoDocenteChange = useCallback((e) => {
		setNovoDocenteData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	}, []);

	const handleOpenDocenteModal = useCallback(() => {
		setOpenDocenteModal(true);
	}, []);

	const handleCloseDocenteModal = useCallback(() => {
		setOpenDocenteModal(false);
		setNovoDocenteData(orientadoresController.getResetDocenteFormData());
	}, []);

	const handleCreateDocente = useCallback(async () => {
		const validation = orientadoresController.validateDocenteData(
			novoDocenteData,
		);

		if (!validation.isValid) {
			setMessageText(validation.message);
			setMessageSeverity("error");
			setOpenMessage(true);
			return;
		}

		try {
			const dataToSend =
				orientadoresController.prepareDataForDocente(novoDocenteData);
			await docentesService.createDocente(dataToSend);

			setMessageText("Docente criado com sucesso!");
			setMessageSeverity("success");
			handleCloseDocenteModal();
			await getDocentes();
		} catch (error) {
			console.error("Erro ao criar docente:", error);

			// Tratar erros específicos
			let errorMessage = "Falha ao criar docente!";

			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.status === 409) {
				errorMessage = "Este docente já existe no sistema!";
			} else if (error.response?.status === 400) {
				errorMessage = "Dados inválidos. Verifique os campos preenchidos!";
			}

			setMessageText(errorMessage);
			setMessageSeverity("error");
		}

		setOpenMessage(true);
	}, [novoDocenteData, getDocentes, handleCloseDocenteModal]);

	const handleAddOrientacao = useCallback(async () => {
		const validation = orientadoresController.validateOrientacaoData(
			cursoSelecionado,
			formData.codigo_docente,
		);

		if (!validation.isValid) {
			setMessageText(validation.message);
			setMessageSeverity("error");
			setOpenMessage(true);
			return;
		}

		try {
			const dataToSend = orientadoresController.prepareDataForOrientacao(
				cursoSelecionado,
				formData.codigo_docente,
			);
			await orientadoresService.createOrientacao(dataToSend);

			setMessageText("Orientação adicionada com sucesso!");
			setMessageSeverity("success");
			setFormData(orientadoresController.getResetOrientacaoFormData());

			await getOrientadoresPorCurso(cursoSelecionado);
		} catch (error) {
			console.error("Erro ao criar orientação:", error);

			// Tratar erros específicos
			let errorMessage = "Falha ao gravar orientação!";

			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.status === 409) {
				errorMessage = "Esta orientação já existe!";
			} else if (error.response?.status === 400) {
				errorMessage = "Dados inválidos. Verifique os campos preenchidos!";
			}

			setMessageText(errorMessage);
			setMessageSeverity("error");
		}

		setOpenMessage(true);
	}, [cursoSelecionado, formData.codigo_docente, getOrientadoresPorCurso]);

	const handleCancelClick = useCallback(() => {
		setFormData(orientadoresController.getResetOrientacaoFormData());
	}, []);

	const handleDelete = useCallback((row) => {
		const deleteData = orientadoresController.prepareDeleteData(row);
		setOrientacaoDelete(deleteData);
		setOpenDialog(true);
	}, []);

	const handleDeleteClick = useCallback(async () => {
		if (!orientacaoDelete) return;

		try {
			await orientadoresService.deleteOrientacao(
				orientacaoDelete.id_curso,
				orientacaoDelete.codigo_docente,
			);

			setMessageText("Orientação removida com sucesso!");
			setMessageSeverity("success");

			if (cursoSelecionado) {
				await getOrientadoresPorCurso(cursoSelecionado);
			}
		} catch (error) {
			console.error("Erro ao remover orientação:", error);
			setMessageText("Falha ao remover orientação!");
			setMessageSeverity("error");
		}

		setOrientacaoDelete(null);
		setOpenDialog(false);
		setOpenMessage(true);
	}, [orientacaoDelete, cursoSelecionado, getOrientadoresPorCurso]);

	const handleNoDeleteClick = useCallback(() => {
		setOpenDialog(false);
		setOrientacaoDelete(null);
	}, []);

	const handleCloseMessage = useCallback((_, reason) => {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	}, []);

	const handleClose = useCallback(() => {
		setOpenDialog(false);
	}, []);

	return {
		orientadores,
		cursos,
		docentes,
		cursoSelecionado,
		formData,
		novoDocenteData,
		openMessage,
		openDialog,
		openDocenteModal,
		messageText,
		messageSeverity,
		handleInputChange,
		handleCursoChange,
		handleNovoDocenteChange,
		handleOpenDocenteModal,
		handleCloseDocenteModal,
		handleCreateDocente,
		handleAddOrientacao,
		handleCancelClick,
		handleDelete,
		handleDeleteClick,
		handleNoDeleteClick,
		handleCloseMessage,
		handleClose,
	};
}

