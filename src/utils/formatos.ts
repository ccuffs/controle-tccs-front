const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_TITULO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** "2026-06-18" → "18/06/2026". */
export function dataBr(iso: string | null | undefined): string {
	if (!iso) return "—";
	const [ano, mes, dia] = iso.slice(0, 10).split("-");
	return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

/** "2026-06-20" → "20 jun". */
export function diaMes(iso: string | null | undefined): string {
	if (!iso) return "—";
	const [, mes, dia] = iso.slice(0, 10).split("-");
	return `${Number(dia)} ${MESES_CURTOS[Number(mes) - 1] ?? ""}`.trim();
}

/** "2026-06" → "Jun". */
export function mesCurto(chave: string): string {
	return MESES_TITULO[Number(chave.slice(5, 7)) - 1] ?? chave;
}

/** Primeiro e último nome ("Andrei De Almeida Sampaio Braga" → "Andrei Braga"). */
export function nomeCurto(nome: string): string {
	const partes = nome.trim().split(/\s+/);
	return partes.length <= 2 ? nome.trim() : `${partes[0]} ${partes[partes.length - 1]}`;
}

/** Número com sinal: 12 → "+12", -3 → "−3". */
export function comSinal(valor: number, casas = 0): string {
	const texto = Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
	return `${valor < 0 ? "−" : "+"}${texto}`;
}

export function percentual(valor: number): string {
	return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}
