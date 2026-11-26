import { Card } from "./Card";
import { Icon } from "./Icon";

export type KpiTone = "teal" | "blue" | "green" | "amber" | "red";

interface KpiCardProps {
	icon: string;
	value: string | number;
	label: string;
	meta?: string;
	tone?: KpiTone;
}

export function KpiCard({ icon, value, label, meta, tone = "teal" }: KpiCardProps) {
	return (
		<Card className="card kpi-card">
			<div className={`kpi-icon ${tone}`}>
				<Icon name={icon} />
			</div>
			<div>
				<div className="kpi-value">{value}</div>
				<div className="kpi-label">{label}</div>
				{meta && <div className="kpi-meta">{meta}</div>}
			</div>
		</Card>
	);
}
