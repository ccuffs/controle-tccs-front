import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	Legend,
} from "recharts";

export default function GraficoConvitesPeriodo({
	dadosConvites,
	faseLabel,
	ticksConvites,
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
				width: largura || { xs: "100%", md: 666 },
			}}
		>
			<CardContent>
				<Typography variant="subtitle1" gutterBottom>
					Convites enviados no período {faseLabel}
				</Typography>
				<Box sx={{ minHeight: 300 }}>
					{dadosConvites && dadosConvites.length > 0 ? (
						<ResponsiveContainer width="100%" height={300}>
							<LineChart
								data={dadosConvites}
								margin={{
									top: 10,
									right: 20,
									left: 0,
									bottom: 0,
								}}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke={theme.palette.divider}
								/>
								<XAxis
									dataKey="data"
									ticks={ticksConvites}
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
									tickFormatter={(v) => {
										if (!v) return v;
										const [y, m, d] = String(v).split("-");
										return `${d}/${m}`;
									}}
								/>
								<YAxis
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
									labelFormatter={(label) => {
										if (!label) return label;
										const [y, m, d] =
											String(label).split("-");
										return `${d}/${m}/${y}`;
									}}
								/>
								<Legend
									wrapperStyle={{
										color: theme.palette.text.secondary,
									}}
								/>
								<Line
									type="monotone"
									dataKey="orientacao"
									name="Orientação"
									stroke={theme.palette.success.main}
									strokeWidth={2}
									dot={false}
								/>
								<Line
									type="monotone"
									dataKey="banca"
									name="Banca"
									stroke={theme.palette.primary.main}
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					) : (
						<Box sx={{ p: 2 }}>
							<Typography variant="body2" color="text.secondary">
								Sem dados de convites no período
							</Typography>
						</Box>
					)}
				</Box>
			</CardContent>
		</Card>
	);
}
