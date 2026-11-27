import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useDocenteAtual } from "../../hooks/useDocenteAtual";
import { useConvitesPorMes } from "../../hooks/useVisaoGeral";
import acompanhamentoService from "../../services/acompanhamento-service";
import convitesService from "../../services/convites-service";
import { abrirAta } from "../../services/defesas-acoes";
import visaoGeralService from "../../services/visao-geral-service";
import type { ItemAcompanhamento } from "../../types/acompanhamento";
import type { Convite } from "../../types/convite";
import type { DefesaAgenda, EtapaFaseItem } from "../../types/dashboard";
import { getErrorMessage } from "../../utils/apiError";
import AgendamentoDialog from "../defesas/AgendamentoDialog";
import DefenseList from "../defesas/DefenseList";
import { Button, Card, Icon, KpiCard, PageHeader, PhaseChip, PlainButton, useNotice } from "../ui";
import { GraficoConvites, GraficoEtapas } from "../visao-geral/graficos";

const DIA = 24 * 60 * 60 * 1000;
const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Data/hora da defesa (horário local gravado como UTC) → Date local equivalente. */
const quando = (d: DefesaAgenda) => new Date(`${d.data}T${d.hora}:00`);

/** Página inicial do orientador (imagem visão_geral_orientador.png). */
export default function Inicio() {
	const navigate = useNavigate();
	const notificar = useNotice();
	const { usuario } = useAuth();
	const { selecionado } = usePeriodo();
	const { docente, codigo } = useDocenteAtual();

	const [orientandos, setOrientandos] = useState<ItemAcompanhamento[]>([]);
	const [convites, setConvites] = useState<Convite[]>([]);
	const [defesas, setDefesas] = useState<DefesaAgenda[]>([]);
	const [semDisponibilidade, setSemDisponibilidade] = useState(false);
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);
	const [agendar, setAgendar] = useState<{ defesa: DefesaAgenda | null } | null>(null);

	const filtros = codigo && selecionado ? { ano: selecionado.ano, semestre: selecionado.semestre, codigo_docente: codigo } : null;
	const pontosConvites = useConvitesPorMes(filtros, 6);

	useEffect(() => {
		if (!filtros) return;
		let ativo = true;
		setCarregando(true);
		Promise.allSettled([
			acompanhamentoService.listarAcompanhamento({
				ano: String(filtros.ano),
				semestre: String(filtros.semestre),
				codigo_docente: filtros.codigo_docente,
				limite: 100,
			}),
			convitesService.getConvitesDocente(filtros.codigo_docente),
			visaoGeralService.defesas(filtros),
			visaoGeralService.docentesSemDisponibilidade({ ano: filtros.ano, semestre: filtros.semestre }),
		]).then(([a, c, d, s]) => {
			if (!ativo) return;
			setOrientandos(a.status === "fulfilled" ? a.value.itens.filter((i) => i.orientador?.codigo === filtros.codigo_docente) : []);
			setConvites(c.status === "fulfilled" ? c.value : []);
			setDefesas(d.status === "fulfilled" ? d.value.itens : []);
			setSemDisponibilidade(s.status === "fulfilled" && s.value.itens.some((x) => x.codigo_docente === filtros.codigo_docente));
			const falha = [a, c, d].find((x): x is PromiseRejectedResult => x.status === "rejected");
			if (falha) notificar(getErrorMessage(falha.reason, "Erro ao carregar seus dados"), "error");
			setCarregando(false);
		});
		return () => {
			ativo = false;
		};
	}, [filtros?.ano, filtros?.semestre, filtros?.codigo_docente, recarregar]); // eslint-disable-line react-hooks/exhaustive-deps

	const agora = Date.now();
	const pendentes = convites.filter((c) => c.data_feedback === null);
	const pendentesAntigos = pendentes.filter((c) => agora - new Date(c.data_envio).getTime() > 5 * DIA);
	const proximas = defesas.filter((d) => quando(d).getTime() >= agora - 2 * 60 * 60 * 1000 && quando(d).getTime() <= agora + 30 * DIA);
	const avaliacoesPendentes = defesas.filter(
		(d) => quando(d).getTime() <= agora && d.membros.some((m) => m.codigo === codigo && m.avaliacao === null),
	);
	const vencemHoje = avaliacoesPendentes.filter((d) => d.data === new Date().toISOString().slice(0, 10)).length;
	const emTccII = orientandos.filter((o) => o.fase === 2).length;
	const proxima = proximas[0];

	/** Orientandos sem defesa já agendada — lista usada no diálogo de novo agendamento. */
	const orientandosSemDefesa = useMemo(
		() => orientandos.filter((o) => !defesas.some((d) => d.id_tcc === o.id_tcc && d.fase === o.fase)),
		[orientandos, defesas],
	);

	const etapas: EtapaFaseItem[] = useMemo(() => {
		const mapa = new Map<string, EtapaFaseItem>();
		for (const o of orientandos) {
			const chave = `${o.fase}|${o.etapa_label}`;
			const atual = mapa.get(chave) ?? { fase: o.fase, etapa: o.etapa, etapa_label: o.etapa_label, quantidade: 0 };
			atual.quantidade += 1;
			mapa.set(chave, atual);
		}
		return [...mapa.values()].sort((a, b) => a.fase - b.fase || a.etapa - b.etapa);
	}, [orientandos]);

	const acoes = [
		pendentes.length > 0 && {
			icone: "mail",
			texto: `${pendentes.length} ${pendentes.length === 1 ? "convite aguarda" : "convites aguardam"} sua resposta`,
			acao: "Ver convites",
			destino: "/orientador/convites",
		},
		semDisponibilidade && {
			icone: "calendar_clock",
			texto: "Informe sua disponibilidade para as bancas",
			acao: "Marcar horários",
			destino: "/orientador/disponibilidade",
		},
		avaliacoesPendentes.length > 0 && {
			icone: "fact_check",
			texto: `${avaliacoesPendentes.length} ${avaliacoesPendentes.length === 1 ? "avaliação precisa" : "avaliações precisam"} de notas`,
			acao: "Avaliar",
			destino: "/orientador/avaliacoes",
		},
	].filter(Boolean) as { icone: string; texto: string; acao: string; destino: string }[];

	const primeiroNome = (usuario?.nome ?? "").split(" ")[0]?.toLocaleUpperCase("pt-BR");
	const v = (n: number) => (carregando ? "—" : n);

	return (
		<>
			<PageHeader
				eyebrow={primeiroNome ? `OLÁ, ${primeiroNome}` : undefined}
				title="Seu trabalho hoje"
				description="Veja o que precisa da sua atenção e acompanhe suas próximas atividades."
			/>
			<div className="kpi-grid four">
				<KpiCard icon="school" value={v(orientandos.length)} label="Orientandos" meta={`${emTccII} em TCC II`} tone="teal" />
				<KpiCard
					icon="mail"
					value={v(pendentes.length)}
					label="Convites pendentes"
					meta={pendentesAntigos.length ? `${pendentesAntigos.length} há mais de 5 dias` : "Nenhum atrasado"}
					tone="amber"
				/>
				<KpiCard icon="event" value={v(proximas.length)} label="Próximas defesas" meta="Nos próximos 30 dias" tone="blue" />
				<KpiCard
					icon="edit_note"
					value={v(avaliacoesPendentes.length)}
					label="Avaliações pendentes"
					meta={vencemHoje ? `${vencemHoje} ${vencemHoje === 1 ? "é de hoje" : "são de hoje"}` : "Defesas já realizadas"}
					tone="red"
				/>
			</div>

			<div className="dashboard-grid">
				<Card className="card task-card">
					<div className="card-title">
						<div>
							<h2>Ações pendentes</h2>
							<p>Prioridades para hoje</p>
						</div>
					</div>
					{acoes.length === 0 && !carregando && (
						<p className="section-description" style={{ marginTop: 16 }}>
							Tudo em dia. Nenhuma ação pendente.
						</p>
					)}
					{acoes.map((a) => (
						<PlainButton key={a.texto} onClick={() => navigate(a.destino)}>
							<span className="task-icon">
								<Icon name={a.icone} />
							</span>
							<strong>{a.texto}</strong>
							<span>
								{a.acao} <Icon name="arrow_forward" size={16} />
							</span>
						</PlainButton>
					))}
				</Card>
				<Card className="card mini-agenda">
					<div className="card-title">
						<div>
							<h2>Próxima defesa</h2>
							<p>
								{proxima
									? `${DIAS_SEMANA[quando(proxima).getDay()]}, ${quando(proxima).getDate()} de ${MESES[quando(proxima).getMonth()]}`
									: "Nenhuma defesa nos próximos 30 dias"}
							</p>
						</div>
					</div>
					{proxima && (
						<div className="next-defense">
							<div className="time-block">
								<strong>{proxima.hora}</strong>
								<span>{proxima.papel_docente === "orientador" ? "Orientador" : "Avaliador"}</span>
							</div>
							<div>
								<PhaseChip fase={proxima.fase} />
								<h3>{proxima.estudante}</h3>
								<p>{proxima.titulo}</p>
								<small>
									<Icon name="location_on" size={15} /> {proxima.local || "Local a definir"}
								</small>
							</div>
						</div>
					)}
				</Card>
			</div>

			<div className="dashboard-grid advisor-insights">
				<Card className="card chart-card">
					<div className="card-title">
						<div>
							<h2>Distribuição por etapa</h2>
							<p>
								Seus {orientandos.length} orientandos no período
							</p>
						</div>
					</div>
					<GraficoEtapas itens={etapas} comFase={new Set(etapas.map((e) => e.fase)).size > 1} />
				</Card>
				<Card className="card chart-card">
					<div className="card-title">
						<div>
							<h2>Convites recebidos no período</h2>
							<p>Orientação × Banca</p>
						</div>
					</div>
					<GraficoConvites pontos={pontosConvites} />
				</Card>
			</div>

			<DefenseList
				defesas={proximas}
				limite={5}
				modoDocente
				carregando={carregando}
				acao={
					orientandos.length > 0 ? (
						<Button icon="calendar_add_on" onClick={() => setAgendar({ defesa: null })}>
							Adicionar defesa
						</Button>
					) : undefined
				}
				acoesDetalhe={(d, fechar) =>
					d.papel_docente === "orientador" ? (
						<>
							<Button
								variant="secondary"
								icon="edit_calendar"
								onClick={() => {
									fechar();
									setAgendar({ defesa: d });
								}}
							>
								Editar
							</Button>
							<Button
								variant="secondary"
								icon="picture_as_pdf"
								onClick={() => abrirAta(d.id_tcc, d.fase, d.local).catch((e) => notificar(getErrorMessage(e, "Erro ao gerar a ata."), "error"))}
							>
								Gerar ata
							</Button>
						</>
					) : (
						<>
							<Button variant="secondary" onClick={fechar}>
								Fechar
							</Button>
							<Button icon="fact_check" onClick={() => navigate("/orientador/avaliacoes")}>
								Registrar avaliação
							</Button>
						</>
					)
				}
			/>

			<AgendamentoDialog
				open={Boolean(agendar)}
				defesa={agendar?.defesa ?? null}
				trabalhos={orientandosSemDefesa}
				orientadorFixo={codigo ? { codigo, nome: docente?.nome ?? undefined } : undefined}
				onClose={() => setAgendar(null)}
				onSalvo={() => {
					setAgendar(null);
					setRecarregar((x) => x + 1);
				}}
			/>
		</>
	);
}
