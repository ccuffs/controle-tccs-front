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
	TextField,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Typography,
} from "@mui/material";

import PermissionContext from "../../contexts/PermissionContext";
import { Permissoes } from "../../enums/permissoes";

import TemasDataGrid from "../TemasDataGrid";
import { useTemasTcc } from "../../hooks/useTemasTcc";

export default function TemasTcc({ isOrientadorView = false }) {
	const {
		// Estados de dados
		temas,
		cursos,
		cursoSelecionado,
		docentesOrientadores,
		areasTcc,
		formData,
		novaAreaData,
		temaVagas,
		setTemaVagas,
		estatisticas,
		// Estados de UI
		openMessage,
		openDialog,
		openAreaModal,
		openVagasModal,
		messageText,
		messageSeverity,
		// Handlers de curso
		handleCursoChange,
		// Handlers de formulário
		handleInputChange,
		handleNovaAreaChange,
		handleAddTema,
		handleCancelClick,
		// Handlers de área
		handleOpenAreaModal,
		handleCloseAreaModal,
		handleCreateArea,
		// Handlers de vagas
		handleOpenVagasModal,
		handleCloseVagasModal,
		handleUpdateVagas,
		// Handlers de tema
		handleToggleAtivo,
		handleDelete,
		handleDeleteClick,
		handleNoDeleteClick,
		// Handlers de mensagem e dialog
		handleCloseMessage,
		handleClose,
	} = useTemasTcc(isOrientadorView);

	return (
		<Box sx={{ width: 1400 }}>
			<Stack spacing={2} sx={{ width: "100%" }}>
				<Typography variant="h5" component="h2">
					Temas TCC por Curso
				</Typography>

				<FormControl fullWidth size="small">
					<InputLabel>Selecione um Curso</InputLabel>
					<Select
						value={cursoSelecionado}
						label="Selecione um Curso"
						onChange={handleCursoChange}
					>
						<MenuItem value="">
							<em>Selecione um curso</em>
						</MenuItem>
						{cursos.map((curso) => (
							<MenuItem key={curso.id} value={curso.id}>
								{curso.nome} - {curso.codigo} ({curso.turno})
							</MenuItem>
						))}
					</Select>
				</FormControl>

				{cursoSelecionado && (
					<PermissionContext
						grupos={
							isOrientadorView
								? [Permissoes.GRUPOS.ORIENTADOR]
								: [
										Permissoes.GRUPOS.ADMIN,
										Permissoes.GRUPOS.PROFESSOR,
									]
						}
						showError={false}
					>
						<Typography variant="h6" component="h3">
							Adicionar Novo Tema TCC
						</Typography>

						<Stack spacing={2}>
							{!isOrientadorView && (
								<FormControl fullWidth size="small">
									<InputLabel>Docente Orientador</InputLabel>
									<Select
										name="codigo_docente"
										value={formData.codigo_docente}
										label="Docente Orientador"
										onChange={handleInputChange}
									>
										{docentesOrientadores.map(
											(orientacao) => (
												<MenuItem
													key={
														orientacao.docente
															?.codigo
													}
													value={
														orientacao.docente
															?.codigo
													}
												>
													{orientacao.docente?.nome} (
													{orientacao.docente?.codigo}
													)
												</MenuItem>
											),
										)}
									</Select>
								</FormControl>
							)}

							{(formData.codigo_docente || isOrientadorView) && (
								<Stack
									direction="row"
									spacing={2}
									alignItems="center"
								>
									<FormControl fullWidth size="small">
										<InputLabel>Área TCC</InputLabel>
										<Select
											name="id_area_tcc"
											value={formData.id_area_tcc}
											label="Área TCC"
											onChange={handleInputChange}
										>
											{areasTcc.map((area) => (
												<MenuItem
													key={area.id}
													value={area.id}
												>
													{area.descricao}
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<Button
										variant="outlined"
										color="primary"
										onClick={handleOpenAreaModal}
										sx={{
											minWidth: "auto",
											whiteSpace: "nowrap",
										}}
									>
										Nova Área
									</Button>
								</Stack>
							)}

							<TextField
								name="descricao"
								label="Descrição do Tema"
								value={formData.descricao}
								onChange={handleInputChange}
								fullWidth
								size="small"
								multiline
								rows={3}
								placeholder="Descreva o tema TCC..."
							/>

							<Stack spacing={2} direction="row">
								<Button
									color="primary"
									variant="contained"
									onClick={handleAddTema}
								>
									Adicionar Tema
								</Button>
								<Button
									variant="outlined"
									onClick={handleCancelClick}
									color="error"
								>
									Cancelar
								</Button>
							</Stack>
						</Stack>
					</PermissionContext>
				)}

				{/* Modal para criar nova área TCC */}
				<Dialog
					open={openAreaModal}
					onClose={handleCloseAreaModal}
					aria-labelledby="criar-area-title"
					maxWidth="sm"
					fullWidth
				>
					<DialogTitle id="criar-area-title">
						Criar Nova Área TCC
					</DialogTitle>
					<DialogContent>
						<Stack spacing={2} sx={{ mt: 1 }}>
							<TextField
								name="descricao"
								label="Descrição da Área"
								value={novaAreaData.descricao}
								onChange={handleNovaAreaChange}
								fullWidth
								size="small"
								required
								multiline
								rows={2}
								placeholder="Ex: Inteligência Artificial, Desenvolvimento Web, Banco de Dados..."
							/>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseAreaModal}>Cancelar</Button>
						<Button
							onClick={handleCreateArea}
							variant="contained"
							color="primary"
						>
							Criar Área
						</Button>
					</DialogActions>
				</Dialog>

				{/* Modal para atualizar vagas */}
				<Dialog
					open={openVagasModal}
					onClose={handleCloseVagasModal}
					aria-labelledby="atualizar-vagas-title"
					maxWidth="sm"
					fullWidth
				>
					<DialogTitle id="atualizar-vagas-title">
						Atualizar Vagas da Oferta
					</DialogTitle>
					<DialogContent>
						<Stack spacing={2} sx={{ mt: 1 }}>
							<Typography variant="body2" color="text.secondary">
								{isOrientadorView
									? "Editando vagas da sua oferta no curso selecionado."
									: `Editando vagas da oferta do docente: ${temaVagas.docenteNome}`}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								Nota: As vagas são por oferta do docente, não
								por tema individual. Alterar aqui afetará todos
								{isOrientadorView
									? " os seus temas neste curso."
									: " os temas deste docente."}
							</Typography>
							<TextField
								label="Número de Vagas da Oferta"
								type="number"
								value={temaVagas.vagas}
								onChange={(e) =>
									setTemaVagas({
										...temaVagas,
										vagas: parseInt(e.target.value) || 0,
									})
								}
								fullWidth
								size="small"
								inputProps={{ min: 0 }}
							/>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseVagasModal}>
							Cancelar
						</Button>
						<Button
							onClick={handleUpdateVagas}
							variant="contained"
							color="primary"
						>
							Atualizar Vagas
						</Button>
					</DialogActions>
				</Dialog>

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
							Deseja realmente remover este tema TCC?
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleNoDeleteClick}>Cancelar</Button>
						<Button onClick={handleDeleteClick} autoFocus>
							Confirmar
						</Button>
					</DialogActions>
				</Dialog>

				{cursoSelecionado && (
					<>
						<Typography variant="body2" color="text.secondary">
							Total: {estatisticas.totalTemas} tema(s) •{" "}
							{estatisticas.docentesUnicos} docente(s) •{" "}
							{estatisticas.areasUnicas} área(s)
						</Typography>

						<TemasDataGrid
							temas={temas}
							onOpenVagasModal={handleOpenVagasModal}
							onToggleAtivo={handleToggleAtivo}
							onDelete={handleDelete}
							isOrientadorView={isOrientadorView}
						/>
					</>
				)}
			</Stack>
		</Box>
	);
}
