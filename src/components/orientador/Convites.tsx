import { useEffect, useMemo, useState } from "react";
import { Tab, Tabs } from "@mui/material";
import { useDocenteAtual } from "../../hooks/useDocenteAtual";
import { usePerfilAtual } from "../../hooks/usePerfilAtual";
import { usePeriodo } from "../../contexts/PeriodoContext";
import convitesService from "../../services/convites-service";
import type { Convite } from "../../types/convite";
import { getErrorMessage } from "../../utils/apiError";
import { dataBr } from "../../utils/formatos";
import {
	Avatar,
	Button,
	Card,
	ConfirmDialog,
	EmptyState,
	Icon,
	ModalDialog,
	PageHeader,
	PhaseChip,
	PlainButton,
	StatusChip,
	Surface,
	useNotice,
} from "../ui";

type Aba = "pendentes" | "respondidos" | "todos";
const POR_PAGINA = 20;

const chave = (c: Convite) => `${c.id_tcc}-${c.codigo_docente}-${c.fase}-${c.orientacao}`;
const pendente = (c: Convite) => c.data_feedback === null;

function recebidoEm(iso: string): string {
	const d = new Date(iso);
	const hoje = new Date();
	const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
	if (d.toDateString() === hoje.toDateString()) return `Recebido hoje, ${hora}`;
	if (d.toDateString() === ontem.toDateString()) return `Recebido ontem, ${hora}`;
	return `Recebido em ${d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: d.getFullYear() === hoje.getFullYear() ? undefined : "numeric" })}`;
}

function Tipo({ convite }: { convite: Convite }) {
	return (
		<StatusChip type="neutral">
			<Icon name={convite.orientacao ? "handshake" : "groups"} size={15} />
			{convite.orientacao ? "Orientação" : "Banca"}
		</StatusChip>
	);
}

function Resposta({ convite }: { convite: Convite }) {
	if (pendente(convite)) return <StatusChip type="warning">Pendente</StatusChip>;
	return convite.aceito ? <StatusChip type="success">Aceito</StatusChip> : <StatusChip type="danger">Recusado</StatusChip>;
}

