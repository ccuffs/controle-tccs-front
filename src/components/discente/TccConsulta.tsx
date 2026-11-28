import { rotuloPeriodo } from "../../contexts/PeriodoContext";
import { useTccDiscente } from "../../hooks/useTccDiscente";
import type { AnoSemestre } from "../../types/dashboard";
import type { Defesa } from "../../types/defesa";
import { rotuloEtapa } from "../../utils/etapas";
import { EmptyState, Icon, PhaseChip, StatusChip, Surface } from "../ui";

const nota = (n: number | null) =>
	n === null ? "—" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const dataBr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : null);

/**
 * "Meu TCC" de um período anterior escolhido no seletor do topo: só leitura (título, orientação,
 * etapa, banca, defesa e notas). A jornada só existe na oferta atual.
 */
export default function TccConsulta({ periodo }: { periodo: AnoSemestre }) {
	const { tcc, carregando } = useTccDiscente();
	const rotulo = rotuloPeriodo(periodo);

	if (carregando) {
		return (
			<Surface className="card journey-content">
				<p>Carregando…</p>
			</Surface>
		);
	}

	if (!tcc) {
		return (
			<Surface className="card">
				<EmptyState
					icon="history"
					title={`Você não tinha TCC em ${rotulo}`}
					text="Escolha outro período no seletor do topo para consultar seus TCCs anteriores."
				/>
			</Surface>
		);
	}

	const orientador = (tcc.orientacoes ?? tcc.Orientacoes ?? []).find((o) => o.orientador)?.docente;
	const defesas: Defesa[] = (tcc.defesas ?? tcc.Defesas ?? []).filter((d) => Number(d.fase) === Number(tcc.fase));
	const banca = defesas.filter((d) => !d.orientador);
	const dataDefesa = dataBr(defesas.find((d) => d.data_defesa)?.data_defesa ?? null);
	const notas = defesas.map((d) => d.avaliacao).filter((n): n is number => n !== null);
	const media = notas.length ? notas.reduce((a, b) => a + Number(b), 0) / notas.length : null;
	const aprovado = tcc.fase === 2 ? tcc.aprovado_tcc : tcc.aprovado_projeto;

	return (
		<>
			<Surface className="student-offer card">
				<div>
					<span>CONSULTA · {rotulo}</span>
					<h1>{tcc.fase === 2 ? "TCC (TCC II)" : "Projeto (TCC I)"}</h1>
					<p>{[tcc.curso?.nome, rotulo].filter(Boolean).join(" · ")}</p>
				</div>
				<StatusChip type={aprovado ? "success" : "neutral"}>{aprovado ? "Aprovado" : rotuloEtapa(tcc.etapa ?? 0, tcc.fase)}</StatusChip>
			</Surface>
			<div className="inline-banner" role="status" style={{ margin: "0 0 16px", alignItems: "center" }}>
				<Icon name="visibility" size={18} />
				<span>Você está consultando um período anterior; nada pode ser alterado aqui. Para seguir com seu TCC, volte ao período atual no topo.</span>
			</div>
			<Surface component="section" className="card" style={{ padding: 24 }}>
				<div className="orientation-content-preview" style={{ margin: 0 }}>
					<div>
						<span>PERÍODO</span>
						<strong>
							{rotulo} · <PhaseChip fase={tcc.fase} />
						</strong>
					</div>
					<div>
						<span>ORIENTADOR</span>
						<strong>{orientador?.nome ?? orientador?.codigo ?? "—"}</strong>
					</div>
					{tcc.titulo && (
						<div>
							<span>TÍTULO</span>
							<strong>{tcc.titulo}</strong>
						</div>
					)}
					{tcc.tema && (
						<div>
							<span>TEMA</span>
							<p>{tcc.tema}</p>
						</div>
					)}
					{tcc.resumo && (
						<div>
							<span>RESUMO</span>
							<p>{tcc.resumo}</p>
						</div>
					)}
					<div>
						<span>DEFESA</span>
						<strong>{dataDefesa ?? "Não agendada"}</strong>
					</div>
					<div>
						<span>BANCA</span>
						{banca.length ? (
							<p>
								{banca
									.map((d) => `${d.membroBanca?.nome ?? d.membro_banca}${d.avaliacao !== null ? ` (${nota(d.avaliacao)})` : ""}`)
									.join(" · ")}
							</p>
						) : (
							<p>—</p>
						)}
					</div>
					<div>
						<span>NOTA MÉDIA</span>
						<strong>{nota(media)}</strong>
					</div>
				</div>
			</Surface>
		</>
	);
}
