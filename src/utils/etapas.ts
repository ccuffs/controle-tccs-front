/**
 * Espelho de controle-tccs-api/src/common/etapas-tcc.ts (rótulos das etapas).
 * 6 no TCC I e 9 no TCC II = "Defesa agendada" (gravado pelo "Finalizar" do stepper).
 */
const ETAPAS: Record<number, string> = {
	0: "Convite para orientador",
	1: "Tema",
	2: "Título",
	3: "Resumo",
	4: "Convite para banca do projeto",
	5: "Agendamento da defesa do projeto",
	6: "Seminário de andamento",
	7: "Convite para banca final",
	8: "Agendamento da defesa final",
};

const FIM_DA_FASE: Record<number, number> = { 1: 5, 2: 8 };

export function rotuloEtapa(etapa: number, fase: number): string {
	const fim = FIM_DA_FASE[fase];
	if (fim !== undefined && etapa > fim) return "Defesa agendada";
	return ETAPAS[etapa] ?? `Etapa ${etapa}`;
}

/** Etapas oferecidas no seletor (mesmo intervalo do seletor atual: 0–6 no TCC I, 0–9 no TCC II). */
export function opcoesEtapa(fase: number): { valor: number; rotulo: string }[] {
	const maximo = fase === 2 ? 9 : 6;
	return Array.from({ length: maximo + 1 }, (_, valor) => ({ valor, rotulo: `${valor} · ${rotuloEtapa(valor, fase)}` }));
}

/** Progresso (0–100) dentro da fase, igual ao calculado pela API (common/etapas-tcc.ts). */
export function progressoEtapa(fase: number, etapa: number, aprovado: boolean): number {
	if (aprovado) return 100;
	const inicio = fase === 2 ? 6 : 0;
	const fim = FIM_DA_FASE[fase] ?? 5;
	const passos = fim - inicio + 2;
	const posicao = Math.min(Math.max(etapa - inicio, 0), passos - 1);
	return Math.round((posicao / passos) * 100);
}