/** Convites recebidos pelo docente (imagem convites_orientador.png). Também usada no perfil Banca. */
export default function Convites() {
	const notificar = useNotice();
	const perfil = usePerfilAtual();
	const { codigo } = useDocenteAtual();
	const { filtro, escolha } = usePeriodo();
	const [convites, setConvites] = useState<Convite[]>([]);
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);
	const [aba, setAba] = useState<Aba>("pendentes");
	const [limite, setLimite] = useState(POR_PAGINA);
	const [detalhe, setDetalhe] = useState<Convite | null>(null);
	const [recusar, setRecusar] = useState<Convite | null>(null);
	const [ocupado, setOcupado] = useState(false);

	useEffect(() => {
		if (!codigo || !escolha) return;
		let ativo = true;
		setCarregando(true);
		convitesService
			.getConvitesDocente(codigo, filtro)
			.then((lista) => ativo && setConvites([...lista].sort((a, b) => b.data_envio.localeCompare(a.data_envio))))
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar convites"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [codigo, escolha, filtro, recarregar, notificar]);

	useEffect(() => setLimite(POR_PAGINA), [aba]);

	const contagem = useMemo(
		() => ({
			pendentes: convites.filter(pendente).length,
			respondidos: convites.filter((c) => !pendente(c)).length,
			todos: convites.length,
		}),
		[convites],
	);
	const visiveis = convites.filter((c) => (aba === "todos" ? true : aba === "pendentes" ? pendente(c) : !pendente(c)));

	const responder = async (convite: Convite, aceito: boolean) => {
		setOcupado(true);
		try {
			await convitesService.responderConvite(convite.id_tcc, convite.codigo_docente, convite.fase, aceito);
			notificar(
				aceito
					? convite.orientacao
						? "Convite aceito. O discente foi adicionado aos seus orientandos."
						: "Convite de banca aceito."
					: "Convite recusado.",
			);
			setDetalhe(null);
			setRecusar(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível responder ao convite."), "error");
		} finally {
			setOcupado(false);
		}
	};

	const nome = (c: Convite) => c.trabalhoConclusao?.dicente?.nome ?? c.trabalhoConclusao?.matricula ?? "Discente";
	const identificacao = (c: Convite) =>
		`${c.trabalhoConclusao?.matricula ?? ""}${c.trabalhoConclusao?.curso?.nome ? ` · ${c.trabalhoConclusao.curso.nome}` : ""}${
			c.trabalhoConclusao?.ano ? ` · ${c.trabalhoConclusao.ano}/${c.trabalhoConclusao.semestre}` : ""
		}`;

	return (
		<>
			<PageHeader
				title="Convites recebidos"
				description={
					perfil === "banca"
						? "Responda aos convites para participar de bancas."
						: "Responda aos convites de orientação e participação em bancas."
				}
			/>
			<Tabs className="segments" value={aba} onChange={(_, v: Aba) => setAba(v)}>
				<Tab value="pendentes" label={`Pendentes · ${contagem.pendentes}`} />
				<Tab value="respondidos" label={`Respondidos · ${contagem.respondidos}`} />
				<Tab value="todos" label={`Todos · ${contagem.todos}`} />
			</Tabs>
			<div className="invite-list">
				{visiveis.slice(0, limite).map((c) => (
					<Card className="card invite-card" key={chave(c)}>
						<Avatar nome={nome(c)} />
						<div className="invite-content">
							<div className="invite-name">
								<div>
									<h2>{nome(c)}</h2>
									<span className="mono">{identificacao(c)}</span>
								</div>
								<span className="invite-date">{recebidoEm(c.data_envio)}</span>
							</div>
							<div className="chips">
								<Tipo convite={c} />
								<PhaseChip fase={c.fase} />
								{!pendente(c) && <Resposta convite={c} />}
							</div>
							{c.mensagem_envio && <blockquote>“{c.mensagem_envio}”</blockquote>}
							{pendente(c) ? (
								<div className="invite-actions">
									<Button icon="check" onClick={() => responder(c, true)} disabled={ocupado}>
										Aceitar
									</Button>
									<Button variant="secondary" icon="close" onClick={() => setRecusar(c)} disabled={ocupado}>
										Recusar
									</Button>
									<PlainButton className="text-link" onClick={() => setDetalhe(c)}>
										Ver detalhes
									</PlainButton>
								</div>
							) : (
								<div className="invite-actions">
									<PlainButton className="text-link" onClick={() => setDetalhe(c)}>
										Ver detalhes
									</PlainButton>
								</div>
							)}
						</div>
					</Card>
				))}
				{!carregando && visiveis.length === 0 && (
					<Surface className="card">
						<EmptyState
							icon={aba === "respondidos" ? "mark_email_read" : "inbox"}
							title={aba === "respondidos" ? "Nenhum convite respondido" : "Nenhum convite pendente"}
							text={
								aba === "respondidos"
									? "Os convites aparecerão aqui depois que você aceitar ou recusar."
									: "Você está em dia com todos os convites recebidos."
							}
						/>
					</Surface>
				)}
				{visiveis.length > limite && (
					<Button variant="tertiary" onClick={() => setLimite((x) => x + POR_PAGINA)}>
						Mostrar mais ({visiveis.length - limite})
					</Button>
				)}
			</div>

			<ModalDialog
				open={Boolean(detalhe)}
				onClose={() => setDetalhe(null)}
				icon={detalhe?.orientacao ? "handshake" : "groups"}
				header={
					detalhe && (
						<div className="chips">
							<Resposta convite={detalhe} />
							<Tipo convite={detalhe} />
							<PhaseChip fase={detalhe.fase} />
						</div>
					)
				}
				title={detalhe ? `Convite de ${detalhe.orientacao ? "orientação" : "banca"}` : ""}
				description={detalhe ? recebidoEm(detalhe.data_envio) : ""}
				actions={
					detalhe && pendente(detalhe) ? (
						<>
							<Button variant="secondary" icon="close" onClick={() => setRecusar(detalhe)} disabled={ocupado}>
								Recusar
							</Button>
							<Button icon="check" onClick={() => responder(detalhe, true)} disabled={ocupado}>
								Aceitar convite
							</Button>
						</>
					) : (
						<Button variant="secondary" onClick={() => setDetalhe(null)}>
							Fechar
						</Button>
					)
				}
			>
				{detalhe && (
					<>
						<div className="invite-detail-person">
							<Avatar nome={nome(detalhe)} />
							<div>
								<strong>{nome(detalhe)}</strong>
								<span className="mono">{identificacao(detalhe)}</span>
							</div>
						</div>
						{detalhe.trabalhoConclusao?.titulo && (
							<div className="orientation-content-preview">
								<div>
									<span>TÍTULO</span>
									<strong>{detalhe.trabalhoConclusao.titulo}</strong>
								</div>
							</div>
						)}
						<div className="invite-detail-message" style={{ marginTop: 14 }}>
							<span>MENSAGEM DO DISCENTE</span>
							<p>“{detalhe.mensagem_envio || "Sem mensagem."}”</p>
							<small className="invite-detail-date">Convite enviado em {dataBr(detalhe.data_envio)}</small>
						</div>
						{!pendente(detalhe) && (
							<div className="invite-detail-message" style={{ marginTop: 10 }}>
								<span>SUA RESPOSTA</span>
								{detalhe.mensagem_feedback && <p>{detalhe.mensagem_feedback}</p>}
								<small className="invite-detail-date">
									{detalhe.aceito ? "Aceito" : "Recusado"} em {dataBr(detalhe.data_feedback)}
								</small>
							</div>
						)}
					</>
				)}
			</ModalDialog>

			<ConfirmDialog
				open={Boolean(recusar)}
				title="Recusar convite"
				description={recusar ? `Recusar o convite de ${recusar.orientacao ? "orientação" : "banca"} de ${nome(recusar)}?` : ""}
				confirmLabel="Recusar"
				busy={ocupado}
				onConfirm={() => recusar && responder(recusar, false)}
				onClose={() => setRecusar(null)}
			/>
		</>
	);
}
