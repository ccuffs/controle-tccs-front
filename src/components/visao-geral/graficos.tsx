import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ConvitesMesPonto, EtapaFaseItem } from "../../types/dashboard";
import { mesCurto } from "../../utils/formatos";
import { ChartTooltip } from "../ui";

/** Barras horizontais "Distribuição por etapa". Sem filtro de fase, prefixa a fase no rótulo. */
export function GraficoEtapas({ itens, comFase }: { itens: EtapaFaseItem[]; comFase: boolean }) {
	const dados = itens.map((i) => ({
		stage: comFase ? `${i.fase === 2 ? "TCC II" : "TCC I"} · ${i.etapa_label}` : i.etapa_label,
		total: i.quantidade,
	}));
	const maximo = Math.max(...dados.map((d) => d.total), 1);
	return (
		<div className="chart-plot bar-chart" style={{ height: Math.max(190, dados.length * 24) }}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={dados} layout="vertical" margin={{ top: 8, right: 28, bottom: 0, left: 4 }} accessibilityLayer>
					<CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
					<XAxis type="number" hide domain={[0, Math.ceil(maximo * 1.1)]} />
					<YAxis
						type="category"
						dataKey="stage"
						axisLine={false}
						tickLine={false}
						width={comFase ? 220 : 125}
						tick={{ fill: "var(--muted)", fontSize: 10 }}
					/>
					<Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip />} />
					<Bar dataKey="total" name="Discentes" fill="var(--teal-500)" radius={[0, 5, 5, 0]} barSize={13}>
						<LabelList dataKey="total" position="right" fill="var(--text)" fontSize={10} fontWeight={700} />
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

/** Linhas "Convites no período" (Orientação × Banca, por mês). */
export function GraficoConvites({ pontos }: { pontos: ConvitesMesPonto[] }) {
	const dados = pontos.map((p) => ({ month: mesCurto(p.mes), orientacao: p.orientacao, banca: p.banca }));
	return (
		<>
			<div className="legend">
				<span>
					<i className="dot teal-dot" />
					Orientação
				</span>
				<span>
					<i className="dot orange-dot" />
					Banca
				</span>
			</div>
			<div className="chart-plot line-chart">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={dados} margin={{ top: 10, right: 8, bottom: 0, left: -25 }} accessibilityLayer>
						<CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
						<XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--subtle)", fontSize: 10 }} />
						<YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: "var(--subtle)", fontSize: 9 }} />
						<Tooltip content={<ChartTooltip />} />
						<Line
							type="monotone"
							dataKey="orientacao"
							name="Orientação"
							stroke="var(--teal-500)"
							strokeWidth={3}
							dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2 }}
							activeDot={{ r: 5 }}
						/>
						<Line
							type="monotone"
							dataKey="banca"
							name="Banca"
							stroke="var(--orange)"
							strokeWidth={3}
							dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2 }}
							activeDot={{ r: 5 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</>
	);
}
