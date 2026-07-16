import { useState, useEffect, useCallback } from "react";
import dicentesController, {
	type DicenteFormData,
} from "../controllers/dicentes-controller";
import dicentesService from "../services/dicentes-service";
import cursosService from "../services/cursos-service";
import type { Curso } from "../types/curso";
import type { Dicente } from "../types/dicente";

export function useDicentes() {
	const [dicentes, setDicentes] = useState<Dicente[]>([]);
	const [cursos, setCursos] = useState<Curso[]>([]);
	const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
	const [loadingCursos, setLoadingCursos] = useState(false);
	const [loadingDicentes, setLoadingDicentes] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);
	const [openDicenteModal, setOpenDicenteModal] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState<"success" | "error">(
		"success",
	);
	const [dicenteDelete, setDicenteDelete] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [dicenteToEdit, setDicenteToEdit] = useState<DicenteFormData | null>(
		null,
	);

	const getCursos = useCallback(async () => {
		setLoadingCursos(true);
		try {
			const cursosData = await cursosService.getCursos();
			setCursos(cursosData || []);
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		} finally {
			setLoadingCursos(false);
		}
	}, []);

	const getDicentes = useCallback(async () => {
		setLoadingDicentes(true);
		try {
			const dicentesData = await dicentesService.getDicentes();
			setDicentes(dicentesData || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de dicentes: ",
				error,
			);
			setDicentes([]);
		} finally {
			setLoadingDicentes(false);
		}
	}, []);

	useEffect(() => {
		getCursos();
		getDicentes();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		// Atualiza a lista quando o curso muda (se necessário filtrar)
		getDicentes();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCurso]);

	const handleDelete = useCallback((row: Dicente) => {
		setDicenteDelete(row.matricula);
		setOpenDialog(true);
	}, []);

	const handleEdit = useCallback((row: Dicente) => {
		const editData = dicentesController.prepareEditData(row);
		setDicenteToEdit(editData);
		setIsEditing(true);
		setOpenDicenteModal(true);
	}, []);

	const handleCursoChange = useCallback(
		(cursoId: string | number) => {
			const curso = dicentesController.findCursoById(cursos, Number(cursoId));
			setSelectedCurso(curso);
		},
		[cursos],
	);

	const handleOpenDicenteModal = useCallback(() => {
		setIsEditing(false);
		setDicenteToEdit(null);
		setOpenDicenteModal(true);
	}, []);

	const handleCloseDicenteModal = useCallback(() => {
		setOpenDicenteModal(false);
		setIsEditing(false);
		setDicenteToEdit(null);
	}, []);

	const handleCreateDicente = useCallback(
		async (formData: DicenteFormData) => {
			const validation = dicentesController.validateFormData(
				formData,
				isEditing,
			);

			if (!validation.isValid) {
				setMessageText(validation.message ?? "");
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			try {
				if (isEditing && dicenteToEdit) {
					// Atualizar dicente existente
					const dataToSend =
						dicentesController.prepareDataForUpdate(formData);
					await dicentesService.updateDicente(
						String(dicenteToEdit.matricula),
						dataToSend,
					);
					setMessageText("Dicente atualizado com sucesso!");
				} else {
					// Criar novo dicente
					const dataToSend =
						dicentesController.prepareDataForCreate(formData);
					await dicentesService.createDicente(dataToSend);
					setMessageText("Dicente criado com sucesso!");
				}

				setMessageSeverity("success");
				handleCloseDicenteModal();
				await getDicentes();
			} catch (error) {
				console.error(
					`Não foi possível ${isEditing ? "atualizar" : "criar"} o dicente:`,
					error,
				);

				// Tratar erros específicos
				let errorMessage = `Falha ao ${isEditing ? "atualizar" : "criar"} dicente!`;

				if (
					typeof error === "object" &&
					error !== null &&
					"response" in error
				) {
					const axiosError = error as {
						response?: { status?: number; data?: { message?: string } };
					};
					if (axiosError.response?.data?.message) {
						errorMessage = axiosError.response.data.message;
					} else if (axiosError.response?.status === 409) {
						errorMessage = "Este dicente já existe no sistema!";
					} else if (axiosError.response?.status === 400) {
						errorMessage =
							"Dados inválidos. Verifique os campos preenchidos!";
					}
				}

				setMessageText(errorMessage);
				setMessageSeverity("error");
			}

			setOpenMessage(true);
		},
		[isEditing, dicenteToEdit, getDicentes, handleCloseDicenteModal],
	);

	const handleDeleteClick = useCallback(async () => {
		if (!dicenteDelete) return;

		try {
			await dicentesService.deleteDicente(dicenteDelete);
			setMessageText("Dicente removido com sucesso!");
			setMessageSeverity("success");
			await getDicentes();
		} catch (error) {
			console.error("Erro ao remover dicente:", error);
			setMessageText("Falha ao remover dicente!");
			setMessageSeverity("error");
		}

		setDicenteDelete(null);
		setOpenDialog(false);
		setOpenMessage(true);
	}, [dicenteDelete, getDicentes]);

	const handleNoDeleteClick = useCallback(() => {
		setOpenDialog(false);
		setDicenteDelete(null);
	}, []);

	const handleCloseMessage = useCallback((_event: unknown, reason?: string) => {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	}, []);

	const handleClose = useCallback(() => {
		setOpenDialog(false);
	}, []);

	return {
		dicentes,
		cursos,
		selectedCurso,
		loadingCursos,
		loadingDicentes,
		openMessage,
		openDialog,
		openDicenteModal,
		messageText,
		messageSeverity,
		isEditing,
		dicenteToEdit,
		handleDelete,
		handleEdit,
		handleCursoChange,
		handleOpenDicenteModal,
		handleCloseDicenteModal,
		handleCreateDicente,
		handleDeleteClick,
		handleNoDeleteClick,
		handleCloseMessage,
		handleClose,
	};
}
