import React from "react";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Snackbar,
	Stack,
	Typography,
	CircularProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";

import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import { useDicentes } from "../hooks/useDicentes.js";
import dicentesController from "../controllers/dicentes-controller.js";

import CustomDataGrid from "./CustomDataGrid";
import FiltrosPesquisa from "./FiltrosPesquisa";
import DicenteModal from "./DicenteModal";

export default function Dicentes() {
	const {
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
	} = useDicentes();

	const columns = [
		{ field: "matricula", headerName: "Matrícula", width: 150 },
		{ field: "nome", headerName: "Nome", width: 350 },
		{ field: "email", headerName: "Email", width: 300 },
		{
			field: "actions",
			headerName: "Ações",
			sortable: false,
			width: 200,
			renderCell: (params) => (
				<Stack direction="row" spacing={1}>
					<PermissionContext
						permissoes={[Permissoes.DICENTE.EDITAR]}
						showError={false}
					>
						<Button
							color="primary"
							size="small"
							startIcon={<EditIcon />}
							onClick={() => handleEdit(params.row)}
						>
							Editar
						</Button>
					</PermissionContext>
					<PermissionContext
						permissoes={[Permissoes.DICENTE.DELETAR]}
						showError={false}
					>
						<Button
							color="secondary"
							size="small"
							onClick={() => handleDelete(params.row)}
						>
							Remover
						</Button>
					</PermissionContext>
				</Stack>
			),
		},
	];

	return (
		<Box
			sx={{
				gap: 2,
				width: 1400,
			}}
		>
			<Typography variant="h5" component="h2">
				Gerenciamento de Dicentes
			</Typography>
			<FiltrosPesquisa
				cursoSelecionado={selectedCurso ? selectedCurso.id : ""}
				setCursoSelecionado={handleCursoChange}
				ano=""
				setAno={() => {}}
				semestre=""
				setSemestre={() => {}}
				fase=""
				setFase={() => {}}
				cursos={cursos}
				habilitarCurso={true}
				habilitarAno={false}
				habilitarSemestre={false}
				habilitarFase={false}
				mostrarTodosCursos={true}
				loading={loadingCursos || loadingDicentes}
			/>
			<Stack spacing={2} sx={{ width: "100%" }}>
				<Stack
					direction="row"
					spacing={2}
					flexWrap="wrap"
					sx={{ width: "100%" }}
				>
					<Box
						display="flex"
						alignItems="center"
						sx={{ minWidth: 150 }}
					>
						{loadingDicentes ? (
							<Box display="flex" alignItems="center">
								<CircularProgress size={16} sx={{ mr: 1 }} />
								<Typography
									variant="body2"
									color="text.secondary"
								>
									Carregando...
								</Typography>
							</Box>
						) : (
							<Typography variant="body2" color="text.secondary">
								{dicentesController.formatDicentesCount(dicentes.length)}
							</Typography>
						)}
					</Box>
				</Stack>

				<PermissionContext permissoes={[Permissoes.DICENTE.CRIAR]}>
					<Box sx={{ minWidth: 150 }}>
						<Button
							variant="contained"
							color="primary"
							startIcon={<PersonAddIcon />}
							onClick={handleOpenDicenteModal}
						>
							Adicionar Dicente
						</Button>
					</Box>
				</PermissionContext>

				{/* Modal para criar/editar dicente */}
				<DicenteModal
					open={openDicenteModal}
					onClose={handleCloseDicenteModal}
					isEditing={isEditing}
					dicenteToEdit={dicenteToEdit}
					onSubmit={handleCreateDicente}
				/>

				<Snackbar
					open={openMessage}
					autoHideDuration={6000}
					onClose={handleCloseMessage}
				>
					<Alert
						severity={messageSeverity}
						onClose={handleCloseMessage}
					>
						{messageText}
					</Alert>
				</Snackbar>

				<Dialog
					open={openDialog}
					onClose={handleClose}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
				>
					<DialogTitle id="alert-dialog-title">
						{"Atenção!"}
					</DialogTitle>
					<DialogContent>
						<DialogContentText id="alert-dialog-description">
							Deseja realmente remover este dicente?
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleNoDeleteClick}>Cancelar</Button>
						<Button onClick={handleDeleteClick} autoFocus>
							Confirmar
						</Button>
					</DialogActions>
				</Dialog>

				<PermissionContext
					permissoes={[
						Permissoes.DICENTE.VISUALIZAR,
						Permissoes.DICENTE.VISUALIZAR_TODOS,
					]}
				>
					<Box style={{ height: "500px" }}>
						<CustomDataGrid
							rows={dicentes}
							columns={columns}
							pageSize={10}
							checkboxSelection={false}
							disableSelectionOnClick
							getRowId={(row) => row.matricula}
						/>
					</Box>
				</PermissionContext>
			</Stack>
		</Box>
	);
}
