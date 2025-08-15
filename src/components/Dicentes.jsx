import React, { useState, useEffect } from "react";
import axiosInstance from "../auth/axios";
import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import CustomDataGrid from "./CustomDataGrid";
import FiltrosPesquisa from "./FiltrosPesquisa";
import DicenteModal from "./DicenteModal";

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

export default function Dicentes() {
	const [dicentes, setDicentes] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [selectedCurso, setSelectedCurso] = useState(null);
	const [loadingCursos, setLoadingCursos] = useState(false);
	const [loadingDicentes, setLoadingDicentes] = useState(false);
	const [openMessage, setOpenMessage] = React.useState(false);
	const [openDialog, setOpenDialog] = React.useState(false);
	const [openDicenteModal, setOpenDicenteModal] = React.useState(false);
	const [messageText, setMessageText] = React.useState("");
	const [messageSeverity, setMessageSeverity] = React.useState("success");
	const [dicenteDelete, setDicenteDelete] = React.useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [dicenteToEdit, setDicenteToEdit] = useState(null);

	useEffect(() => {
		getCursos();
		getDicentes();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		// Atualiza a lista quando o curso muda
		getDicentes();
	}, [selectedCurso]); // eslint-disable-line react-hooks/exhaustive-deps

	async function getCursos() {
		setLoadingCursos(true);
		try {
			const response = await axiosInstance.get("/cursos");
			setCursos(response.cursos || []);
		} catch (error) {
			console.log("Não foi possível retornar a lista de cursos: ", error);
			setCursos([]);
		} finally {
			setLoadingCursos(false);
		}
	}

	async function getDicentes() {
		setLoadingDicentes(true);
		try {
			const response = await axiosInstance.get("/dicentes");
			setDicentes(response.dicentes || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de dicentes: ",
				error,
			);
			setDicentes([]);
		} finally {
			setLoadingDicentes(false);
		}
	}

	function handleDelete(row) {
		setDicenteDelete(row.matricula);
		setOpenDialog(true);
	}

	function handleEdit(row) {
		setDicenteToEdit(row);
		setIsEditing(true);
		setOpenDicenteModal(true);
	}

	function handleCursoChange(cursoId) {
		const curso = cursos.find((c) => c.id === cursoId);
		setSelectedCurso(curso || null);
	}



	function handleOpenDicenteModal() {
		setIsEditing(false);
		setDicenteToEdit(null);
		setOpenDicenteModal(true);
	}

	function handleCloseDicenteModal() {
		setOpenDicenteModal(false);
		setIsEditing(false);
		setDicenteToEdit(null);
	}

	async function handleCreateDicente(formData) {
		try {
			if (
				!formData.matricula ||
				!formData.nome ||
				!formData.email
			) {
				setMessageText(
					"Por favor, preencha todos os campos obrigatórios!",
				);
				setMessageSeverity("error");
				setOpenMessage(true);
				return;
			}

			if (isEditing) {
				// Atualizar dicente existente
				await axiosInstance.put(
					`/dicentes/${dicenteToEdit.matricula}`,
					{
						formData: {
							nome: formData.nome,
							email: formData.email,
						},
					},
				);
				setMessageText("Dicente atualizado com sucesso!");
			} else {
				// Criar novo dicente
				const dicenteParaEnviar = {
					...formData,
					matricula: parseInt(formData.matricula),
				};

				await axiosInstance.post("/dicentes", {
					formData: dicenteParaEnviar,
				});
				setMessageText("Dicente criado com sucesso!");
			}

			setMessageSeverity("success");
			handleCloseDicenteModal();
			// Atualiza a lista de dicentes
			await getDicentes();
		} catch (error) {
			console.log(
				`Não foi possível ${
					isEditing ? "atualizar" : "criar"
				} o dicente no banco de dados`,
				error,
			);
			setMessageText(
				`Falha ao ${isEditing ? "atualizar" : "criar"} dicente!`,
			);
			setMessageSeverity("error");
		} finally {
			setOpenMessage(true);
		}
	}

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") {
			return;
		}
		setOpenMessage(false);
	}

	function handleClose() {
		setOpenDialog(false);
	}

	async function handleDeleteClick() {
		try {
			if (!dicenteDelete) return;

			await axiosInstance.delete(`/dicentes/${dicenteDelete}`);

			setMessageText("Dicente removido com sucesso!");
			setMessageSeverity("success");
			// Atualiza a lista
			await getDicentes();
		} catch (error) {
			console.log("Não foi possível remover o dicente no banco de dados");
			setMessageText("Falha ao remover dicente!");
			setMessageSeverity("error");
		} finally {
			setDicenteDelete(null);
			setOpenDialog(false);
			setOpenMessage(true);
		}
	}

	function handleNoDeleteClick() {
		setOpenDialog(false);
		setDicenteDelete(null);
	}

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
								{`${dicentes.length} dicente${
									dicentes.length !== 1 ? "s" : ""
								} encontrado${
									dicentes.length !== 1 ? "s" : ""
								}`}
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
