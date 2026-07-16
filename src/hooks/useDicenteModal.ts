import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import dicentesController, {
	type DicenteFormData,
} from "../controllers/dicentes-controller";

interface UseDicenteModalParams {
	open: boolean;
	isEditing: boolean;
	dicenteToEdit: Partial<DicenteFormData> | null;
	onSubmit: (formData: DicenteFormData) => void;
	onClose: () => void;
}

const FORM_VAZIO: DicenteFormData = {
	matricula: "",
	nome: "",
	email: "",
};

export function useDicenteModal({
	open,
	isEditing,
	dicenteToEdit,
	onSubmit,
	onClose,
}: UseDicenteModalParams) {
	const [formData, setFormData] = useState<DicenteFormData>(FORM_VAZIO);

	// Atualiza o formData quando o modal abre para edição
	useEffect(() => {
		if (isEditing && dicenteToEdit) {
			const editData = dicentesController.prepareEditData(dicenteToEdit);
			setFormData({
				...editData,
				matricula: editData.matricula.toString(),
			});
		} else {
			setFormData(FORM_VAZIO);
		}
	}, [isEditing, dicenteToEdit, open]);

	const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	}, []);

	const handleReset = useCallback(() => {
		setFormData(FORM_VAZIO);
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
