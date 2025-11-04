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
	Chip,
	OutlinedInput,
	ListItemText,
	Checkbox,
} from "@mui/material";

import { useConviteBanca } from "../../hooks/useConviteBanca";

export default function ConviteBancaModal({
	open,
	onClose,
	idTcc,
	idCurso,
	onConviteEnviado,
	convitesExistentes = [],
	conviteOrientacao = null,
	tipoConvite = "banca_projeto",
	docentesPreSelecionados = [],
}) {
	const {
		// Estados de dados
		docentesBanca,
		orientadoresSelecionados,
		mensagem,
		setMensagem,
		convitesPendentes,
		convitesAceitos,
		convitesDisponiveis,

		// Estados de UI
		loading,
		loadingDocentesBanca,
		error,
		deveBotaoDesabilitado,
		podeEnviarMaisConvites,

		// Handlers
		handleEnviarConvites,
		handleClose,
		handleChangeOrientadores,

		// Funções auxiliares
		getDocenteBancaNome,
		isDocenteDisabled,
		getDocenteSecondaryText,

		// Textos processados
		textoBotao,
		mensagemStatus,
		mensagemNaoPodeEnviar,
	} = useConviteBanca({
		open,
		idCurso,
		idTcc,
		convitesExistentes,
		conviteOrientacao,
		tipoConvite,
		docentesPreSelecionados,
		onConviteEnviado,
		onClose,
	});

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle>
				{tipoConvite === "banca_projeto"
					? "Convite para Banca de Avaliação do Projeto"
					: "Convite para Banca de Avaliação do Trabalho Final"}
			</DialogTitle>
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

					{/* Informações sobre convites existentes */}
					{convitesExistentes.length > 0 && (
						<Alert severity="info" sx={{ mb: 2 }}>
							<Typography variant="subtitle2" gutterBottom>
								Status dos Convites de Banca:
							</Typography>

							{convitesPendentes.length > 0 && (
								<Box sx={{ mb: 1 }}>
									<Typography variant="body2">
										<strong>
											Pendentes (
											{convitesPendentes.length}):
										</strong>
									</Typography>
									{convitesPendentes.map((convite, index) => (
										<Chip
											key={index}
											label={`${getDocenteBancaNome(
												convite.codigo_docente,
											)} - Aguardando resposta`}
											color="warning"
											size="small"
											sx={{ mr: 1, mb: 0.5 }}
										/>
									))}
								</Box>
							)}

							{convitesAceitos.length > 0 && (
								<Box sx={{ mb: 1 }}>
									<Typography variant="body2">
										<strong>
											Aceitos ({convitesAceitos.length}):
										</strong>
									</Typography>
									{convitesAceitos.map((convite, index) => (
										<Chip
											key={index}
											label={`${getDocenteBancaNome(
												convite.codigo_docente,
											)} - Aceito`}
											color="success"
											size="small"
											sx={{ mr: 1, mb: 0.5 }}
										/>
									))}
								</Box>
							)}

							<Typography variant="body2" sx={{ mt: 1 }}>
								{mensagemStatus}
							</Typography>
						</Alert>
					)}

					{podeEnviarMaisConvites ? (
						<>
							<FormControl fullWidth sx={{ mb: 2 }}>
								<InputLabel>
									Selecione os Docentes para a Banca
								</InputLabel>
								<Select
									multiple
									value={orientadoresSelecionados}
									onChange={handleChangeOrientadores}
									input={
										<OutlinedInput label="Selecione os Docentes para a Banca" />
									}
									renderValue={(selected) => (
										<Box
											sx={{
												display: "flex",
												flexWrap: "wrap",
												gap: 0.5,
											}}
										>
											{selected.map((codigo) => (
												<Chip
													key={codigo}
													label={getDocenteBancaNome(
														codigo,
													)}
													size="small"
												/>
											))}
										</Box>
									)}
									disabled={
										loadingDocentesBanca ||
										!idCurso ||
										convitesAceitos.length +
											convitesPendentes.length >=
											2
									}
								>
									{loadingDocentesBanca ? (
										<MenuItem disabled>
											<CircularProgress
												size={20}
												sx={{ mr: 1 }}
											/>
											Carregando docentes de banca...
										</MenuItem>
									) : (
										(Array.isArray(docentesBanca)
											? docentesBanca
											: []
										).map((docente) => {
											const isDisabled =
												isDocenteDisabled(docente);
											const secondaryText =
												getDocenteSecondaryText(
													docente,
												);

											return (
												<MenuItem
													key={docente.codigo}
													value={docente.codigo}
													disabled={isDisabled}
												>
													<Checkbox
														checked={
															orientadoresSelecionados.indexOf(
																docente.codigo,
															) > -1
														}
													/>
													<ListItemText
														primary={`${docente.nome} - ${docente.codigo}`}
														secondary={
															secondaryText
														}
													/>
												</MenuItem>
											);
										})
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
								placeholder="Escreva uma mensagem personalizada para os membros da banca..."
								sx={{ mb: 2 }}
								helperText={`Você pode selecionar até ${
									2 -
									convitesAceitos.length -
									convitesPendentes.length
								} docente(s) para enviar convites simultaneamente.`}
							/>
						</>
					) : (
						<Alert severity="info">
							<Typography variant="body2">
								{mensagemNaoPodeEnviar}
							</Typography>
						</Alert>
					)}

					{convitesAceitos.length === 2 && (
						<Alert severity="success" sx={{ mt: 2 }}>
							<Typography variant="body2">
								<strong>Excelente!</strong> Você já tem 2
								membros confirmados para sua banca de avaliação.
								Agora você pode prosseguir para a próxima etapa.
							</Typography>
						</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={loading}>
					Fechar
				</Button>
				<Button
					onClick={handleEnviarConvites}
					variant="contained"
					disabled={
						loading ||
						deveBotaoDesabilitado ||
						orientadoresSelecionados.length === 0
					}
				>
					{loading ? (
						<CircularProgress size={20} />
					) : (
						textoBotao
					)}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
