import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Stack,
	TextField,
} from "@mui/material";
import { useDicenteModal } from "../hooks/useDicenteModal.js";

export default function DicenteModal({
	open,
	onClose,
	isEditing,
	dicenteToEdit,
	onSubmit,
}) {
	const { formData, handleInputChange, handleSubmit, handleClose } =
		useDicenteModal({
			open,
			isEditing,
			dicenteToEdit,
			onSubmit,
			onClose,
		});

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
							isEditing ? "A matrícula não pode ser alterada" : ""
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
				<Button onClick={handleClose}>Cancelar</Button>
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
