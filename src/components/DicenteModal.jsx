import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Stack,
	TextField,
} from "@mui/material";

export default function DicenteModal({
	open,
	onClose,
	isEditing,
	dicenteToEdit,
	onSubmit,
}) {
	const [formData, setFormData] = useState({
		matricula: "",
		nome: "",
		email: "",
	});

	// Atualiza o formData quando o modal abre para edição
	useEffect(() => {
		if (isEditing && dicenteToEdit) {
			setFormData({
				matricula: dicenteToEdit.matricula.toString(),
				nome: dicenteToEdit.nome,
				email: dicenteToEdit.email,
			});
		} else {
			setFormData({
				matricula: "",
				nome: "",
				email: "",
			});
		}
	}, [isEditing, dicenteToEdit, open]);

	function handleInputChange(e) {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	}

	function handleSubmit() {
		onSubmit(formData);
	}

	function handleClose() {
		setFormData({
			matricula: "",
			nome: "",
			email: "",
		});
		onClose();
	}

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			aria-labelledby="dicente-modal-title"
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle id="dicente-modal-title">
				{isEditing ? "Editar Dicente" : "Criar Novo Dicente"}
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					<TextField
						name="matricula"
						label="Matrícula"
						value={formData.matricula}
						onChange={handleInputChange}
						fullWidth
						size="small"
						required
						disabled={isEditing}
						helperText={
							isEditing
								? "A matrícula não pode ser alterada"
								: ""
						}
					/>
					<TextField
						name="nome"
						label="Nome"
						value={formData.nome}
						onChange={handleInputChange}
						fullWidth
						size="small"
						required
					/>
					<TextField
						name="email"
						label="Email"
						type="email"
						value={formData.email}
						onChange={handleInputChange}
						fullWidth
						size="small"
						required
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>
					Cancelar
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					color="primary"
				>
					{isEditing ? "Atualizar" : "Criar"} Dicente
				</Button>
			</DialogActions>
		</Dialog>
	);
}
