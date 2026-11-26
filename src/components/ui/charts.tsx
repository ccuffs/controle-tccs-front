import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Surface } from "./Card";

interface TooltipItem {
	dataKey?: string | number;
	name?: string | number;
	value?: string | number;
	color?: string;
}

interface ChartTooltipProps {
	active?: boolean;
	payload?: TooltipItem[];
	label?: string | number;
}

/** Tooltip dos gráficos do design (usar em `<Tooltip content={<ChartTooltip />} />`). */
export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
	if (!active || !payload?.length) return null;
	return (
		<Surface className="chart-tooltip">
			<strong>{label}</strong>
			{payload.map((item) => (
				<div key={String(item.dataKey)}>
					<i style={{ background: item.color }} />
					<span>{item.name}</span>
					<b>{item.value}</b>
				</div>
			))}
		</Surface>
	);
}

export interface RankingItem {
	label: string;
	total: number;
}

interface RankingChartProps {
	data: RankingItem[];
	name: string;
	color?: string;
}

/** Barras horizontais com rótulo de valor (rankings por docente, status etc.). */
export function RankingChart({ data, name, color = "var(--teal-500)" }: RankingChartProps) {
	return (
		<div className="chart-plot ranking-chart">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 0, left: 0 }} accessibilityLayer>
					<CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
					<XAxis type="number" hide />
					<YAxis
						type="category"
						dataKey="label"
						axisLine={false}
						tickLine={false}
						width={92}
						tick={{ fill: "var(--muted)", fontSize: 9 }}
					/>
					<Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip />} />
					<Bar dataKey="total" name={name} fill={color} radius={[0, 5, 5, 0]} barSize={12}>
						<LabelList dataKey="total" position="right" fill="var(--text)" fontSize={9} fontWeight={700} />
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
