import React, { useState, useEffect } from "react";
import {
	Alert,
	Box,
	Button,
	Snackbar,
	Stack,
	TextField,
	Typography,
	Divider,
	CircularProgress,
	FormControl,
} from "@mui/material";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";

export default function PerfilOrientador() {
	const { usuario } = useAuth();
	const [docente, setDocente] = useState(null);
	const [siape, setSiape] = useState("");
	const [sala, setSala] = useState("");
	const [loading, setLoading] = useState(true);
	const [edit, setEdit] = useState(false);
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");

	useEffect(() => {
		getData();
	}, []);

	async function getData() {
		try {
			setLoading(true);
			const response = await axiosInstance.get("/docentes/meu-perfil");
			setDocente(response.docente);
			setSiape(response.docente.siape || "");
			setSala(response.docente.sala || "");
		} catch (error) {
			console.log(
				"Não foi possível retornar os dados do docente: ",
				error,
			);
			setMessageText(
				"Erro ao carregar dados. Você pode não estar vinculado a um perfil de docente.",
			);
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	}

	function handleEdit() {
		setEdit(true);
	}

	function handleCancelClick() {
		setEdit(false);
		setSiape(docente?.siape || "");
		setSala(docente?.sala || "");
	}

	async function handleUpdateSiape() {
		try {
			await axiosInstance.put("/docentes/", {
				formData: {
					codigo: docente.codigo,
					siape: siape || null,
					sala: sala || null,
				},
			});

			setMessageText("SIAPE e Sala atualizados com sucesso!");
			setMessageSeverity("success");
			setEdit(false);
			await getData();
		} catch (error) {
			console.log("Não foi possível atualizar o SIAPE e Sala");
			setMessageText("Falha ao atualizar SIAPE e Sala!");
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

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "400px",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (!docente) {
		return (
			<Box>
				<Alert severity="warning">
					Não foi possível carregar os dados do docente. Você pode não
					estar vinculado a um perfil de docente.
				</Alert>
			</Box>
		);
	}

	return (
		<Box>
			<Stack spacing={2}>
				<Typography variant="h5" component="h2">
					Meu Perfil
				</Typography>

				<Typography
					variant="h6"
					component="h3"
					gutterBottom
					color="primary"
				>
					Informações do Cadastro
				</Typography>

				<Divider />

				<Stack spacing={2} direction="row">
					<FormControl fullWidth size="small">
						<TextField
							label="Nome"
							value={docente.nome || ""}
							fullWidth
							size="small"
							InputProps={{
								readOnly: true,
							}}
							disabled
						/>
					</FormControl>
				</Stack>

				<Stack spacing={2} direction="row">
					<FormControl sx={{ minWidth: 150 }} size="small">
						<TextField
							label="Código"
							value={docente.codigo || ""}
							fullWidth
							size="small"
							InputProps={{
								readOnly: true,
							}}
							disabled
						/>
					</FormControl>

					<FormControl fullWidth size="small">
						<TextField
							label="Email"
							value={docente.email || ""}
							fullWidth
							size="small"
							InputProps={{
								readOnly: true,
							}}
							disabled
						/>
					</FormControl>

					<FormControl sx={{ minWidth: 150 }} size="small">
						<TextField
							label="SIAPE"
							value={siape}
							onChange={(e) => setSiape(e.target.value)}
							fullWidth
							size="small"
							disabled={!edit}
						/>
					</FormControl>

					<FormControl sx={{ minWidth: 150 }} size="small">
						<TextField
							label="Sala"
							value={sala}
							onChange={(e) => setSala(e.target.value)}
							fullWidth
							size="small"
							disabled={!edit}
						/>
					</FormControl>
				</Stack>

				<Stack spacing={2} direction="row">
					{!edit ? (
						<Button
							color="primary"
							variant="contained"
							onClick={handleEdit}
						>
							Editar Dados
						</Button>
					) : (
						<>
							<Button
								color="primary"
								variant="contained"
								onClick={handleUpdateSiape}
							>
								Salvar
							</Button>
							<Button
								variant="outlined"
								onClick={handleCancelClick}
								color="error"
							>
								Cancelar
							</Button>
						</>
					)}
				</Stack>

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
			</Stack>
		</Box>
	);
}
