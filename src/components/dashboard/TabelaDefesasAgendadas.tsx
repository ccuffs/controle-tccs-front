import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import MuiTooltip from "@mui/material/Tooltip";
import type { GridColDef } from "@mui/x-data-grid";

import CustomDataGrid from "../customs/CustomDataGrid";
import type { DefesaAgendada } from "../../types/dashboard";

interface TabelaDefesasAgendadasProps {
	defesasAgendadas: DefesaAgendada[];
	largura?: ResponsiveStyleValue<string | number>;
}

export default function TabelaDefesasAgendadas({ defesasAgendadas, largura }: TabelaDefesasAgendadasProps) {
	const theme = useTheme();

	const tituloTooltip = (row: DefesaAgendada) => (
		<Box>
			<Typography variant="subtitle2">
				{row?.titulo || "Sem título"}
			</Typography>
			<Typography variant="body2">
				Orientador: {row?.orientador || "-"}
			</Typography>
			<Typography variant="body2">
				Banca: {(row?.banca || []).join(", ") || "-"}
			</Typography>
		</Box>
	);

	const columns: GridColDef<DefesaAgendada>[] = [
		{
			field: "data",
			headerName: "Data",
			width: 110,
			renderCell: (params) => {
				const [y, m, d] = String(
					params.value || "",
				).split("-");
				return (
					<MuiTooltip
						title={tituloTooltip(params.row)}
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
			renderCell: (params) => (
				<MuiTooltip
					title={tituloTooltip(params.row)}
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
			),
		},
		{
			field: "fase_label",
			headerName: "Fase",
			width: 120,
			renderCell: (params) => (
				<MuiTooltip
					title={tituloTooltip(params.row)}
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
			),
		},
		{
			field: "estudante",
			headerName: "Estudante",
			width: 220,
			renderCell: (params) => (
				<MuiTooltip
					title={tituloTooltip(params.row)}
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
			),
		},
	];

	return (
		<Card
			sx={{
				backgroundColor: theme.palette.background.default,
				height: 360,
				display: "flex",
				flexDirection: "column",
				width: largura || { xs: "100%", md: 560 },
			}}
		>
			<CardContent
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
					padding: "16px",
					"&:last-child": { paddingBottom: "16px" },
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
					<Box
						sx={{
							mt: 1,
							flexGrow: 1,
							overflow: "auto",
							maxHeight: "calc(360 - 80px)", // 360px - altura do título e padding
						}}
					>
						<CustomDataGrid
							rows={defesasAgendadas}
							columns={columns}
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
