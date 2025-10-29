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

export default function GraficoConvitesOrientacao({
	convitesOrientacaoStatus,
	faseLabel,
	largura,
}) {
	const theme = useTheme();

	const dadosConvitesDonut = [
		{
			name: "Respondidos",
			value: convitesOrientacaoStatus.respondidos,
		},
		{ name: "Pendentes", value: convitesOrientacaoStatus.pendentes },
	];

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
			<CardContent>
				<Typography variant="subtitle1" gutterBottom>
					Convites para orientação {faseLabel}
				</Typography>
				<Box sx={{ minHeight: 260 }}>
					{convitesOrientacaoStatus.total > 0 ? (
						<ResponsiveContainer width="100%" height={260}>
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
								<Legend verticalAlign="bottom" height={24} />
								<Pie
									data={dadosConvitesDonut}
									dataKey="value"
									nameKey="name"
									cx="50%"
									cy="45%"
									innerRadius={50}
									outerRadius={80}
									paddingAngle={2}
								>
									{dadosConvitesDonut.map((entry, index) => (
										<Cell
											key={`slice-status-${index}`}
											fill={
												index === 0
													? theme.palette.primary.main
													: theme.palette.warning.main
											}
										/>
									))}
								</Pie>
							</PieChart>
						</ResponsiveContainer>
					) : (
						<Box sx={{ p: 2 }}>
							<Typography variant="body2" color="text.secondary">
								Sem convites para orientação
							</Typography>
						</Box>
					)}
				</Box>
				<Typography variant="caption" color="text.secondary">
					Total: {convitesOrientacaoStatus.total || 0}
				</Typography>
			</CardContent>
		</Card>
	);
}
