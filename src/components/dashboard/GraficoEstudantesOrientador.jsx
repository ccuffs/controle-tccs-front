import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	Cell,
} from "recharts";

export default function GraficoEstudantesOrientador({
	dadosGraficoOrientador,
	faseLabel,
	largura,
}) {
	const theme = useTheme();

	const dadosBarra = [
		{
			nome: "Com orientador",
			valor: dadosGraficoOrientador.comOrientador,
		},
		{
			nome: "Sem orientador",
			valor: Math.max(
				0,
				(dadosGraficoOrientador.total || 0) -
					(dadosGraficoOrientador.comOrientador || 0),
			),
		},
	];

	return (
		<Card
			sx={{
				backgroundColor: theme.palette.background.default,
				height: "100%",
				display: "flex",
				flexDirection: "column",
				width: largura || { xs: "100%", md: 406 },
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
					Estudantes com orientador definido{faseLabel}
				</Typography>
				<Box sx={{ minHeight: 260, flexGrow: 1 }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={dadosBarra}>
							<CartesianGrid
								stroke={theme.palette.divider}
								strokeDasharray="3 3"
								fill={theme.palette.background.default}
							/>
							<XAxis
								dataKey="nome"
								tick={{
									fill: theme.palette.text.secondary,
								}}
								axisLine={{
									stroke: theme.palette.divider,
								}}
								tickLine={{
									stroke: theme.palette.divider,
								}}
							/>
							<YAxis
								allowDecimals={false}
								tick={{
									fill: theme.palette.text.secondary,
								}}
								axisLine={{
									stroke: theme.palette.divider,
								}}
								tickLine={{
									stroke: theme.palette.divider,
								}}
							/>
							<Tooltip
								wrapperStyle={{
									outline: "none",
								}}
								contentStyle={{
									backgroundColor:
										theme.palette.background.paper,
									border: `1px solid ${theme.palette.divider}`,
									color: theme.palette.text.primary,
								}}
								labelStyle={{
									color: theme.palette.text.secondary,
								}}
								itemStyle={{
									color: theme.palette.text.primary,
								}}
							/>
							<Bar dataKey="valor" radius={[4, 4, 0, 0]}>
								{dadosBarra.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={
											entry.nome === "Com orientador"
												? theme.palette.primary.main
												: theme.palette.success.main
										}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</Box>
				<Typography variant="caption" color="text.secondary">
					Total: {dadosGraficoOrientador.total} | Com orientador:{" "}
					{dadosGraficoOrientador.comOrientador}
				</Typography>
			</CardContent>
		</Card>
	);
}
