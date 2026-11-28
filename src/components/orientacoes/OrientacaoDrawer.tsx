import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePerfilAtual } from "../../hooks/usePerfilAtual";
import acompanhamentoService from "../../services/acompanhamento-service";
import orientacaoService from "../../services/orientacao-service";
import type { ItemAcompanhamento } from "../../types/acompanhamento";
import type { Convite } from "../../types/convite";
import type { OrientadorCurso } from "../../types/curso";
import type { Defesa } from "../../types/defesa";
import { getErrorMessage } from "../../utils/apiError";
import { opcoesEtapa } from "../../utils/etapas";
import { dataBr } from "../../utils/formatos";
import { Avatar, Button, Icon, Input, PhaseChip, Select, SideDrawer, StatusChip, Textarea, useNotice } from "../ui";

const SEM_ORIENTADOR = "__sem__";

interface Conteudo {
	etapa: number;
	tema: string;
	titulo: string;
	resumo: string;
	seminario: string;
}

interface OrientacaoDrawerProps {
	item: ItemAcompanhamento | null;
	orientadores: OrientadorCurso[];
	onClose: () => void;
	onSalvo: () => void;
}

const statusConvite = (c: Convite) =>
	c.data_feedback === null
		? { rotulo: "Pendente", tom: "warning" as const }
		: c.aceito
			? { rotulo: "Aceito", tom: "success" as const }
			: { rotulo: "Recusado", tom: "danger" as const };

