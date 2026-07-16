import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import cursosController, {
	type CursoFormData,
} from "../controllers/cursos-controller";
import cursosService from "../services/cursos-service";
import type { Curso } from "../types/curso";

export function useCursos() {
	const [cursos, setCursos] = useState<Curso[]>([]);
	const [formData, setFormData] = useState<CursoFormData>({
		id: "",
		codigo: "",
		nome: "",
		turno: "",
	});
	const [edit, setEdit] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState<"success" | "error">(
		"success",
	);
	const [idDelete, setIdDelete] = useState(-1);
	const [selectTurno, setSelectTurno] = useState("");

	const getData = useCallback(async () => {
		try {
			const cursosData = await cursosService.getCursos();
			setCursos(cursosData);
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		}
	}, []);

	useEffect(() => {
		getData();
	}, [getData]);

	const handleEdit = useCallback((data: Curso) => {
		const editData = cursosController.prepareEditData(data);
		const turno = cursosController.getTurnoFromData(data);
		setFormData(editData);
		setSelectTurno(turno);
		setEdit(true);
	}, []);

	const handleDelete = useCallback((row: Curso) => {
		setIdDelete(row.id);
		setOpenDialog(true);
	}, []);

	const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}, []);

	const handleSelectChange = useCallback((e: { target: { value: string } }) => {
		setSelectTurno(e.target.value);
		setFormData((prev) => ({ ...prev, turno: e.target.value }));
	}, []);

	const handleAddOrUpdate = useCallback(async () => {
		const validation = cursosController.validateFormData(formData, edit);

		if (!validation.isValid) {
			setMessageText(validation.message ?? "");
			setMessageSeverity("error");
			setOpenMessage(true);
			return;
		}

		try {
			let message;

			if (edit) {
				const dataToSend = cursosController.prepareDataForUpdate(formData);
				await cursosService.updateCurso(dataToSend);
				message = "Curso atualizado com sucesso!";
			} else {
				const dataToSend = cursosController.prepareDataForCreate(formData);
				await cursosService.createCurso(dataToSend);
				message = "Curso inserido com sucesso!";
			}

			setMessageText(message);
			setMessageSeverity("success");
			setFormData(cursosController.getResetFormData());
			setSelectTurno(cursosController.getResetTurno());
			setEdit(false);
		} catch (error) {
			console.error("Erro ao salvar curso:", error);

			// Tratar erros específicos
			let errorMessage = "Falha ao gravar curso!";

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
					errorMessage = "Este curso já existe no sistema!";
				} else if (axiosError.response?.status === 400) {
					errorMessage =
						"Dados inválidos. Verifique os campos preenchidos!";
				}
			}

			setMessageText(errorMessage);
			setMessageSeverity("error");
		}

		setOpenMessage(true);
		await getData();
	}, [formData, edit, getData]);

	const handleCancelClick = useCallback(() => {
		setEdit(false);
		setFormData(cursosController.getResetFormData());
		setSelectTurno(cursosController.getResetTurno());
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

	const handleDeleteClick = useCallback(async () => {
		try {
			await cursosService.deleteCurso(idDelete);
			setMessageText("Curso removido com sucesso!");
			setMessageSeverity("success");
		} catch (error) {
			console.error("Erro ao remover curso:", error);
			setMessageText("Falha ao remover curso!");
			setMessageSeverity("error");
		}

		setFormData(cursosController.getResetFormData());
		setSelectTurno(cursosController.getResetTurno());
		setOpenDialog(false);
		setOpenMessage(true);
		await getData();
	}, [idDelete, getData]);

	const handleNoDeleteClick = useCallback(() => {
		setOpenDialog(false);
	}, []);

	return {
		cursos,
		formData,
		edit,
		openMessage,
		openDialog,
		messageText,
		messageSeverity,
		idDelete,
		selectTurno,
		handleEdit,
		handleDelete,
		handleInputChange,
		handleSelectChange,
		handleAddOrUpdate,
		handleCancelClick,
		handleCloseMessage,
		handleClose,
		handleDeleteClick,
		handleNoDeleteClick,
	};
}
