import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useDocenteAtual } from "../../hooks/useDocenteAtual";
import { useConvitesPorMes } from "../../hooks/useVisaoGeral";
import convitesService from "../../services/convites-service";
import visaoGeralService from "../../services/visao-geral-service";
import type { Convite } from "../../types/convite";
import type { DefesaAgenda } from "../../types/dashboard";
import { getErrorMessage } from "../../utils/apiError";
import DefenseList from "../defesas/DefenseList";
import { AvisoPeriodoUnico, Button, Card, Icon, KpiCard, PageHeader, PhaseChip, PlainButton, useNotice } from "../ui";
import { GraficoConvites } from "../visao-geral/graficos";

const DIA = 24 * 60 * 60 * 1000;
const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Data/hora da defesa (horário local gravado como UTC) → Date local equivalente. */
const quando = (d: DefesaAgenda) => new Date(`${d.data}T${d.hora}:00`);
const nomeDiscente = (c: Convite) => c.trabalhoConclusao?.dicente?.nome ?? c.trabalhoConclusao?.matricula ?? "Discente";

/**
 * Página inicial do perfil Banca: docente que só participa de bancas (sem orientandos).
 * Mesmo desenho do Início do orientador, sem a parte de orientação.
 */
export default function Inicio() {
	const navigate = useNavigate();
	const notificar = useNotice();
	const { usuario } = useAuth();
	const { periodoEfetivo: selecionado } = usePeriodo();
	const { codigo } = useDocenteAtual();

	const [convites, setConvites] = useState<Convite[]>([]);
	const [defesas, setDefesas] = useState<DefesaAgenda[]>([]);
	const [semDisponibilidade, setSemDisponibilidade] = useState(false);
	const [carregando, setCarregando] = useState(true);

	const filtros = codigo && selecionado ? { ano: selecionado.ano, semestre: selecionado.semestre, codigo_docente: codigo } : null;
	const pontosConvites = useConvitesPorMes(filtros, 6);

	useEffect(() => {
		if (!filtros) return;
		let ativo = true;
		setCarregando(true);
		Promise.allSettled([
			convitesService.getConvitesDocente(filtros.codigo_docente, { ano: filtros.ano, semestre: filtros.semestre }),
			visaoGeralService.defesas(filtros),
			visaoGeralService.docentesSemDisponibilidade({ ano: filtros.ano, semestre: filtros.semestre }),
		]).then(([c, d, s]) => {
			if (!ativo) return;
			setConvites(c.status === "fulfilled" ? c.value.filter((x) => !x.orientacao) : []);
			setDefesas(d.status === "fulfilled" ? d.value.itens : []);
			setSemDisponibilidade(s.status === "fulfilled" && s.value.itens.some((x) => x.codigo_docente === filtros.codigo_docente));
			const falha = [c, d].find((x): x is PromiseRejectedResult => x.status === "rejected");
			if (falha) notificar(getErrorMessage(falha.reason, "Erro ao carregar seus dados"), "error");
			setCarregando(false);
		});
		return () => {
			ativo = false;
		};
	}, [filtros?.ano, filtros?.semestre, filtros?.codigo_docente]); // eslint-disable-line react-hooks/exhaustive-deps

	const agora = Date.now();
	const pendentes = convites.filter((c) => c.data_feedback === null);
	const pendentesAntigos = pendentes.filter((c) => agora - new Date(c.data_envio).getTime() > 5 * DIA);
	const respondidos = convites.filter((c) => c.data_feedback !== null);
	const aceitos = respondidos.filter((c) => c.aceito);
	const proximas = defesas.filter((d) => quando(d).getTime() >= agora - 2 * 60 * 60 * 1000 && quando(d).getTime() <= agora + 30 * DIA);
	const realizadas = defesas.filter((d) => quando(d).getTime() < agora).length;
	const proxima = proximas[0];

	const acoes = [
		pendentes.length > 0 && {
			icone: "mail",
			texto: `${pendentes.length} ${pendentes.length === 1 ? "convite aguarda" : "convites aguardam"} sua resposta`,
			acao: "Ver convites",
			destino: "/banca/convites",
		},
		semDisponibilidade && {
			icone: "calendar_clock",
			texto: "Informe sua disponibilidade para as bancas",
			acao: "Marcar horários",
			destino: "/banca/disponibilidade",
		},
	].filter(Boolean) as { icone: string; texto: string; acao: string; destino: string }[];

	const primeiroNome = (usuario?.nome ?? "").split(" ")[0]?.toLocaleUpperCase("pt-BR");
	const v = (n: number) => (carregando ? "—" : n);

	return (
		<>
			<PageHeader
				eyebrow={primeiroNome ? `OLÁ, ${primeiroNome}` : undefined}
				title="Suas bancas"
				description="Responda aos convites, informe seus horários e acompanhe as defesas de que você participa."
			/>
			<AvisoPeriodoUnico />
			<div className="kpi-grid four">
				<KpiCard
					icon="mail"
					value={v(pendentes.length)}
					label="Convites pendentes"
					meta={pendentesAntigos.length ? `${pendentesAntigos.length} há mais de 5 dias` : "Nenhum atrasado"}
					tone="amber"
				/>
				<KpiCard icon="event" value={v(proximas.length)} label="Próximas defesas" meta="Nos próximos 30 dias" tone="blue" />
				<KpiCard
					icon="groups"
					value={v(defesas.length)}
					label="Bancas no período"
					meta={`${realizadas} ${realizadas === 1 ? "já realizada" : "já realizadas"}`}
					tone="teal"
				/>
				<KpiCard
					icon="task_alt"
					value={v(aceitos.length)}
					label="Convites aceitos"
					meta={`de ${respondidos.length} ${respondidos.length === 1 ? "respondido" : "respondidos"}`}
					tone="teal"
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
								<span>Avaliador</span>
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
				<Card className="card task-card">
					<div className="card-title">
						<div>
							<h2>Convites aguardando resposta</h2>
							<p>Os mais antigos primeiro</p>
						</div>
					</div>
					{pendentes.length === 0 && !carregando && (
						<p className="section-description" style={{ marginTop: 16 }}>
							Nenhum convite pendente.
						</p>
					)}
					{[...pendentes]
						.sort((a, b) => new Date(a.data_envio).getTime() - new Date(b.data_envio).getTime())
						.slice(0, 4)
						.map((c) => (
							<PlainButton key={`${c.id_tcc}-${c.fase}`} onClick={() => navigate("/banca/convites")}>
								<span className="task-icon">
									<Icon name="groups" />
								</span>
								<strong>
									{nomeDiscente(c)} · TCC {c.fase === 2 ? "II" : "I"}
								</strong>
								<span>
									Responder <Icon name="arrow_forward" size={16} />
								</span>
							</PlainButton>
						))}
				</Card>
				<Card className="card chart-card">
					<div className="card-title">
						<div>
							<h2>Convites de banca recebidos</h2>
							<p>Últimos 6 meses</p>
						</div>
					</div>
					<GraficoConvites pontos={pontosConvites} somenteBanca />
				</Card>
			</div>

			<DefenseList
				defesas={proximas}
				limite={5}
				modoDocente
				carregando={carregando}
				acoesDetalhe={(_, fechar) => (
					<>
						<Button variant="secondary" onClick={fechar}>
							Fechar
						</Button>
						<Button icon="fact_check" onClick={() => navigate("/banca/avaliacoes")}>
							Ver avaliação
						</Button>
					</>
				)}
			/>
		</>
	);
}
