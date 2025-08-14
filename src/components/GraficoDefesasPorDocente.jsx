import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
} from "recharts";

export default function GraficoDefesasPorDocente({
	dadosDefesasDocentes,
	faseLabel,
	alturaDefesas,
	largura,
}) {
	const theme = useTheme();

	return (
		<Card
			sx={{
				backgroundColor: theme.palette.background.default,
				height: "100%",
				display: "flex",
				flexDirection: "column",
				width: largura || { xs: "100%", md: 695 },
			}}
		>
			<CardContent>
				<Typography variant="subtitle1" gutterBottom>
					Bancas aceitas por docente {faseLabel}
				</Typography>
				<Box sx={{ minHeight: 400 }}>
					<ResponsiveContainer width="100%" height={alturaDefesas}>
						<BarChart
							data={[...dadosDefesasDocentes].sort((a, b) =>
								String(a.docente).localeCompare(
									String(b.docente),
									"pt",
									{
										sensitivity: "base",
									},
								),
							)}
							layout="vertical"
							margin={{
								top: 8,
								right: 8,
								left: 2,
								bottom: 8,
							}}
							barCategoryGap="12%"
							barGap={-2}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke={theme.palette.divider}
							/>
							<XAxis
								type="number"
								allowDecimals={false}
								tick={{
									fill: theme.palette.text.secondary,
									fontSize: 11,
								}}
								axisLine={{
									stroke: theme.palette.divider,
								}}
								tickLine={{
									stroke: theme.palette.divider,
								}}
							/>
							<YAxis
								type="category"
								dataKey="docente"
								width={160}
								tick={{
									fill: theme.palette.text.secondary,
									fontSize: 11,
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
							<Bar
								dataKey="quantidade"
								radius={[0, 4, 4, 0]}
								fill={theme.palette.secondary.main}
							/>
						</BarChart>
					</ResponsiveContainer>
				</Box>
			</CardContent>
		</Card>
	);
}
