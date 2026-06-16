import React from "react";
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Stack,
	Typography,
	Button,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Snackbar,
	Alert,
	CircularProgress,
	Card,
	CardContent,
	Chip,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Divider,
	Tooltip,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Paper,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";

import { useMembrosExternos } from "../../hooks/useMembrosExternos";

const FASES = { 0: "Orientação", 1: "Projeto", 2: "TCC" };

export default function MembrosExternos() {
	const theme = useTheme();

	const {
		buscandoNome,
		sugestoesNome,
		docenteEncontrado,
		selecionarSugestao,
		limparSelecao,
		cursos,
		cursoSelecionado,
		setCursoSelecionado,
		orientacoes,
		tccSelecionado,
		setTccSelecionado,
		membros,
		modalAberto,
		abrirModal,
		fecharModal,
		form,
		handleFormChange,
		formErros,
		dataHoraDefesa,
		setDataHoraDefesa,
		salvando,
		removendo,
		loading,
		loadingMembros,
		snackbar,
		handleCloseSnackbar,
		salvarMembroExterno,
		handleRemoverMembro,
	} = useMembrosExternos();

	const tccsUnicos = React.useMemo(() => {
		const mapa = new Map();
		orientacoes.forEach((o) => {
			if (o.TrabalhoConclusao && !mapa.has(o.TrabalhoConclusao.id)) {
				mapa.set(o.TrabalhoConclusao.id, o.TrabalhoConclusao);
			}
		});
		return Array.from(mapa.values()).sort((a, b) =>
			(a.Dicente?.nome || "").localeCompare(b.Dicente?.nome || "", "pt-BR"),
		);
	}, [orientacoes]);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
			<Box>
				<Stack spacing={3}>
					<Box>
						<Typography variant="h6" component="h3" gutterBottom>
							Membros Externos da Banca
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Adicione docentes externos à universidade como membros da banca dos seus TCCs orientados.
							Máximo de 1 membro externo por banca.
						</Typography>
					</Box>

					{/* Seleção de curso */}
					<FormControl size="small" sx={{ maxWidth: 320 }}>
						<InputLabel>Curso</InputLabel>
						<Select
							value={cursoSelecionado}
							label="Curso"
							onChange={(e) => {
								setCursoSelecionado(e.target.value);
								setTccSelecionado(null);
							}}
						>
							{cursos.map((c) => (
								<MenuItem key={c.id} value={c.id}>
									{c.nome}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{/* Seleção de TCC */}
					{cursoSelecionado && (
						<FormControl size="small" sx={{ maxWidth: 480 }} disabled={loading}>
							<InputLabel>TCC</InputLabel>
							<Select
								value={tccSelecionado?.id ?? ""}
								label="TCC"
								onChange={(e) => {
									const tcc = tccsUnicos.find((t) => t.id === e.target.value);
									setTccSelecionado(tcc || null);
								}}
								startAdornment={
									loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null
								}
							>
								{tccsUnicos.map((tcc) => (
									<MenuItem key={tcc.id} value={tcc.id}>
										{tcc.Dicente?.nome || `TCC #${tcc.id}`}
										{" "}
										<Chip
											label={FASES[tcc.fase] || `Fase ${tcc.fase}`}
											size="small"
											sx={{ ml: 1 }}
										/>
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}

					{/* Área de membros externos */}
					{tccSelecionado && (
						<Box>
							<Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
								<Typography variant="subtitle1">
									Membro externo da banca
								</Typography>
								{membros.length === 0 && (
									<Button
										variant="contained"
										startIcon={<PersonAddIcon />}
										onClick={abrirModal}
										size="small"
									>
										Adicionar Externo
									</Button>
								)}
							</Stack>

							{loadingMembros ? (
								<Stack direction="row" spacing={1} alignItems="center">
									<CircularProgress size={20} />
									<Typography>Carregando...</Typography>
								</Stack>
							) : membros.length === 0 ? (
								<Box
									sx={{
										border: "2px dashed",
										borderColor: "grey.300",
										borderRadius: 2,
										p: 4,
										textAlign: "center",
										backgroundColor:
											theme.palette.mode === "dark" ? "grey.900" : "grey.50",
									}}
								>
									<BusinessIcon sx={{ fontSize: 40, color: "grey.400", mb: 1 }} />
									<Typography color="text.secondary">
										Nenhum membro externo nesta banca.
									</Typography>
								</Box>
							) : (
								<Stack spacing={2}>
									{membros.map((m) => (
										<Card key={m.codigo} variant="outlined">
											<CardContent>
												<Stack
													direction="row"
													justifyContent="space-between"
													alignItems="flex-start"
													flexWrap="wrap"
													gap={1}
												>
													<Stack spacing={0.5}>
														<Stack direction="row" spacing={1} alignItems="center">
															<Typography variant="subtitle1" fontWeight={600}>
																{m.nome}
															</Typography>
															<Chip
																label="Externo"
																size="small"
																color="warning"
																variant="outlined"
															/>
														</Stack>
														<Typography variant="body2" color="text.secondary">
															{m.email}
														</Typography>
														<Typography variant="body2" color="text.secondary">
															<strong>Instituição:</strong> {m.instituicao}
														</Typography>
														{m.siape && (
															<Typography variant="body2" color="text.secondary">
																<strong>SIAPE:</strong> {m.siape}
															</Typography>
														)}
														{m.data_defesa && (
															<Typography variant="body2" color="text.secondary">
																<strong>Defesa:</strong>{" "}
																{new Date(m.data_defesa).toLocaleString("pt-BR")}
															</Typography>
														)}
													</Stack>
													<Tooltip title="Remover membro externo">
														<span>
															<IconButton
																color="error"
																onClick={() =>
																	handleRemoverMembro(m.codigo, m.fase)
																}
																disabled={removendo === m.codigo}
															>
																{removendo === m.codigo ? (
																	<CircularProgress size={20} />
																) : (
																	<DeleteIcon />
																)}
															</IconButton>
														</span>
													</Tooltip>
												</Stack>
											</CardContent>
										</Card>
									))}
								</Stack>
							)}
						</Box>
					)}
				</Stack>

				{/* Modal de adição */}
				<Dialog open={modalAberto} onClose={fecharModal} fullWidth maxWidth="sm">
					<DialogTitle>Adicionar Membro Externo</DialogTitle>
					<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<Typography variant="body2" color="text.secondary">
							Digite o nome do docente externo. Se ele já estiver cadastrado,
							selecione-o nas sugestões para preencher automaticamente.
						</Typography>

						{/* Campo nome com autocomplete de sugestões */}
						<Box sx={{ position: "relative" }}>
							<TextField
								label="Nome completo *"
								value={form.nome}
								onChange={(e) => handleFormChange("nome", e.target.value)}
								error={Boolean(formErros.nome)}
								helperText={formErros.nome}
								fullWidth
								size="small"
								disabled={Boolean(docenteEncontrado)}
								InputProps={{
									endAdornment: buscandoNome ? (
										<CircularProgress size={16} />
									) : docenteEncontrado ? (
										<Tooltip title="Limpar seleção e digitar novo nome">
											<IconButton size="small" onClick={limparSelecao}>
												<CloseIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									) : null,
								}}
							/>

							{/* Lista de sugestões */}
							{sugestoesNome.length > 0 && !docenteEncontrado && (
								<Paper
									elevation={4}
									sx={{
										position: "absolute",
										top: "100%",
										left: 0,
										right: 0,
										zIndex: 1300,
										maxHeight: 220,
										overflowY: "auto",
									}}
								>
									<List dense disablePadding>
										{sugestoesNome.map((d) => (
											<ListItem key={d.codigo} disablePadding>
												<ListItemButton onClick={() => selecionarSugestao(d)}>
													<ListItemText
														primary={d.nome}
														secondary={d.instituicao}
													/>
													<Chip
														label="Externo"
														size="small"
														color="warning"
														variant="outlined"
													/>
												</ListItemButton>
											</ListItem>
										))}
									</List>
								</Paper>
							)}
						</Box>

						{docenteEncontrado && (
							<Alert
								icon={<CheckCircleIcon fontSize="inherit" />}
								severity="success"
								sx={{ py: 0.5 }}
							>
								Docente já cadastrado — dados preenchidos automaticamente.
							</Alert>
						)}

						<TextField
							label="E-mail *"
							type="email"
							value={form.email}
							onChange={(e) => handleFormChange("email", e.target.value)}
							error={Boolean(formErros.email)}
							helperText={formErros.email}
							fullWidth
							size="small"
							disabled={Boolean(docenteEncontrado)}
						/>
						<TextField
							label="Instituição *"
							placeholder="Ex: UFRGS, USP, UDESC..."
							value={form.instituicao}
							onChange={(e) => handleFormChange("instituicao", e.target.value)}
							error={Boolean(formErros.instituicao)}
							helperText={formErros.instituicao}
							fullWidth
							size="small"
							disabled={Boolean(docenteEncontrado)}
						/>
						<TextField
							label="SIAPE (opcional)"
							type="number"
							value={form.siape}
							onChange={(e) => handleFormChange("siape", e.target.value)}
							helperText="Preencha apenas se o docente for servidor federal"
							fullWidth
							size="small"
							disabled={Boolean(docenteEncontrado)}
						/>

							<Divider />

							<DateTimePicker
								label="Data e hora da defesa (opcional)"
								value={dataHoraDefesa}
								onChange={setDataHoraDefesa}
								slotProps={{
									textField: {
										size: "small",
										fullWidth: true,
										helperText:
											"Deixe em branco se ainda não definido",
									},
								}}
							/>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={fecharModal} disabled={salvando}>
							Cancelar
						</Button>
						<Button
							variant="contained"
							onClick={salvarMembroExterno}
							disabled={salvando}
							startIcon={salvando ? <CircularProgress size={16} /> : <PersonAddIcon />}
						>
							{salvando ? "Salvando..." : "Adicionar"}
						</Button>
					</DialogActions>
				</Dialog>

				<Snackbar
					open={snackbar.open}
					autoHideDuration={5000}
					onClose={handleCloseSnackbar}
					anchorOrigin={{ vertical: "top", horizontal: "center" }}
				>
					<Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
						{snackbar.message}
					</Alert>
				</Snackbar>
			</Box>
		</LocalizationProvider>
	);
}
