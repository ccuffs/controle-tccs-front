import { useEffect, useMemo, useState } from "react";
import { useTccDiscente } from "../../hooks/useTccDiscente";
import { contemBusca } from "../../hooks/useListaLocal";
import orientacaoService from "../../services/orientacao-service";
import temasTccService from "../../services/temas-tcc-service";
import type { Convite } from "../../types/convite";
import type { TemaTcc } from "../../types/tema-tcc";
import { getErrorMessage } from "../../utils/apiError";
import ConviteOrientadorModal from "../modulo-dicente/ConviteOrientadorModal";
import { Avatar, Button, Card, EmptyState, Icon, Input, PageHeader, Select, StatusChip, Surface, useNotice } from "../ui";

const TODOS = "__todos__";

/** Catálogo de temas do curso do discente (protótipo: Catalog em design/App.tsx). */
export default function TemasDisponiveis() {
	const notificar = useNotice();
	const { tcc, carregando: carregandoTcc, recarregar } = useTccDiscente();
	const [temas, setTemas] = useState<TemaTcc[]>([]);
	const [convites, setConvites] = useState<Convite[]>([]);
	const [busca, setBusca] = useState("");
	const [area, setArea] = useState(TODOS);
	const [docente, setDocente] = useState(TODOS);
	const [convidar, setConvidar] = useState<string | null>(null);

	useEffect(() => {
		if (!tcc) return;
		let ativo = true;
		Promise.all([temasTccService.getTemasPorCurso(tcc.id_curso), orientacaoService.getConvites({ id_tcc: tcc.id }).catch(() => [])])
			.then(([lista, listaConvites]) => {
				if (!ativo) return;
				setTemas(lista.filter((t) => t.ativo));
				setConvites(listaConvites);
			})
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar os temas"), "error"));
		return () => {
			ativo = false;
		};
	}, [tcc, notificar]);

	const conviteOrientacao = convites.find((c) => c.orientacao && Number(c.fase) === Number(tcc?.fase) && !(c.data_feedback && !c.aceito)) ?? null;
	const areas = useMemo(() => [...new Set(temas.map((t) => t.areaTcc?.descricao).filter((a): a is string => Boolean(a)))].sort(), [temas]);
	const docentes = useMemo(
		() => [...new Map(temas.map((t) => [t.codigo_docente, t.docente?.nome ?? t.codigo_docente])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
		[temas],
	);
	const visiveis = temas.filter(
		(t) =>
			contemBusca(busca, t.descricao, t.areaTcc?.descricao, t.docente?.nome) &&
			(area === TODOS || t.areaTcc?.descricao === area) &&
			(docente === TODOS || t.codigo_docente === docente),
	);

	return (
		<>
			<PageHeader
				eyebrow={tcc ? (tcc.fase === 2 ? "TCC (TCC II)" : "PROJETO (TCC I)") : undefined}
				title="Escolha um tema"
				description="Encontre uma área de interesse e convide o docente para sua orientação."
			/>
			<Surface className="catalog-tools card">
				<div className="search">
					<Icon name="search" />
					<Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por tema, área ou docente" />
				</div>
				<Select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área">
					<option value={TODOS}>Todas as áreas</option>
					{areas.map((a) => (
						<option key={a} value={a}>
							{a}
						</option>
					))}
				</Select>
				<Select value={docente} onChange={(e) => setDocente(e.target.value)} aria-label="Docente">
					<option value={TODOS}>Todos os docentes</option>
					{docentes.map(([codigo, nome]) => (
						<option key={codigo} value={codigo}>
							{nome}
						</option>
					))}
				</Select>
			</Surface>
			{conviteOrientacao && (
				<Surface className="card" style={{ padding: 14, marginBottom: 14 }}>
					<span className="meta-line" style={{ marginTop: 0 }}>
						<Icon name={conviteOrientacao.aceito ? "check_circle" : "hourglass_top"} size={16} />
						{conviteOrientacao.aceito
							? `Seu orientador: ${conviteOrientacao.docente?.nome ?? conviteOrientacao.codigo_docente}.`
							: `Convite enviado para ${conviteOrientacao.docente?.nome ?? conviteOrientacao.codigo_docente}, aguardando resposta.`}
					</span>
				</Surface>
			)}
			<div className="theme-grid">
				{visiveis.map((t) => {
					const livres = Math.max((t.vagasOferta ?? 0) - (t.vagasOcupadas ?? 0), 0);
					return (
						<Card className="card theme-card" key={t.id}>
							<div className="person-line">
								<Avatar nome={t.docente?.nome ?? t.codigo_docente} />
								<div>
									<strong>{t.docente?.nome ?? t.codigo_docente}</strong>
									<span>
										<Icon name="school" size={14} /> Docente UFFS
									</span>
								</div>
							</div>
							<div className="theme-area">
								<span>ÁREA DO TCC</span>
								<StatusChip type="info">{t.areaTcc?.descricao ?? "—"}</StatusChip>
							</div>
							<h2>{t.descricao}</h2>
							<div className="vacancy">
								<span>
									<Icon name="group" size={17} />
									{livres} {livres === 1 ? "vaga" : "vagas"}
								</span>
								<span className={livres === 1 ? "last-vacancy" : ""}>
									{livres === 0 ? "Sem vagas" : livres === 1 ? "Última vaga" : "Disponível"}
								</span>
							</div>
							{/* Como na tela anterior, a falta de vagas é informada mas não impede o convite. */}
							<Button variant="secondary" onClick={() => setConvidar(t.codigo_docente)} disabled={Boolean(conviteOrientacao) || !tcc}>
								Convidar este orientador
							</Button>
						</Card>
					);
				})}
			</div>
			{!carregandoTcc && visiveis.length === 0 && (
				<Surface className="card">
					<EmptyState
						icon="menu_book"
						title={tcc ? "Nenhum tema encontrado" : "Você não tem TCC na oferta atual"}
						text={tcc ? "Tente outra busca ou limpe os filtros." : "Os temas aparecem quando você estiver matriculado em uma oferta de TCC."}
					/>
				</Surface>
			)}
			{tcc && (
				<ConviteOrientadorModal
					open={Boolean(convidar)}
					onClose={() => setConvidar(null)}
					idTcc={tcc.id}
					idCurso={tcc.id_curso}
					fase={tcc.fase}
					orientadorInicial={convidar ?? undefined}
					onConviteEnviado={() => {
						setConvidar(null);
						notificar("Convite enviado.");
						recarregar();
					}}
				/>
			)}
		</>
	);
}
