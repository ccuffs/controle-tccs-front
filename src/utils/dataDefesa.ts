/**
 * Convenção de `defesa.data_defesa`: o horário local da defesa é gravado como se
 * fosse UTC (ex.: defesa às 14:00 → "…T14:00:00.000Z"). É o formato usado pelo
 * agendamento do discente, pela API (ata, declarações, dashboard) e pelas telas novas.
 */

const dois = (n: number) => String(n).padStart(2, "0");

/** Valor da API → Date local com o mesmo dia e horário (para componentes de data/hora). */
export function dataDefesaParaLocal(valor: string | Date): Date {
	const d = new Date(valor);
	return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
}

/** Date local escolhida na tela → valor para a API, mantendo o horário digitado. */
export function dataDefesaParaApi(data: Date): string {
	return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}:00.000Z`;
}
