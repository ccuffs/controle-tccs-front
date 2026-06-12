import React, { forwardRef, useState, useEffect } from "react";
import {
	Box,
	Typography,
	Button,
	Alert,
	CircularProgress,
	Stack,
	Checkbox,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	Tooltip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import CustomDataGrid from "../customs/CustomDataGrid";
import FiltrosPesquisa from "../utils/FiltrosPesquisa";
import { useGerenciarDisponibilidadeBanca } from "../../hooks/useGerenciarDisponibilidadeBanca";
import disponibilidadeBancaController from "../../controllers/disponibilidade-banca-controller";

const GerenciarDisponibilidadeBanca = forwardRef((props, ref) => {
	const {
		// Estados de filtros
		cursos,
		cursoSelecionado,
		setCursoSelecionado,
		ano,
		setAno,
		semestre,
		setSemestre,
		fase,
		setFase,
		// Estados de dados
		grade,
		disponibilidades,
		bloqueados,
		rows,
		// Estados de UI
		loading,
		error,
		success,
		showConfirmDialog,
		// Funções
		calcularNumeroAlteracoes,
		handleCheckboxChange,
		handleHeaderClick,
		sincronizarDisponibilidades,
		handleConfirmNavigation,
		handleCancelNavigation,
		handleSincronizarESair,
	} = useGerenciarDisponibilidadeBanca(ref);

	const DATAS_POR_PAGINA = 14;
	const [paginaDatas, setPaginaDatas] = useState(0);

	useEffect(() => {
		setPaginaDatas(0);
	}, [grade]);

	const totalPaginas = grade?.datas
		? Math.ceil(grade.datas.length / DATAS_POR_PAGINA)
		: 0;

	const datasVisiveis = grade?.datas
		? grade.datas.slice(
				paginaDatas * DATAS_POR_PAGINA,
				(paginaDatas + 1) * DATAS_POR_PAGINA,
			)
		: [];

	// Gerar colunas dinamicamente baseadas nas datas da grade
	const generateColumns = () => {
		if (!grade || !grade.datas) return [];

		const baseColumns = [
			{
				field: "horario",
				headerName: "Horário",
				width: 77,
				sortable: false,
				headerAlign: "center",
				align: "center",
				headerClassName: "header-horario",
			},
		];

		const dataColumns = datasVisiveis.map((data) => {
			const [ano, mes, dia] = data.split("-").map(Number);
			const diaSemana = new Date(ano, mes - 1, dia).getDay();
			const isFimDeSemana = diaSemana === 0 || diaSemana === 6;

			return {
			field: `data_${data}`,
			headerName: disponibilidadeBancaController.formatarData(data),
			...(isFimDeSemana ? { flex: 1 } : { width: 95 }),
			sortable: false,
			headerClassName: isFimDeSemana
				? "header-fds"
				: disponibilidadeBancaController.isDataCompleta(
				data,
				grade,
				disponibilidades,
				bloqueados,
			)
				? "header-completa"
				: disponibilidadeBancaController.isDataParcial(
							data,
							grade,
							disponibilidades,
							bloqueados,
					  )
					? "header-parcial"
					: "header-padrao",
			headerAlign: "center",
		renderHeader: (params) => (
			<span
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					cursor: isFimDeSemana ? "default" : "pointer",
					userSelect: "none",
					lineHeight: 1.3,
				}}
				onClick={
					isFimDeSemana
						? undefined
						: (e) => {
								e.stopPropagation();
								handleHeaderClick(data);
							}
				}
			>
				<span style={{ fontSize: isFimDeSemana ? "0.55rem" : "0.66rem", opacity: 0.85 }}>
					{disponibilidadeBancaController.formatarDiaSemana(data)}
				</span>
				<span style={{ fontWeight: "bold", fontSize: isFimDeSemana ? "0.66rem" : "0.77rem" }}>
					{disponibilidadeBancaController.formatarData(data)}
				</span>
			</span>
		),
			renderCell: (params) => {
				if (isFimDeSemana) return null;

				const cellData = params.value;
				if (!cellData) return null;
				const key = `${cellData.data}-${cellData.hora}`;
				const isBlocked =
					disponibilidadeBancaController.isSlotBloqueado(
						bloqueados,
						key,
					);

				if (isBlocked) {
					const bloqueioInfo =
						disponibilidadeBancaController.tipoBloqueio(
							bloqueados,
							key,
						);
					const nomeDiscente =
						bloqueioInfo?.nomeDiscente || null;
					const label = nomeDiscente
						? `Banca ${nomeDiscente}`
						: bloqueioInfo?.tipo === "indisp"
							? "Horário Indisponível"
							: "Banca de TCC";

					return (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								opacity: 0.6,
							}}
						>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								{label}
							</Typography>
						</Box>
					);
				}

				return (
					<Box sx={{ display: "flex", justifyContent: "center" }}>
						<Checkbox
							checked={cellData.disponivel}
							onChange={(e) =>
								handleCheckboxChange(
									cellData.data,
									cellData.hora,
									e.target.checked,
								)
							}
							disabled={loading}
							color="primary"
						/>
					</Box>
				);
			},
		};
		});

		return [...baseColumns, ...dataColumns];
	};

	if (loading && !grade) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="400px"
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant="h6" component="h3" gutterBottom>
				Gerenciar Disponibilidade para Bancas
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 2 }}>
					{success}
				</Alert>
			)}

			<Stack
				// direction="row"
				spacing={2}
				// alignItems="center"
				sx={{ mb: 3 }}
			>
				<FiltrosPesquisa
					cursoSelecionado={cursoSelecionado}
					setCursoSelecionado={setCursoSelecionado}
					ano={ano}
					setAno={setAno}
					semestre={semestre}
					setSemestre={setSemestre}
					fase={fase}
					setFase={setFase}
					cursos={cursos}
					habilitarCurso
					habilitarAno
					habilitarSemestre
					habilitarFase
					habilitarFiltroOrientacao={false}
					habilitarFiltroTodasFases={false}
					mostrarTodosCursos={false}
					loading={loading}
				/>
				<Button
					variant="contained"
					color="primary"
					onClick={sincronizarDisponibilidades}
					disabled={
						!cursoSelecionado ||
						!ano ||
						!semestre ||
						!fase ||
						loading
					}
					sx={{ maxWidth: 180 }}
				>
					{loading
						? "Sincronizando..."
						: `Sincronizar${calcularNumeroAlteracoes() > 0 ? ` (${calcularNumeroAlteracoes()})` : ""}`}
				</Button>
			</Stack>

		{grade && rows.length > 0 && (
			<Box>
				{totalPaginas > 1 && (
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="flex-end"
						spacing={1}
						sx={{ mb: 1 }}
					>
						<Tooltip title="Datas anteriores">
							<span>
								<IconButton
									size="small"
									onClick={() =>
										setPaginaDatas((p) => p - 1)
									}
									disabled={paginaDatas === 0}
								>
									<ChevronLeftIcon />
								</IconButton>
							</span>
						</Tooltip>
						<Typography variant="body2" color="text.secondary">
							Datas {paginaDatas * DATAS_POR_PAGINA + 1}–
							{Math.min(
								(paginaDatas + 1) * DATAS_POR_PAGINA,
								grade.datas.length,
							)}{" "}
							de {grade.datas.length}
						</Typography>
						<Tooltip title="Próximas datas">
							<span>
								<IconButton
									size="small"
									onClick={() =>
										setPaginaDatas((p) => p + 1)
									}
									disabled={
										paginaDatas >= totalPaginas - 1
									}
								>
									<ChevronRightIcon />
								</IconButton>
							</span>
						</Tooltip>
					</Stack>
				)}
		<CustomDataGrid
				rows={rows}
				columns={generateColumns()}
				checkboxSelection={false}
				rowSpanning={false}
				disableSelectionOnClick
				hideFooter
				getRowId={(row) => row.id}
				columnHeaderHeight={56}
				rowHeight={56}
					sx={{
					"& .header-fds": {
						backgroundColor: "grey.300",
						color: "text.disabled",
						fontWeight: "bold",
						cursor: "default",
					},
					"& .header-padrao": {
						backgroundColor: "info.light",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							"&:hover": {
								backgroundColor: "info.dark",
							},
						},
						"& .header-completa": {
							backgroundColor: "success.main",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							position: "relative",
							"&:hover": {
								backgroundColor: "success.dark",
							},
							"&::after": {
								content: '""',
								position: "absolute",
								top: 2,
								right: 2,
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: "white",
							},
						},
						"& .header-parcial": {
							backgroundColor: "primary.main",
							color: "primary.contrastText",
							fontWeight: "bold",
							cursor: "pointer",
							position: "relative",
							"&:hover": {
								backgroundColor: "primary.dark",
							},
							"&::after": {
								content: '""',
								position: "absolute",
								top: 2,
								right: 2,
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: "orange",
							},
						},
						"& .header-horario": {
							backgroundColor: "grey.100",
							fontWeight: "bold",
							borderRight: "2px solid #e0e0e0",
						},
						"& .MuiDataGrid-cell[data-field='horario']": {
							backgroundColor: "grey.100",
							fontWeight: "bold",
							borderRight: "2px solid #e0e0e0",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						},
						"& .MuiCheckbox-root": {
							"& .MuiSvgIcon-root": {
								fontSize: "1.2rem",
							},
						},
						"& .MuiCheckbox-root.Mui-checked": {
							"& .MuiSvgIcon-root": {
								fontSize: "1.2rem",
							},
						},
						"& .MuiDataGrid-cell": {
							border: "0.5px solid #f0f0f0",
						},
						"& .MuiDataGrid-columnHeader": {
							border: "0.5px solid #f0f0f0",
						},
					}}
				/>
				{totalPaginas > 1 && (
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="flex-end"
						spacing={1}
						sx={{ mt: 1 }}
					>
						<Tooltip title="Datas anteriores">
							<span>
								<IconButton
									size="small"
									onClick={() =>
										setPaginaDatas((p) => p - 1)
									}
									disabled={paginaDatas === 0}
								>
									<ChevronLeftIcon />
								</IconButton>
							</span>
						</Tooltip>
						<Typography variant="body2" color="text.secondary">
							Datas {paginaDatas * DATAS_POR_PAGINA + 1}–
							{Math.min(
								(paginaDatas + 1) * DATAS_POR_PAGINA,
								grade.datas.length,
							)}{" "}
							de {grade.datas.length}
						</Typography>
						<Tooltip title="Próximas datas">
							<span>
								<IconButton
									size="small"
									onClick={() =>
										setPaginaDatas((p) => p + 1)
									}
									disabled={
										paginaDatas >= totalPaginas - 1
									}
								>
									<ChevronRightIcon />
								</IconButton>
							</span>
						</Tooltip>
					</Stack>
				)}
			</Box>
		)}

			{cursoSelecionado && !grade && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Nenhuma data de defesa configurada para esta oferta.
				</Alert>
			)}

			{!cursoSelecionado && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Selecione um curso para gerenciar a disponibilidade.
				</Alert>
			)}

			{cursoSelecionado && ano && semestre && fase && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Marque os horários disponíveis na grade abaixo e clique em
					"Sincronizar" para salvar suas disponibilidades.
					<br />
					<strong>Dica:</strong> Clique no título de uma data para
					selecionar/desselecionar todos os horários daquele dia.
				</Alert>
			)}

			{/* Diálogo de confirmação para navegação com mudanças não sincronizadas */}
			<Dialog
				open={showConfirmDialog}
				onClose={handleCancelNavigation}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Alterações não sincronizadas</DialogTitle>
				<DialogContent>
					<Typography>
						Você tem {calcularNumeroAlteracoes()} alteração(ões) não
						sincronizada(s) na sua disponibilidade para bancas.
					</Typography>
					<Typography sx={{ mt: 2 }}>O que deseja fazer?</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelNavigation} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={handleConfirmNavigation}
						color="error"
						variant="outlined"
					>
						Sair sem sincronizar
					</Button>
					<Button
						onClick={handleSincronizarESair}
						color="primary"
						variant="contained"
						disabled={loading}
					>
						{loading ? "Sincronizando..." : "Sincronizar e sair"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
});

GerenciarDisponibilidadeBanca.displayName = "GerenciarDisponibilidadeBanca";

export default GerenciarDisponibilidadeBanca;
