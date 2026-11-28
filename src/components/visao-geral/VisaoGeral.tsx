import { useState } from "react";
import { useNavigate } from "react-router";
import { usePerfilAtual } from "../../hooks/usePerfilAtual";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { nomeCurso, useCursosCoordenacao } from "../../hooks/useCursosCoordenacao";
import { useConvitesPorMes, useVisaoGeral } from "../../hooks/useVisaoGeral";
import type { FiltrosPainel } from "../../services/visao-geral-service";
import type { PorDocenteItem } from "../../types/dashboard";
import { comSinal, nomeCurto, percentual } from "../../utils/formatos";
import DefenseList from "../defesas/DefenseList";
import {
	ActionIconButton,
	AvisoPeriodoUnico,
	Button,
	Card,
	FilterBar,
	FilterField,
	Icon,
	KpiCard,
	PageHeader,
	RankingChart,
	Select,
	useNotice,
} from "../ui";
import { GraficoConvites, GraficoEtapas } from "./graficos";
import RequerAtencao from "./RequerAtencao";

const TODOS = "__todos__";

function ranking(itens: PorDocenteItem[], crescente: boolean) {
	return [...itens]
		.sort((a, b) => (crescente ? a.quantidade - b.quantidade : b.quantidade - a.quantidade))
		.slice(0, 5)
		.map((i) => ({ label: nomeCurto(i.nome || i.codigo_docente), total: i.quantidade }));
}

