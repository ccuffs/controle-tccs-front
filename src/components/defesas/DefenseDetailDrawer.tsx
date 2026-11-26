import type { ReactNode } from "react";
import type { ConfirmacaoMembro, DefesaAgenda, StatusDefesa } from "../../types/dashboard";
import { dataBr } from "../../utils/formatos";
import { Avatar, Button, Icon, PhaseChip, SideDrawer, StatusChip, type StatusTone } from "../ui";

export const STATUS_DEFESA: Record<StatusDefesa, { rotulo: string; tom: StatusTone }> = {
	agendada: { rotulo: "Agendada", tom: "success" },
	aguardando_confirmacao: { rotulo: "Aguardando confirmação", tom: "warning" },
	concluida: { rotulo: "Concluída", tom: "info" },
};

const CONFIRMACAO: Record<ConfirmacaoMembro, { rotulo: string; tom: StatusTone }> = {
	confirmado: { rotulo: "Confirmado", tom: "success" },
	pendente: { rotulo: "Pendente", tom: "warning" },
	recusado: { rotulo: "Recusado", tom: "danger" },
};

const formatarNota = (nota: number) => nota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

interface DefenseDetailDrawerProps {
	defesa: DefesaAgenda | null;
	onClose: () => void;
	/** Botões do rodapé; sem eles, mostra apenas "Fechar". */
	acoes?: ReactNode;
	/** Conteúdo extra no fim do painel (ex.: histórico). */
	extra?: ReactNode;
}

export default function DefenseDetailDrawer({ defesa, onClose, acoes, extra }: DefenseDetailDrawerProps) {
	const status = defesa ? STATUS_DEFESA[defesa.status] : null;
	const membrosBanca = defesa?.membros.filter((m) => m.papel === "banca") ?? [];
	const confirmados = membrosBanca.filter((m) => m.confirmacao === "confirmado").length;
	const pendentes = membrosBanca.filter((m) => m.confirmacao !== "confirmado");
	const orientadorPrimeiro = defesa ? [...defesa.membros].sort((a, b) => (a.papel === "orientador" ? -1 : b.papel === "orientador" ? 1 : 0)) : [];

	return (
		<SideDrawer
			open={Boolean(defesa)}
			onClose={onClose}
			eyebrow="DETALHES DA DEFESA"
			title={defesa?.estudante ?? ""}
			className="defense-drawer"
			footerClassName="defense-actions"
			footer={
				acoes ?? (
					<Button variant="secondary" onClick={onClose}>
						Fechar
					</Button>
				)
			}
		>
			{defesa && status && (
				<>
					<div className="defense-detail-hero">
						<div>
							<div className="chips">
								<PhaseChip fase={defesa.fase} />
								<StatusChip type={status.tom}>{status.rotulo}</StatusChip>
							</div>
							<h3>{defesa.titulo || "Título não informado"}</h3>
							<span className="mono">
								{defesa.matricula} · {defesa.ano}/{defesa.semestre}
							</span>
						</div>
					</div>
					<section className="defense-facts">
						<div>
							<Icon name="calendar_month" />
							<span>
								Data e hora
								<strong>
									{dataBr(defesa.data)} · {defesa.hora}
								</strong>
							</span>
						</div>
						<div>
							<Icon name="location_on" />
							<span>
								Local<strong>{defesa.local || "A definir"}</strong>
							</span>
						</div>
						<div>
							<Icon name={defesa.nota_media !== null ? "grade" : "groups"} />
							<span>
								{defesa.nota_media !== null ? "Nota média" : "Banca"}
								<strong>
									{defesa.nota_media !== null
										? formatarNota(defesa.nota_media)
										: `${confirmados} de ${membrosBanca.length} confirmados`}
								</strong>
							</span>
						</div>
					</section>
					<section className="drawer-section defense-people">
						<div className="drawer-section-title">
							<h3>Orientador e banca</h3>
						</div>
						{orientadorPrimeiro.map((membro) => {
							const confirmacao = CONFIRMACAO[membro.confirmacao];
							return (
								<div className="defense-person" key={`${membro.papel}-${membro.codigo}`}>
									<Avatar nome={membro.nome} size="small" />
									<div>
										<strong>{membro.nome}</strong>
										<span>
											{membro.papel === "orientador" ? "Orientador" : membro.externo ? "Membro externo" : "Membro da banca"}
											{membro.avaliacao !== null ? ` · nota ${formatarNota(membro.avaliacao)}` : ""}
										</span>
									</div>
									{membro.externo && (
										<StatusChip type="neutral">
											<Icon name="domain" size={13} />
											Externo
										</StatusChip>
									)}
									<StatusChip type={confirmacao.tom}>{confirmacao.rotulo}</StatusChip>
								</div>
							);
						})}
					</section>
					<section className="drawer-section">
						<h3>Pendências e avaliação</h3>
						{defesa.status === "concluida" ? (
							<div className="readonly-box success-box">
								<Icon name="check_circle" />
								<span>Avaliação registrada por todos os membros.</span>
							</div>
						) : pendentes.length > 0 ? (
							<div className="readonly-box warning-box">
								<Icon name="notification_important" />
								<span>
									{pendentes.length === 1
										? "Um convite de banca ainda aguarda resposta ou foi recusado."
										: `${pendentes.length} convites de banca aguardam resposta ou foram recusados.`}
								</span>
							</div>
						) : (
							<div className="readonly-box success-box">
								<Icon name="check_circle" />
								<span>Banca confirmada. A avaliação será liberada no dia da defesa.</span>
							</div>
						)}
					</section>
					{extra}
				</>
			)}
		</SideDrawer>
	);
}
