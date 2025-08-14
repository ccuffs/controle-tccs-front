import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import MuiTooltip from "@mui/material/Tooltip";
import CustomDataGrid from "./CustomDataGrid";
import { useTheme } from "@mui/material/styles";

export default function TabelaDefesasAgendadas({ defesasAgendadas, largura }) {
	const theme = useTheme();
	return (
		<Card
			sx={{
				backgroundColor: theme.palette.background.default,
				height: "100%",
				display: "flex",
				flexDirection: "column",
				width: largura || { xs: "100%", md: 560 },
			}}
		>
			<CardContent
				sx={{
					display: "flex",
					flexDirection: "column",
					flexGrow: 1,
				}}
			>
				<Typography variant="subtitle1" gutterBottom>
					Defesas agendadas
				</Typography>

				{(defesasAgendadas || []).length === 0 ? (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Sem defesas agendadas
					</Typography>
				) : (
					<Box sx={{ mt: 1, flexGrow: 1 }}>
						<CustomDataGrid
							rows={defesasAgendadas}
							columns={[
								{
									field: "data",
									headerName: "Data",
									width: 110,
									renderCell: (params) => {
										const [y, m, d] = String(
											params.value || "",
										).split("-");
										const title = (
											<Box>
												<Typography variant="subtitle2">
													{params.row?.titulo ||
														"Sem título"}
												</Typography>
												<Typography variant="body2">
													Orientador:{" "}
													{params.row?.orientador ||
														"-"}
												</Typography>
												<Typography variant="body2">
													Banca:{" "}
													{(
														params.row?.banca || []
													).join(", ") || "-"}
												</Typography>
											</Box>
										);
										return (
											<MuiTooltip
												title={title}
												arrow
												placement="top-start"
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														whiteSpace: "nowrap",
													}}
												>
													{params.value
														? `${d}/${m}/${y}`
														: ""}
												</div>
											</MuiTooltip>
										);
									},
								},
								{
									field: "hora",
									headerName: "Hora",
									width: 90,
									renderCell: (params) => {
										const title = (
											<Box>
												<Typography variant="subtitle2">
													{params.row?.titulo ||
														"Sem título"}
												</Typography>
												<Typography variant="body2">
													Orientador:{" "}
													{params.row?.orientador ||
														"-"}
												</Typography>
												<Typography variant="body2">
													Banca:{" "}
													{(
														params.row?.banca || []
													).join(", ") || "-"}
												</Typography>
											</Box>
										);
										return (
											<MuiTooltip
												title={title}
												arrow
												placement="top-start"
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
													}}
												>
													{params.value || ""}
												</div>
											</MuiTooltip>
										);
									},
								},
								{
									field: "fase_label",
									headerName: "Fase",
									width: 120,
									renderCell: (params) => {
										const title = (
											<Box>
												<Typography variant="subtitle2">
													{params.row?.titulo ||
														"Sem título"}
												</Typography>
												<Typography variant="body2">
													Orientador:{" "}
													{params.row?.orientador ||
														"-"}
												</Typography>
												<Typography variant="body2">
													Banca:{" "}
													{(
														params.row?.banca || []
													).join(", ") || "-"}
												</Typography>
											</Box>
										);
										return (
											<MuiTooltip
												title={title}
												arrow
												placement="top-start"
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
													}}
												>
													{params.value ||
														(params.row?.fase === 1
															? "Projeto"
															: "TCC")}
												</div>
											</MuiTooltip>
										);
									},
								},
								{
									field: "estudante",
									headerName: "Estudante",
									width: 220,
									renderCell: (params) => {
										const title = (
											<Box>
												<Typography variant="subtitle2">
													{params.row?.titulo ||
														"Sem título"}
												</Typography>
												<Typography variant="body2">
													Orientador:{" "}
													{params.row?.orientador ||
														"-"}
												</Typography>
												<Typography variant="body2">
													Banca:{" "}
													{(
														params.row?.banca || []
													).join(", ") || "-"}
												</Typography>
											</Box>
										);
										return (
											<MuiTooltip
												title={title}
												arrow
												placement="top-start"
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														whiteSpace: "normal",
														wordWrap: "break-word",
														lineHeight: 1.2,
														width: "100%",
														padding: "4px 0",
													}}
												>
													{params.value}
												</div>
											</MuiTooltip>
										);
									},
								},
							]}
							pageSize={5}
							checkboxSelection={false}
							disableSelectionOnClick
							rowSpanning={false}
							getRowId={(row) =>
								`${row.data}-${row.hora}-${row.estudante}`
							}
							columnVisibilityModel={{}}
						/>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
