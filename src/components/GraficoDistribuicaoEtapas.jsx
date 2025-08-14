import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Tooltip,
	Legend,
	Cell,
} from "recharts";

export default function GraficoDistribuicaoEtapas({
	dadosEtapas,
	faseLabel,
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
				width: largura || { xs: "100%", md: 436 },
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
					Distribuição por etapa {faseLabel}
				</Typography>
				<Box sx={{ minHeight: 260, flexGrow: 1 }}>
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
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
							<Legend
								verticalAlign="bottom"
								height={24}
								wrapperStyle={{
									color: theme.palette.text.secondary,
								}}
							/>
							<Pie
								data={dadosEtapas}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="45%"
								innerRadius={50}
								outerRadius={80}
								paddingAngle={2}
							>
								{dadosEtapas.map((entry, index) => (
									<Cell
										key={`slice-${index}`}
										fill={
											[
												theme.palette.primary.main,
												theme.palette.secondary.main,
												theme.palette.success.main,
												theme.palette.warning.main,
												theme.palette.info.main,
												theme.palette.error.main,
											][index % 6]
										}
									/>
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
				</Box>
			</CardContent>
		</Card>
	);
}
