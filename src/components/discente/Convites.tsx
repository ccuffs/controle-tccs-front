import { useEffect, useState } from "react";
import { Tab, Tabs } from "@mui/material";
import { rotuloPeriodo, usePeriodo } from "../../contexts/PeriodoContext";
import { useTccDiscente } from "../../hooks/useTccDiscente";
import orientacaoService from "../../services/orientacao-service";
import type { Convite } from "../../types/convite";
import { getErrorMessage } from "../../utils/apiError";
import { dataBr } from "../../utils/formatos";
import { Avatar, Card, EmptyState, Icon, PageHeader, PhaseChip, StatusChip, Surface, useNotice } from "../ui";

type Aba = "pendentes" | "respondidos" | "todos";
const pendente = (c: Convite) => c.data_feedback === null;

/** Convites enviados pelo discente (protótipo: Invites com `student` em design/App.tsx). */
export default function ConvitesDiscente() {
	const notificar = useNotice();
	const { tcc, carregando, consulta } = useTccDiscente();
	const { todos } = usePeriodo();
	const [convites, setConvites] = useState<Convite[]>([]);
	const [aba, setAba] = useState<Aba>("todos");

	useEffect(() => {
		// "Todos os períodos": sem id_tcc, a API devolve os convites de todos os TCCs do discente.
		if (!todos && !tcc) {
			setConvites([]);
			return;
		}
		let ativo = true;
		orientacaoService
			.getConvites(todos ? {} : { id_tcc: tcc?.id })
			.then((lista) => ativo && setConvites([...lista].sort((a, b) => b.data_envio.localeCompare(a.data_envio))))
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar seus convites"), "error"));
		return () => {
			ativo = false;
		};
	}, [tcc, todos, notificar]);

	const contagem = { pendentes: convites.filter(pendente).length, respondidos: convites.filter((c) => !pendente(c)).length, todos: convites.length };
	const visiveis = convites.filter((c) => (aba === "todos" ? true : aba === "pendentes" ? pendente(c) : !pendente(c)));

	return (
		<>
			<PageHeader title="Meus convites" description="Acompanhe as respostas de orientação e banca." />
			<Tabs className="segments" value={aba} onChange={(_, v: Aba) => setAba(v)}>
				<Tab value="pendentes" label={`Pendentes · ${contagem.pendentes}`} />
				<Tab value="respondidos" label={`Respondidos · ${contagem.respondidos}`} />
				<Tab value="todos" label={`Todos · ${contagem.todos}`} />
			</Tabs>
			<div className="invite-list">
				{visiveis.map((c) => {
					const nome = c.docente?.nome ?? c.codigo_docente;
					return (
						<Card className="card invite-card" key={`${c.codigo_docente}-${c.fase}-${c.orientacao}-${c.data_envio}`}>
							<Avatar nome={nome} />
							<div className="invite-content">
								<div className="invite-name">
									<div>
										<h2>{nome}</h2>
										<span>{c.docente?.email ?? ""}</span>
									</div>
									<span className="invite-date">Enviado em {dataBr(c.data_envio)}</span>
								</div>
								<div className="chips">
									<StatusChip type="neutral">
										<Icon name={c.orientacao ? "handshake" : "groups"} size={15} />
										{c.orientacao ? "Orientação" : "Banca"}
									</StatusChip>
									<PhaseChip fase={c.fase} />
									{todos && c.trabalhoConclusao?.ano && (
										<StatusChip type="neutral">{`${c.trabalhoConclusao.ano}/${c.trabalhoConclusao.semestre}`}</StatusChip>
									)}
								</div>
								{c.mensagem_envio && <blockquote>“{c.mensagem_envio}”</blockquote>}
								<div className="status-line">
									<span className={`status-dot ${!pendente(c) && c.aceito ? "success-dot" : ""}`} />
									{pendente(c)
										? "Aguardando resposta do docente"
										: `${c.aceito ? "Aceito" : "Recusado"} pelo docente em ${dataBr(c.data_feedback)}`}
									{!pendente(c) && c.mensagem_feedback ? ` · ${c.mensagem_feedback}` : ""}
								</div>
							</div>
						</Card>
					);
				})}
				{!carregando && visiveis.length === 0 && (
					<Surface className="card">
						<EmptyState
							icon="inbox"
							title="Nenhum convite"
							text={
								consulta
									? tcc
										? `Nenhum convite no seu TCC de ${rotuloPeriodo(consulta)}.`
										: `Você não tinha TCC em ${rotuloPeriodo(consulta)}.`
									: todos || tcc
										? "Os convites de orientação e de banca que você enviar aparecem aqui."
										: "Você não tem TCC na oferta atual."
							}
						/>
					</Surface>
				)}
			</div>
		</>
	);
}
