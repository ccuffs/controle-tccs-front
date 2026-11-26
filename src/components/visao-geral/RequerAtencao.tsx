import { useState } from "react";
import { Alert } from "@mui/material";
import { useNavigate } from "react-router";
import type { DocenteSemDisponibilidade, EstudantePendenteBanca } from "../../types/dashboard";
import { diaMes } from "../../utils/formatos";
import { ActionIconButton, Avatar, Button, Icon, PlainButton, SideDrawer, Surface } from "../ui";

const EM_BREVE = "Envio de lembretes por e-mail em breve";

interface RequerAtencaoProps {
	estudantes: EstudantePendenteBanca[];
	docentes: DocenteSemDisponibilidade[];
}

/** Bloco "Requer atenção" da Visão geral e o painel lateral com as listas. */
export default function RequerAtencao({ estudantes, docentes }: RequerAtencaoProps) {
	const navigate = useNavigate();
	const [aberto, setAberto] = useState<"estudantes" | "docentes" | null>(null);
	const prazoMaisProximo = estudantes
		.map((e) => e.prazo)
		.filter((p): p is string => Boolean(p))
		.sort()[0];

	return (
		<>
			<Surface component="section" className="attention card">
				<div className="section-heading">
					<div>
						<span className="section-icon amber">
							<Icon name="notifications_active" />
						</span>
						<div>
							<h2>Requer atenção</h2>
							<p>Pendências que podem impactar o andamento do período.</p>
						</div>
					</div>
					<PlainButton onClick={() => navigate("/coordenacao/orientacoes")}>
						Ver todas <Icon name="arrow_forward" size={17} />
					</PlainButton>
				</div>
				<div className="attention-grid">
					<div className="attention-item">
						<span className="count amber-bg">{estudantes.length}</span>
						<div>
							<strong>Discentes sem convite de banca</strong>
							<p>{prazoMaisProximo ? `Defesas a partir de ${diaMes(prazoMaisProximo)}` : "Já na etapa de convite da banca"}</p>
						</div>
						<ActionIconButton
							className="icon-button"
							aria-label="Ver discentes sem convite de banca"
							onClick={() => setAberto("estudantes")}
						>
							<Icon name="chevron_right" />
						</ActionIconButton>
					</div>
					<div className="attention-item">
						<span className="count red-bg">{docentes.length}</span>
						<div>
							<strong>Docentes sem disponibilidade</strong>
							<p>Ainda não informaram horários</p>
						</div>
						<Button variant="tertiary" icon="chevron_right" onClick={() => setAberto("docentes")}>
							Ver docentes
						</Button>
					</div>
				</div>
			</Surface>

			<SideDrawer
				open={Boolean(aberto)}
				onClose={() => setAberto(null)}
				eyebrow="REQUER ATENÇÃO"
				title={aberto === "estudantes" ? "Discentes sem convite de banca" : "Docentes sem disponibilidade"}
				className="attention-drawer"
				footer={
					aberto === "docentes" ? (
						<>
							<Button variant="secondary" onClick={() => setAberto(null)}>
								Fechar
							</Button>
							<span title={EM_BREVE}>
								<Button icon="send" disabled>
									Lembrar todos
								</Button>
							</span>
						</>
					) : undefined
				}
			>
				<Alert severity={aberto === "estudantes" ? "warning" : "error"}>
					{aberto === "estudantes"
						? "Estes discentes já possuem orientação, mas ainda não enviaram os dois convites de banca."
						: "Estes docentes ainda não informaram horários disponíveis para bancas no período."}
				</Alert>
				<div className="attention-detail-list">
					{aberto === "estudantes" &&
						estudantes.map((e) => (
							<Surface className="attention-detail-row" key={e.id_tcc}>
								<Avatar nome={e.nome} size="small" />
								<div>
									<strong>{e.nome}</strong>
									<span className="mono">
										{e.matricula} · {e.etapa_label}
									</span>
									<small>
										<Icon name="schedule" size={13} />
										{e.pendencia.descricao}
										{e.prazo ? ` · defesas a partir de ${diaMes(e.prazo)}` : ""}
									</small>
								</div>
								<Button
									variant="tertiary"
									onClick={() => navigate(`/coordenacao/orientacoes?q=${encodeURIComponent(e.matricula)}`)}
								>
									Ver orientação
								</Button>
							</Surface>
						))}
					{aberto === "docentes" &&
						docentes.map((d) => (
							<Surface className="attention-detail-row" key={d.codigo_docente}>
								<Avatar nome={d.nome} size="small" />
								<div>
									<strong>{d.nome}</strong>
									<span>{d.siape ? `SIAPE ${d.siape}` : "SIAPE não informado"}</span>
									<small>{d.email ?? d.codigo_docente}</small>
								</div>
								<span title={EM_BREVE}>
									<Button variant="secondary" icon="send" disabled>
										Lembrar
									</Button>
								</span>
							</Surface>
						))}
				</div>
			</SideDrawer>
		</>
	);
}
