const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/** Bloco de data (dia + mês abreviado). Aceita "AAAA-MM-DD" ou Date. */
export function DateTile({ data }: { data: string | Date }) {
	const texto = typeof data === "string" ? data.slice(0, 10) : data.toISOString().slice(0, 10);
	const [, mes, dia] = texto.split("-");
	return (
		<div className="date-tile">
			<strong>{dia}</strong>
			<span>{MESES[Number(mes) - 1] ?? ""}</span>
		</div>
	);
}