/** Visão geral do coordenador (imagem visao_geral_coordenador.png). */
export default function VisaoGeral() {
	const navigate = useNavigate();
	// Coordenador ou Administrador (mesmas telas): os atalhos ficam no perfil em que se está.
	const perfil = usePerfilAtual() ?? "coordenacao";
	const notificar = useNotice();
	const { periodoEfetivo: selecionado } = usePeriodo();
	const { cursos, padrao } = useCursosCoordenacao();

	const [curso, setCurso] = useState<string | null>(null);
	const [fase, setFase] = useState("");
	const [meses, setMeses] = useState(6);
	const [ordemOrientandos, setOrdemOrientandos] = useState(false);
	const [ordemBancas, setOrdemBancas] = useState(false);

	const cursoEfetivo = curso ?? padrao;
	const filtros: FiltrosPainel | null = selecionado
		? { ano: selecionado.ano, semestre: selecionado.semestre, id_curso: cursoEfetivo, fase }
		: null;

	const { dados, carregando } = useVisaoGeral(filtros, (m) => notificar(m, "error"));
	const pontosConvites = useConvitesPorMes(filtros, meses);

	const limpar = () => {
		setCurso(null);
		setFase("");
	};

	const o = dados.orientadores;
	const anterior = o?.periodo_anterior ? `${o.periodo_anterior.ano}/${o.periodo_anterior.semestre}` : null;
	const pendentes = (dados.convitesOrientacao?.pendentes ?? 0) + (dados.convitesBanca?.pendentes ?? 0);
	const antigos = (dados.convitesOrientacao?.pendentes_antigos ?? 0) + (dados.convitesBanca?.pendentes_antigos ?? 0);
	const diasPendencia = dados.convitesOrientacao?.dias_pendencia ?? 5;
	const totalEtapas = dados.etapas.reduce((soma, e) => soma + e.quantidade, 0);
	const v = (valor: string | number | undefined | null) => (carregando || valor === undefined || valor === null ? "—" : valor);

	return (
		<>
			<PageHeader
				eyebrow="COORDENAÇÃO DE CURSO"
				title="Visão geral"
				description="Acompanhe o período letivo e antecipe as pendências do curso."
				action={
					<span title="Exportação do relatório em breve">
						<Button icon="download" disabled>
							Exportar relatório
						</Button>
					</span>
				}
			/>
			<AvisoPeriodoUnico />

			<FilterBar onClear={limpar}>
				<FilterField label="Curso">
					<Select value={cursoEfetivo || TODOS} onChange={(e) => setCurso(e.target.value === TODOS ? "" : e.target.value)}>
						{cursos.length !== 1 && <option value={TODOS}>Todos os cursos</option>}
						{cursos.map((c) => (
							<option key={c.id} value={String(c.id)}>
								{nomeCurso(c)}
							</option>
						))}
					</Select>
				</FilterField>
				<FilterField label="Fase">
					<Select value={fase || TODOS} onChange={(e) => setFase(e.target.value === TODOS ? "" : e.target.value)}>
						<option value={TODOS}>Todas as fases</option>
						<option value="1">Projeto (TCC I)</option>
						<option value="2">TCC (TCC II)</option>
					</Select>
				</FilterField>
			</FilterBar>

			<RequerAtencao estudantes={dados.estudantesPendentes} docentes={dados.docentesSemDisponibilidade} />

			<div className="kpi-grid">
				<KpiCard
					icon="groups"
					value={v(o?.total)}
					label="Discentes"
					meta={o?.variacao_total !== null && o?.variacao_total !== undefined && anterior ? `${comSinal(o.variacao_total)} desde ${anterior}` : "Neste período"}
					tone="teal"
				/>
				<KpiCard
					icon="handshake"
					value={o ? v(percentual(o.percentual)) : "—"}
					label="Com orientador"
					meta={
						o?.variacao_percentual !== null && o?.variacao_percentual !== undefined && anterior
							? `${comSinal(o.variacao_percentual, 1)} p.p. desde ${anterior}`
							: `${o?.comOrientador ?? 0} de ${o?.total ?? 0} discentes`
					}
					tone="blue"
				/>
				<KpiCard icon="event_available" value={v(dados.defesas.length)} label="Defesas agendadas" meta="Próximos 30 dias" tone="green" />
				<KpiCard
					icon="mark_email_unread"
					value={v(pendentes)}
					label="Convites pendentes"
					meta={`${antigos} há mais de ${diasPendencia} dias`}
					tone="amber"
				/>
				<KpiCard
					icon="calendar_clock"
					value={v(dados.docentesSemDisponibilidade.length)}
					label="Sem disponibilidade"
					meta={dados.docentesSemDisponibilidade.length > 0 ? "Ação necessária" : "Todos informaram"}
					tone="red"
				/>
			</div>

			<div className="dashboard-grid">
				<Card className="card chart-card">
					<div className="card-title">
						<div>
							<h2>Distribuição por etapa</h2>
							<p>{totalEtapas} discentes no período</p>
						</div>
					</div>
					<GraficoEtapas itens={dados.etapas} comFase={!fase} />
				</Card>
				<Card className="card chart-card">
					<div className="card-title">
						<div>
							<h2>Convites no período</h2>
							<p>Orientação × Banca</p>
						</div>
						<Select value={String(meses)} onChange={(e) => setMeses(Number(e.target.value))} aria-label="Período do gráfico">
							<option value="6">Últimos 6 meses</option>
							<option value="12">Últimos 12 meses</option>
						</Select>
					</div>
					<GraficoConvites pontos={pontosConvites} />
				</Card>
			</div>

			<div className="insight-grid">
				<Card className="card chart-card compact-chart-card">
					<div className="card-title">
						<div>
							<h2>Estudantes com orientador definido</h2>
							<p>{o ? `${percentual(o.percentual)} dos ${o.total} discentes` : "—"}</p>
						</div>
					</div>
					<RankingChart
						data={[
							{ label: "Com orientador", total: o?.comOrientador ?? 0 },
							{ label: "Sem orientador", total: Math.max((o?.total ?? 0) - (o?.comOrientador ?? 0), 0) },
						]}
						name="Discentes"
					/>
				</Card>
				<Card className="card chart-card compact-chart-card">
					<div className="card-title">
						<div>
							<h2>Orientandos por docente</h2>
							<p>{ordemOrientandos ? "Menos orientandos no período" : "Ordenado por quantidade no período"}</p>
						</div>
						<ActionIconButton
							className="icon-button"
							aria-label="Inverter ordenação"
							onClick={() => setOrdemOrientandos((x) => !x)}
						>
							<Icon name="sort" />
						</ActionIconButton>
					</div>
					<RankingChart data={ranking(dados.orientandosPorDocente, ordemOrientandos)} name="Orientandos" />
				</Card>
				<Card className="card chart-card compact-chart-card">
					<div className="card-title">
						<div>
							<h2>Bancas aceitas por docente</h2>
							<p>Participações confirmadas em {selecionado ? `${selecionado.ano}/${selecionado.semestre}` : "—"}</p>
						</div>
						<ActionIconButton className="icon-button" aria-label="Inverter ordenação" onClick={() => setOrdemBancas((x) => !x)}>
							<Icon name="sort" />
						</ActionIconButton>
					</div>
					<RankingChart data={ranking(dados.bancasPorDocente, ordemBancas)} color="var(--orange)" name="Bancas aceitas" />
				</Card>
			</div>

			<DefenseList
				defesas={dados.defesas}
				limite={5}
				carregando={carregando}
				acao={
					<Button variant="tertiary" onClick={() => navigate(`/${perfil}/defesas`)}>
						Ver agenda
					</Button>
				}
				vazio={{ titulo: "Nenhuma defesa nos próximos 30 dias", texto: "Não há defesas agendadas para os filtros selecionados." }}
			/>
		</>
	);
}
