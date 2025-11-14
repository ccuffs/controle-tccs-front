import { useState, useEffect, useCallback } from "react";
import dicentesController from "../controllers/dicentes-controller.js";

export function useDicenteModal({
	open,
	isEditing,
	dicenteToEdit,
	onSubmit,
	onClose,
}) {
	const [formData, setFormData] = useState({
		matricula: "",
		nome: "",
		email: "",
	});

	// Atualiza o formData quando o modal abre para edição
	useEffect(() => {
		if (isEditing && dicenteToEdit) {
			const editData = dicentesController.prepareEditData(dicenteToEdit);
			setFormData({
				...editData,
				matricula: editData.matricula.toString(),
			});
		} else {
			setFormData({
				matricula: "",
				nome: "",
				email: "",
			});
		}
	}, [isEditing, dicenteToEdit, open]);

	const handleInputChange = useCallback((e) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	}, []);

	const handleReset = useCallback(() => {
		setFormData({
			matricula: "",
			nome: "",
			email: "",
		});
	}, []);

	const handleSubmit = useCallback(() => {
		onSubmit(formData);
	}, [onSubmit, formData]);

	const handleClose = useCallback(() => {
		handleReset();
		onClose();
	}, [handleReset, onClose]);

	return {
		formData,
		handleInputChange,
		handleSubmit,
		handleClose,
	};
}
