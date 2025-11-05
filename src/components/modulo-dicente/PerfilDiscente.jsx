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

import { usePerfilDiscente } from "../../hooks/usePerfilDiscente";

export default function PerfilDiscente() {
	const {
		// Estados de dados
		dicente,
		email,
		setEmail,

		// Estados de UI
		loading,
		edit,
		openMessage,
		messageText,
		messageSeverity,

		// Estados computados
		isDicenteCarregado,

		// Handlers
		handleEdit,
		handleCancelClick,
		handleUpdateEmail,
		handleCloseMessage,
	} = usePerfilDiscente();

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

	if (!isDicenteCarregado) {
		return (
			<Box>
				<Alert severity="warning">
					Não foi possível carregar os dados do discente. Você pode
					não estar vinculado a um perfil de discente.
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
							value={dicente.nome || ""}
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
					<FormControl sx={{ minWidth: 200 }} size="small">
						<TextField
							label="Matrícula"
							value={dicente.matricula || ""}
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
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
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
							Editar Email
						</Button>
					) : (
						<>
							<Button
								color="primary"
								variant="contained"
								onClick={handleUpdateEmail}
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
