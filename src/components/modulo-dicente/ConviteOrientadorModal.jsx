import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	TextField,
	Typography,
	Box,
	Alert,
	CircularProgress,
} from "@mui/material";

import { useConviteOrientador } from "../../hooks/useConviteOrientador";

export default function ConviteOrientadorModal({
	open,
	onClose,
	idTcc,
	idCurso,
	onConviteEnviado,
	conviteExistente = null,
	fase = 1,
}) {
	const {
		// Estados de dados
		orientadores,
		orientadorSelecionado,
		setOrientadorSelecionado,
		mensagem,
		setMensagem,

		// Estados de UI
		loading,
		loadingOrientadores,
		error,

		// Dados processados
		conviteProcessado,
		modoVisualizacao,
		tituloModal,

		// Handlers
		handleEnviarConvite,
		handleClose,
	} = useConviteOrientador({
		open,
		idCurso,
		idTcc,
		conviteExistente,
		fase,
		onConviteEnviado,
		onClose,
	});

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>{tituloModal}</DialogTitle>
			<DialogContent>
				<Box sx={{ mt: 2 }}>
					{!idCurso && (
						<Alert severity="warning" sx={{ mb: 2 }}>
							Não foi possível identificar o curso. Entre em
							contato com o suporte.
						</Alert>
					)}

					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					<FormControl fullWidth sx={{ mb: 2 }}>
						<InputLabel>Selecione o Orientador</InputLabel>
						<Select
							value={orientadorSelecionado}
							onChange={(e) =>
								setOrientadorSelecionado(e.target.value)
							}
							disabled={
								loadingOrientadores ||
								modoVisualizacao ||
								!idCurso
							}
						>
							{loadingOrientadores ? (
								<MenuItem disabled>
									<CircularProgress
										size={20}
										sx={{ mr: 1 }}
									/>
									Carregando orientadores...
								</MenuItem>
							) : (
								(Array.isArray(orientadores)
									? orientadores
									: []
								).map((orientador) => (
									<MenuItem
										key={orientador.codigo}
										value={orientador.codigo}
									>
										{orientador.nome} - {orientador.codigo}
									</MenuItem>
								))
							)}
						</Select>
					</FormControl>

					<TextField
						fullWidth
						multiline
						rows={4}
						label="Mensagem do Convite"
						value={mensagem}
						onChange={(e) => setMensagem(e.target.value)}
						placeholder="Escreva uma mensagem personalizada para o orientador..."
						disabled={modoVisualizacao}
						sx={{ mb: 2 }}
					/>

					{conviteProcessado && (
						<Alert severity="info" sx={{ mb: 2 }}>
							<Typography variant="body2">
								<strong>Status:</strong>{" "}
								{conviteProcessado.status}
							</Typography>
							{conviteProcessado.dataEnvio && (
								<Typography variant="body2">
									<strong>Enviado em:</strong>{" "}
									{conviteProcessado.dataEnvio}
								</Typography>
							)}
						</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={loading}>
					Cancelar
				</Button>
				{!modoVisualizacao && (
					<Button
						onClick={handleEnviarConvite}
						variant="contained"
						disabled={loading || !orientadorSelecionado}
					>
						{loading ? (
							<CircularProgress size={20} />
						) : (
							"Enviar Convite"
						)}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
