import React from "react";
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

import { usePerfilOrientador } from "../../hooks/usePerfilOrientador";

export default function PerfilOrientador() {
	const {
		// Estados de dados
		docente,
		siape,
		setSiape,
		sala,
		setSala,
		// Estados de UI
		loading,
		edit,
		openMessage,
		messageText,
		messageSeverity,
		// Handlers
		handleEdit,
		handleCancelClick,
		handleUpdateSiape,
		handleCloseMessage,
	} = usePerfilOrientador();

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
