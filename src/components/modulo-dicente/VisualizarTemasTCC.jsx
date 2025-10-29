import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../../auth/axios";
import { AuthContext } from "../../contexts/AuthContext";

import {
	Alert,
	Box,
	Button,
	Snackbar,
	Stack,
	Typography,
	Chip,
	Paper,
	LinearProgress,
	CircularProgress,
	Grid,
} from "@mui/material";
import TemasDataGrid from "../TemasDataGrid";
import { useTheme } from "@mui/material/styles";

export default function VisualizarTemasTCC({ onAvancarEtapa }) {
	const theme = useTheme();
	const { usuario } = useContext(AuthContext);
	const [temas, setTemas] = useState([]);
	const [temasAtivos, setTemasAtivos] = useState([]);
	const [cursoDiscente, setCursoDiscente] = useState(null);
	const [loading, setLoading] = useState(true);
	const [openMessage, setOpenMessage] = React.useState(false);
	const [messageText, setMessageText] = React.useState("");
	const [messageSeverity, setMessageSeverity] = React.useState("success");

	useEffect(() => {
		if (usuario) {
			getCursoDiscente();
		}
	}, [usuario]);

	useEffect(() => {
		if (cursoDiscente) {
			getTemasPorCurso(cursoDiscente.id);
		}
	}, [cursoDiscente]);

	useEffect(() => {
		// Filtrar apenas temas ativos
		const temasFiltrados = temas.filter((tema) => tema.ativo === true);
		setTemasAtivos(temasFiltrados);
	}, [temas]);

	async function getCursoDiscente() {
		try {
			// Buscar o curso do discente através do usuário logado
			const response = await axiosInstance.get(
				`/usuarios/${usuario.id}/cursos`,
			);
			if (response.cursos && response.cursos.length > 0) {
				setCursoDiscente(response.cursos[0]); // Assume o primeiro curso
			} else {
				setMessageText("Usuário não possui curso associado!");
				setMessageSeverity("error");
				setOpenMessage(true);
			}
		} catch (error) {
			console.log("Não foi possível obter o curso do discente: ", error);
			setMessageText("Erro ao carregar dados do curso!");
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
		}
	}

	async function getTemasPorCurso(idCurso) {
		setLoading(true);
		try {
			const response = await axiosInstance.get(
				`/temas-tcc/curso/${idCurso}`,
			);
			setTemas(response || []);
		} catch (error) {
			console.log(
				"Não foi possível retornar a lista de temas TCC: ",
				error,
			);
			setTemas([]);
			setMessageText("Erro ao carregar temas TCC!");
			setMessageSeverity("error");
			setOpenMessage(true);
		} finally {
			setLoading(false);
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
			<Box sx={{ width: "100%" }}>
				<LinearProgress />
				<Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
					<CircularProgress />
				</Box>
			</Box>
		);
	}

	if (!cursoDiscente) {
		return (
			<Box>
				<Typography variant="h6" color="error">
					Nenhum curso encontrado para este usuário.
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Stack spacing={2}>
				<Typography variant="h5" component="h2">
					Temas TCC Disponíveis
				</Typography>

				<Paper
					sx={{
						p: 2,
						mb: 2,
						backgroundColor: theme.palette.background.default,
					}}
				>
					<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} md={6}>
							<Typography variant="h6" component="h3">
								Curso: {cursoDiscente.nome}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Código: {cursoDiscente.codigo} - Turno:{" "}
								{cursoDiscente.turno}
							</Typography>
						</Grid>
						<Grid item xs={12} md={6}>
							<Stack direction="row" spacing={1} flexWrap="wrap">
								<Chip
									label={`${temasAtivos.length} tema(s) ativo(s)`}
									color="success"
									variant="outlined"
								/>
							</Stack>
						</Grid>
					</Grid>
				</Paper>

				<Typography variant="body2" color="text.secondary">
					Total: {temasAtivos.length} tema(s) ativo(s) •{" "}
					{
						Object.keys(
							temasAtivos.reduce((acc, tema) => {
								const codigo =
									tema.Docente?.codigo || "sem-docente";
								acc[codigo] = true;
								return acc;
							}, {}),
						).length
					}{" "}
					docente(s) •{" "}
					{
						Object.keys(
							temasAtivos.reduce((acc, tema) => {
								const idArea = tema.AreaTcc?.id || "sem-area";
								acc[idArea] = true;
								return acc;
							}, {}),
						).length
					}{" "}
					área(s)
				</Typography>

				<TemasDataGrid temas={temasAtivos} isDiscenteView={true} />

				{onAvancarEtapa && (
					<Box
						sx={{
							mt: 3,
							display: "flex",
							justifyContent: "center",
						}}
					>
						<Button
							variant="contained"
							color="primary"
							size="large"
							onClick={() => onAvancarEtapa(1)}
							sx={{ px: 4, py: 1.5 }}
						>
							Iniciar Desenvolvimento do TCC
						</Button>
					</Box>
				)}
			</Stack>

			<Snackbar
				open={openMessage}
				autoHideDuration={6000}
				onClose={handleCloseMessage}
			>
				<Alert severity={messageSeverity} onClose={handleCloseMessage}>
					{messageText}
				</Alert>
			</Snackbar>
		</Box>
	);
}
