import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";
import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Tooltip,
	Legend,
	Cell,
} from "recharts";

export default function GraficoConvitesBanca({
	convitesBancaStatus,
	faseLabel,
	largura,
}) {
	const theme = useTheme();

	const dadosConvitesBancaDonut = [
		{ name: "Respondidos", value: convitesBancaStatus.respondidos },
		{ name: "Pendentes", value: convitesBancaStatus.pendentes },
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
					Convites de banca {faseLabel}
				</Typography>
				<Box sx={{ minHeight: 260 }}>
					{convitesBancaStatus.total > 0 ? (
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
									data={dadosConvitesBancaDonut}
									dataKey="value"
									nameKey="name"
									cx="50%"
									cy="45%"
									innerRadius={50}
									outerRadius={80}
									paddingAngle={2}
								>
									{dadosConvitesBancaDonut.map(
										(entry, index) => (
											<Cell
												key={`slice-banca-status-${index}`}
												fill={
													index === 0
														? theme.palette.primary
																.main
														: theme.palette.warning
																.main
												}
											/>
										),
									)}
								</Pie>
							</PieChart>
						</ResponsiveContainer>
					) : (
						<Box sx={{ p: 2 }}>
							<Typography variant="body2" color="text.secondary">
								Sem convites de banca
							</Typography>
						</Box>
					)}
				</Box>
				<Typography variant="caption" color="text.secondary">
					Total: {convitesBancaStatus.total || 0}
				</Typography>
			</CardContent>
		</Card>
	);
}