/** Painel "Editar orientação" (imagem orientacoes.png). */
export default function OrientacaoDrawer({ item, orientadores, onClose, onSalvo }: OrientacaoDrawerProps) {
	const notificar = useNotice();
	const navigate = useNavigate();
	// Coordenador ou Administrador (mesmas telas): os atalhos ficam no perfil em que se está.
	const perfil = usePerfilAtual() ?? "coordenacao";
	const [conteudo, setConteudo] = useState<Conteudo | null>(null);
	const [original, setOriginal] = useState<Conteudo | null>(null);
	const [orientador, setOrientador] = useState("");
	const [convites, setConvites] = useState<Convite[]>([]);
	const [defesas, setDefesas] = useState<Defesa[]>([]);
	const [salvando, setSalvando] = useState(false);

	useEffect(() => {
		if (!item) return;
		let ativo = true;
		setConteudo(null);
		setOrientador(item.orientador?.codigo ?? "");
		Promise.all([
			acompanhamentoService.obterTrabalho(item.id_tcc),
			orientacaoService.getConvites({ id_tcc: item.id_tcc }).catch(() => []),
			orientacaoService.getDefesasPorTcc(item.id_tcc).catch(() => []),
		])
			.then(([tcc, listaConvites, listaDefesas]) => {
				if (!ativo) return;
				const dados: Conteudo = {
					etapa: tcc.etapa ?? 0,
					tema: tcc.tema ?? "",
					titulo: tcc.titulo ?? "",
					resumo: tcc.resumo ?? "",
					seminario: tcc.seminario_andamento ?? "",
				};
				setConteudo(dados);
				setOriginal(dados);
				setConvites([...listaConvites].sort((a, b) => b.data_envio.localeCompare(a.data_envio)));
				setDefesas(listaDefesas.filter((d) => Number(d.fase) === item.fase));
			})
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar a orientação"), "error"));
		return () => {
			ativo = false;
		};
	}, [item, notificar]);

	const alterar = <K extends keyof Conteudo>(campo: K, valor: Conteudo[K]) =>
		setConteudo((atual) => (atual ? { ...atual, [campo]: valor } : atual));

	const salvar = async () => {
		if (!item || !conteudo || !original) return;
		setSalvando(true);
		try {
			const mudouConteudo = (Object.keys(conteudo) as (keyof Conteudo)[]).some((k) => conteudo[k] !== original[k]);
			if (mudouConteudo) {
				await orientacaoService.atualizarTrabalhoConclusao(item.id_tcc, {
					etapa: conteudo.etapa,
					tema: conteudo.tema,
					titulo: conteudo.titulo,
					resumo: conteudo.resumo,
					...(item.fase === 2 ? { seminario_andamento: conteudo.seminario } : {}),
				});
			}
			if (orientador !== (item.orientador?.codigo ?? "")) {
				await acompanhamentoService.definirOrientador({
					idTcc: item.id_tcc,
					fase: item.fase,
					novoCodigo: orientador,
					atual: item.orientador ? { codigo: item.orientador.codigo, idOrientacao: item.orientador.id_orientacao } : null,
				});
			}
			notificar("Orientação salva com sucesso.");
			onSalvo();
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar a orientação."), "error");
		} finally {
			setSalvando(false);
		}
	};

	const nomeDocente = (codigo: string) =>
		orientadores.find((o) => o.codigo_docente === codigo)?.docente?.nome ?? codigo;
	const orientadorForaDoCurso = item?.orientador && !orientadores.some((o) => o.codigo_docente === item.orientador?.codigo);
	const dataDefesa = defesas.find((d) => d.data_defesa)?.data_defesa ?? null;

	return (
		<SideDrawer
			open={Boolean(item)}
			onClose={onClose}
			eyebrow="ACOMPANHAMENTO"
			title="Editar orientação"
			footer={
				<>
					<Button variant="secondary" onClick={onClose} disabled={salvando}>
						Cancelar
					</Button>
					<Button onClick={salvar} disabled={salvando || !conteudo}>
						Salvar alterações
					</Button>
				</>
			}
		>
			{item && (
				<>
					<section className="orientation-summary">
						<Avatar nome={item.nome} />
						<div>
							<strong>{item.nome}</strong>
							<span className="mono">
								{item.matricula} · {item.periodo}
							</span>
						</div>
						<PhaseChip fase={item.fase} />
					</section>

					<details open>
						<summary>
							Discente <Icon name="expand_more" />
						</summary>
						<div className="readonly-box">
							<Icon name="lock" size={16} />
							<span>
								Os dados acadêmicos do discente são somente leitura nesta etapa.
								{item.email ? ` E-mail: ${item.email}.` : ""}
							</span>
						</div>
					</details>

					<details open>
						<summary>
							Orientador <Icon name="expand_more" />
						</summary>
						<label>
							<span>Docente responsável</span>
							<Select value={orientador || SEM_ORIENTADOR} onChange={(e) => setOrientador(e.target.value === SEM_ORIENTADOR ? "" : e.target.value)}>
								<option value={SEM_ORIENTADOR}>Sem orientador</option>
								{orientadorForaDoCurso && item.orientador && (
									<option value={item.orientador.codigo}>{item.orientador.nome}</option>
								)}
								{orientadores.map((o) => (
									<option key={o.codigo_docente} value={o.codigo_docente}>
										{o.docente?.nome ?? o.codigo_docente}
									</option>
								))}
							</Select>
						</label>
						{item.coorientadores.length > 0 && (
							<div className="readonly-box">
								<Icon name="group" size={16} />
								<span>Coorientação: {item.coorientadores.map((c) => c.nome).join(", ")}</span>
							</div>
						)}
					</details>

					<details>
						<summary>
							Etapa e conteúdo <Icon name="expand_more" />
						</summary>
						{conteudo ? (
							<div className="form-stack">
								<label>
									<span>Etapa</span>
									<Select value={String(conteudo.etapa)} onChange={(e) => alterar("etapa", Number(e.target.value))}>
										{opcoesEtapa(item.fase).map((o) => (
											<option key={o.valor} value={String(o.valor)}>
												{o.rotulo}
											</option>
										))}
									</Select>
								</label>
								<label>
									<span>Tema</span>
									<Input value={conteudo.tema} onChange={(e) => alterar("tema", e.target.value)} />
								</label>
								<label>
									<span>Título</span>
									<Input value={conteudo.titulo} onChange={(e) => alterar("titulo", e.target.value)} />
								</label>
								<label>
									<span>Resumo</span>
									<Textarea rows={5} value={conteudo.resumo} onChange={(e) => alterar("resumo", e.target.value)} />
								</label>
								{item.fase === 2 && (
									<label>
										<span>Seminário de andamento</span>
										<Textarea rows={4} value={conteudo.seminario} onChange={(e) => alterar("seminario", e.target.value)} />
									</label>
								)}
							</div>
						) : (
							<div className="readonly-box">Carregando…</div>
						)}
					</details>

					<details>
						<summary>
							Banca e agendamento <Icon name="expand_more" />
						</summary>
						{defesas.length === 0 ? (
							<div className="readonly-box">
								<Icon name="event_busy" size={16} />
								<span>Nenhuma banca registrada para esta fase.</span>
							</div>
						) : (
							<>
								<div className="readonly-box">
									<Icon name="calendar_month" size={16} />
									<span>{dataDefesa ? `Defesa em ${dataBr(dataDefesa)} às ${dataDefesa.slice(11, 16)}` : "Data da defesa ainda não definida"}</span>
								</div>
								{defesas.map((d) => (
									<div className="defense-person" key={d.membro_banca}>
										<Avatar nome={d.membroBanca?.nome ?? nomeDocente(d.membro_banca)} size="small" />
										<div>
											<strong>{d.membroBanca?.nome ?? nomeDocente(d.membro_banca)}</strong>
											<span>
												{d.orientador ? "Orientador" : "Membro da banca"}
												{d.avaliacao !== null ? ` · nota ${d.avaliacao}` : ""}
											</span>
										</div>
									</div>
								))}
							</>
						)}
						<div className="inline-actions">
							<Button variant="tertiary" icon="co_present" onClick={() => navigate(`/${perfil}/defesas`)}>
								Gerenciar em Defesas
							</Button>
						</div>
					</details>

					<details>
						<summary>
							Histórico de convites <Icon name="expand_more" />
						</summary>
						{convites.length === 0 ? (
							<div className="readonly-box">Nenhum convite enviado.</div>
						) : (
							<div className="defense-timeline">
								{convites.map((c) => {
									const st = statusConvite(c);
									return (
										<div key={`${c.codigo_docente}-${c.fase}-${c.orientacao}-${c.data_envio}`}>
											<i />
											<span>
												<strong>
													{c.orientacao ? "Orientação" : "Banca"} · {c.docente?.nome ?? nomeDocente(c.codigo_docente)}{" "}
													<StatusChip type={st.tom}>{st.rotulo}</StatusChip>
												</strong>
												<small>
													Enviado em {dataBr(c.data_envio)}
													{c.data_feedback ? ` · respondido em ${dataBr(c.data_feedback)}` : ""} · fase {c.fase}
												</small>
											</span>
										</div>
									);
								})}
							</div>
						)}
					</details>
				</>
			)}
		</SideDrawer>
	);
}
