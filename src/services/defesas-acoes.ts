import orientacaoService from "./orientacao-service";
import { gerarAtaDefesaHtml } from "./avaliar-defesas-service";
import type { Convite } from "../types/convite";
import type { Defesa } from "../types/defesa";

interface Agendamento {
	idTcc: number;
	fase: number;
	orientador: string;
	avaliadores: [string, string];
	data: string; // AAAA-MM-DD
	hora: string; // HH:MM
	local: string;
}

/**
 * Data e hora no mesmo formato gravado pelo agendamento do discente (POST /defesas/agendar):
 * o horário local é salvo como se fosse UTC, e as telas leem com toISOString().
 */
const dataHora = (data: string, hora: string) => `${data}T${hora}:00.000Z`;

async function estadoAtual(idTcc: number, fase: number) {
	const [defesas, convites] = await Promise.all([
		orientacaoService.getDefesasPorTcc(idTcc),
		orientacaoService.getConvites({ id_tcc: idTcc }),
	]);
	const membros = defesas.filter((d: Defesa) => Number(d.fase) === fase && !d.orientador).map((d) => d.membro_banca);
	const convitesBanca = convites
		.filter((c: Convite) => !c.orientacao && Number(c.fase) === fase)
		.map((c) => ({ codigo_docente: c.codigo_docente, aceito: c.aceito }));
	return { membros, convitesBanca };
}

/** Agenda ou altera a defesa (banca, data, hora e local) via POST /defesas/gerenciar-banca. */
export async function salvarAgendamento(a: Agendamento): Promise<void> {
	const { membros, convitesBanca } = await estadoAtual(a.idTcc, a.fase);
	const novos = [...a.avaliadores];
	const alteracoes = membros
		.filter((m) => !novos.includes(m))
		.map((antigo, i) => ({ membro_antigo: antigo, membro_novo: novos.filter((n) => !membros.includes(n))[i] ?? "" }))
		.filter((x) => x.membro_novo);
	await orientacaoService.gerenciarBancaDefesa({
		id_tcc: a.idTcc,
		fase: a.fase,
		membros_novos: novos,
		membros_existentes: membros,
		convites_banca_existentes: convitesBanca,
		alteracoes,
		orientador_codigo: a.orientador,
		data_hora_defesa: dataHora(a.data, a.hora),
		local: a.local,
	});
}

/** Cancela a defesa: mantém a banca e limpa data e local. */
export async function cancelarDefesa(idTcc: number, fase: number): Promise<void> {
	const { membros, convitesBanca } = await estadoAtual(idTcc, fase);
	await orientacaoService.gerenciarBancaDefesa({
		id_tcc: idTcc,
		fase,
		membros_novos: membros,
		membros_existentes: membros,
		convites_banca_existentes: convitesBanca,
		data_hora_defesa: null,
		local: null,
	});
}

/** Abre a ata em nova aba (mesmo comportamento da tela de avaliações). */
export async function abrirAta(idTcc: number, fase: number, local: string | null): Promise<void> {
	const aba = window.open("", "_blank");
	if (!aba) throw new Error("Permita pop-ups para visualizar a ata.");
	const html = await gerarAtaDefesaHtml(idTcc, fase, local ?? "");
	aba.document.write(html);
	aba.document.close();
}

export interface EventoHistorico {
	data: string;
	titulo: string;
	detalhe?: string;
}

/** Linha do tempo da defesa a partir de convites e linhas de defesa (sem tabela de auditoria). */
export async function historicoDefesa(idTcc: number, fase: number): Promise<EventoHistorico[]> {
	const [defesas, convites] = await Promise.all([
		orientacaoService.getDefesasPorTcc(idTcc),
		orientacaoService.getConvites({ id_tcc: idTcc }),
	]);
	const eventos: EventoHistorico[] = [];
	for (const c of convites.filter((x) => Number(x.fase) === fase)) {
		const quem = c.docente?.nome ?? c.codigo_docente;
		const tipo = c.orientacao ? "orientação" : "banca";
		eventos.push({ data: c.data_envio, titulo: `Convite de ${tipo} enviado`, detalhe: quem });
		if (c.data_feedback) {
			eventos.push({ data: c.data_feedback, titulo: `Convite de ${tipo} ${c.aceito ? "aceito" : "recusado"}`, detalhe: quem });
		}
	}
	const linhas = defesas.filter((d) => Number(d.fase) === fase) as (Defesa & { createdAt?: string; updatedAt?: string })[];
	const criada = linhas.map((d) => d.createdAt).filter((x): x is string => Boolean(x)).sort()[0];
	if (criada) eventos.push({ data: criada, titulo: "Banca registrada" });
	const avaliacoes = linhas.filter((d) => d.avaliacao !== null && d.updatedAt);
	for (const d of avaliacoes) {
		eventos.push({ data: d.updatedAt as string, titulo: "Avaliação registrada", detalhe: d.membroBanca?.nome ?? d.membro_banca });
	}
	return eventos.sort((a, b) => b.data.localeCompare(a.data));
}
