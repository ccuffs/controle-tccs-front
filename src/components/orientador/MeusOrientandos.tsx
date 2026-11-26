import { useEffect, useMemo, useState } from "react";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useDocenteAtual } from "../../hooks/useDocenteAtual";
import acompanhamentoService from "../../services/acompanhamento-service";
import orientacaoService from "../../services/orientacao-service";
import type { ItemAcompanhamento } from "../../types/acompanhamento";
import { getErrorMessage } from "../../utils/apiError";
import { opcoesEtapa } from "../../utils/etapas";
import {
	Button,
	DataTable,
	Input,
	ModalDialog,
	PageHeader,
	PhaseChip,
	Select,
	StatusChip,
	TableToolbar,
	Textarea,
	useNotice,
	type DataTableColumn,
} from "../ui";

const TODOS = "__todos__";
const POR_PAGINA = 10;
const LIMITE_RESUMO = 1500;

interface Edicao {
	etapa: number;
	tema: string;
	titulo: string;
	resumo: string;
}

/** Orientandos do docente (imagens Meus_orientandos_orientador.png e meus_orientandos_editar.png). */
export default function MeusOrientandos() {
	const notificar = useNotice();
	const { periodos, selecionado } = usePeriodo();
	const { codigo } = useDocenteAtual();

	const [busca, setBusca] = useState("");
	const [buscaAplicada, setBuscaAplicada] = useState("");
	const [periodo, setPeriodo] = useState<string | null>(null);
	const [pagina, setPagina] = useState(1);
	const [resposta, setResposta] = useState<{ total: number; itens: ItemAcompanhamento[] }>({ total: 0, itens: [] });
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);

	const [aberto, setAberto] = useState<ItemAcompanhamento | null>(null);
	const [edicao, setEdicao] = useState<Edicao | null>(null);
	const [salvando, setSalvando] = useState(false);

	// Padrão: período do topo; "Todos os períodos" é uma escolha explícita.
	const periodoEfetivo = periodo ?? (selecionado ? `${selecionado.ano}/${selecionado.semestre}` : TODOS);
	const [ano, semestre] = periodoEfetivo === TODOS ? ["", ""] : periodoEfetivo.split("/");

	useEffect(() => {
		const t = setTimeout(() => setBuscaAplicada(busca), 350);
		return () => clearTimeout(t);
	}, [busca]);
	useEffect(() => setPagina(1), [buscaAplicada, periodoEfetivo]);

	useEffect(() => {
		if (!codigo) return;
		let ativo = true;
		setCarregando(true);
		acompanhamentoService
			.listarAcompanhamento({ q: buscaAplicada, ano, semestre, codigo_docente: codigo, pagina, limite: POR_PAGINA })
			.then((r) => ativo && setResposta({ total: r.total, itens: r.itens }))
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar orientandos"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [codigo, buscaAplicada, ano, semestre, pagina, recarregar, notificar]);

	const abrir = (item: ItemAcompanhamento) => {
		setAberto(item);
		setEdicao(null);
	};

	const iniciarEdicao = () =>
		aberto &&
		setEdicao({ etapa: aberto.etapa, tema: aberto.tema ?? "", titulo: aberto.titulo ?? "", resumo: aberto.resumo ?? "" });

	const salvar = async () => {
		if (!aberto || !edicao) return;
		setSalvando(true);
		try {
			await orientacaoService.atualizarTrabalhoConclusao(aberto.id_tcc, edicao);
			notificar("Orientação salva.");
			setAberto(null);
			setEdicao(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar a orientação."), "error");
		} finally {
			setSalvando(false);
		}
	};

	const opcoesPeriodo = useMemo(() => periodos.map((p) => `${p.ano}/${p.semestre}`), [periodos]);

	const colunas: DataTableColumn<ItemAcompanhamento>[] = [
		{
			key: "discente",
			header: "Discente",
			render: (i) => (
				<>
					<strong>{i.nome}</strong>
					<small className="cell-subtitle mono">{i.matricula}</small>
				</>
			),
		},
		{ key: "fase", header: "Fase", render: (i) => <PhaseChip fase={i.fase} /> },
		{
			key: "etapa",
			header: "Etapa",
			render: (i) => (
				<div className="progress-cell">
					<div className="mini-progress">
						<i style={{ width: `${i.progresso}%` }} />
					</div>
					<span>{i.etapa_label}</span>
				</div>
			),
		},
		{ key: "periodo", header: "Período", render: (i) => i.periodo },
		{
			key: "pendencia",
			header: "Pendência",
			render: (i) =>
				i.pendencias.length ? (
					<StatusChip type="warning">{i.pendencias.map((p) => p.descricao).join(" · ")}</StatusChip>
				) : (
					<StatusChip type="success">Em dia</StatusChip>
				),
		},
		{
			key: "acao",
			header: "Ação",
			render: (i) => (
				<Button variant="tertiary" onClick={() => abrir(i)}>
					Ver orientação
				</Button>
			),
		},
	];

	return (
		<>
			<PageHeader title="Meus orientandos" description="Acompanhe os trabalhos sob sua orientação no período atual." />
			<TableToolbar search={busca} onSearchChange={setBusca} searchPlaceholder="Buscar por nome ou matrícula">
				<Select value={periodoEfetivo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Filtrar por período">
					<option value={TODOS}>Todos os períodos</option>
					{opcoesPeriodo.map((p) => (
						<option key={p} value={p}>
							{p}
						</option>
					))}
				</Select>
			</TableToolbar>
			<DataTable
				columns={colunas}
				rows={resposta.itens}
				getRowKey={(i) => i.id_tcc}
				total={resposta.total}
				page={pagina}
				pageSize={POR_PAGINA}
				onPageChange={setPagina}
				loading={carregando}
				onClearFilters={() => {
					setBusca("");
					setPeriodo(TODOS);
				}}
			/>

			<ModalDialog
				open={Boolean(aberto)}
				onClose={() => setAberto(null)}
				icon={edicao ? "edit_note" : "school"}
				title={edicao ? "Editar orientação" : (aberto?.nome ?? "")}
				description={
					aberto &&
					(edicao ? (
						<>
							{aberto.nome} · <PhaseChip fase={aberto.fase} />
						</>
					) : (
						`${aberto.matricula} · ${aberto.periodo}`
					))
				}
				actions={
					edicao ? (
						<>
							<Button variant="secondary" onClick={() => setEdicao(null)} disabled={salvando}>
								Voltar
							</Button>
							<Button icon="save" onClick={salvar} disabled={salvando}>
								Salvar orientação
							</Button>
						</>
					) : (
						<>
							<Button variant="secondary" onClick={() => setAberto(null)}>
								Fechar
							</Button>
							<Button icon="edit" onClick={iniciarEdicao}>
								Editar orientação
							</Button>
						</>
					)
				}
			>
				{aberto && !edicao && (
					<>
						<div className="orientation-dialog-data">
							<div>
								<span>Fase</span>
								<PhaseChip fase={aberto.fase} />
							</div>
							<div>
								<span>Etapa atual</span>
								<strong>{aberto.etapa_label}</strong>
							</div>
							<div>
								<span>Progresso</span>
								<strong>{aberto.progresso}%</strong>
							</div>
						</div>
						<div className="orientation-content-preview">
							<div>
								<span>Tema</span>
								<strong>{aberto.tema || "—"}</strong>
							</div>
							<div>
								<span>Título</span>
								<strong>{aberto.titulo || "—"}</strong>
							</div>
							<div>
								<span>Resumo</span>
								<p>{aberto.resumo || "—"}</p>
							</div>
						</div>
					</>
				)}
				{aberto && edicao && (
					<div className="form-stack">
						<label>
							<span>Etapa</span>
							<Select value={String(edicao.etapa)} onChange={(e) => setEdicao({ ...edicao, etapa: Number(e.target.value) })}>
								{opcoesEtapa(aberto.fase).map((o) => (
									<option key={o.valor} value={String(o.valor)}>
										{o.rotulo}
									</option>
								))}
							</Select>
						</label>
						<label>
							<span>Tema</span>
							<Input value={edicao.tema} onChange={(e) => setEdicao({ ...edicao, tema: e.target.value })} />
						</label>
						<label>
							<span>Título</span>
							<Input value={edicao.titulo} onChange={(e) => setEdicao({ ...edicao, titulo: e.target.value })} />
						</label>
						<label>
							<span>Resumo</span>
							<Textarea
								rows={6}
								value={edicao.resumo}
								onChange={(e) => setEdicao({ ...edicao, resumo: e.target.value.slice(0, LIMITE_RESUMO) })}
							/>
							<small>
								{edicao.resumo.length} / {LIMITE_RESUMO.toLocaleString("pt-BR")}
							</small>
						</label>
					</div>
				)}
			</ModalDialog>
		</>
	);
}
