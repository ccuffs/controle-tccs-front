import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { filtroComoTexto, rotuloPeriodo, usePeriodo } from "../../contexts/PeriodoContext";
import { nomeCurso, useCursosCoordenacao } from "../../hooks/useCursosCoordenacao";
import acompanhamentoService from "../../services/acompanhamento-service";
import orientacaoService from "../../services/orientacao-service";
import type { ItemAcompanhamento } from "../../types/acompanhamento";
import type { OrientadorCurso } from "../../types/curso";
import { getErrorMessage } from "../../utils/apiError";
import {
	AdvancedFilters,
	Button,
	DataTable,
	FilterField,
	Icon,
	PageHeader,
	PhaseChip,
	Select,
	SideDrawer,
	TableToolbar,
	useNotice,
	type DataTableColumn,
	Realce,
} from "../ui";
import OrientacaoDrawer from "./OrientacaoDrawer";

const TODOS = "__todos__";
const POR_PAGINA = 10;

const formatarNota = (n: number | null) =>
	n === null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Acompanhamento de todos os TCCs do curso (imagem orientacoes.png). */
export default function Orientacoes() {
	const notificar = useNotice();
	const [params] = useSearchParams();
	const { filtro, periodoEfetivo: selecionado } = usePeriodo();
	const { ano, semestre, desde_ano, desde_semestre } = filtroComoTexto(filtro);
	const { cursos, padrao } = useCursosCoordenacao();

	const [busca, setBusca] = useState(params.get("q") ?? "");
	const [buscaAplicada, setBuscaAplicada] = useState(busca);
	const [curso, setCurso] = useState<string | null>(null);
	const [filtrosAbertos, setFiltrosAbertos] = useState(false);
	const [fase, setFase] = useState("");
	const [pagina, setPagina] = useState(1);

	const [resposta, setResposta] = useState<{ total: number; itens: ItemAcompanhamento[] }>({ total: 0, itens: [] });
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);

	const [editando, setEditando] = useState<ItemAcompanhamento | null>(null);
	const [orientadoresPorCurso, setOrientadoresPorCurso] = useState<Record<number, OrientadorCurso[]>>({});
	const [novaAberta, setNovaAberta] = useState(false);

	const cursoEfetivo = curso ?? padrao;

	// Busca com pequeno atraso para não consultar a API a cada tecla.
	useEffect(() => {
		const t = setTimeout(() => setBuscaAplicada(busca), 350);
		return () => clearTimeout(t);
	}, [busca]);

	useEffect(() => setPagina(1), [buscaAplicada, cursoEfetivo, fase, ano, semestre]);

	useEffect(() => {
		let ativo = true;
		setCarregando(true);
		acompanhamentoService
			.listarAcompanhamento({ q: buscaAplicada, id_curso: cursoEfetivo, fase, ano, semestre, desde_ano, desde_semestre, pagina, limite: POR_PAGINA })
			.then((r) => ativo && setResposta({ total: r.total, itens: r.itens }))
			.catch((e) => {
				if (!ativo) return;
				setResposta({ total: 0, itens: [] });
				notificar(getErrorMessage(e, "Erro ao carregar as orientações"), "error");
			})
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [buscaAplicada, cursoEfetivo, fase, ano, semestre, desde_ano, desde_semestre, pagina, recarregar, notificar]);

	const carregarOrientadores = async (idCurso: number) => {
		if (orientadoresPorCurso[idCurso]) return orientadoresPorCurso[idCurso];
		const lista = await orientacaoService.getOrientadoresCurso(idCurso).catch(() => []);
		setOrientadoresPorCurso((atual) => ({ ...atual, [idCurso]: lista }));
		return lista;
	};

	const abrirEdicao = async (item: ItemAcompanhamento) => {
		await carregarOrientadores(item.id_curso);
		setEditando(item);
	};

	const filtrosAtivos = fase ? 1 : 0;
	const limparFiltros = () => {
		setBusca("");
		setFase("");
		setCurso(null);
	};

	const inicio = (pagina - 1) * POR_PAGINA;
	const colunas: DataTableColumn<ItemAcompanhamento>[] = [
		{ key: "n", header: "#", className: "mono", render: (i) => String(inicio + resposta.itens.indexOf(i) + 1).padStart(2, "0") },
		{
			key: "discente",
			header: "Matrícula / Discente",
			render: (i) => (
				<>
					<strong>
						<Realce texto={i.nome} busca={buscaAplicada} />
					</strong>
					<small className="cell-subtitle mono">
						<Realce texto={i.matricula} busca={buscaAplicada} />
					</small>
				</>
			),
		},
		{ key: "periodo", header: "Período", className: "mono", render: (i) => i.periodo },
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
					{i.pendencias.map((p) => (
						<em className="pending-label" key={p.codigo}>
							<Icon name="error" size={13} />
							{p.descricao}
						</em>
					))}
				</div>
			),
		},
		{ key: "orientador", header: "Orientador", render: (i) => <Realce texto={i.orientador?.nome ?? "—"} busca={buscaAplicada} /> },
		{ key: "nota", header: "Nota média", className: "grade-cell", render: (i) => formatarNota(i.nota_media) },
		{
			key: "acoes",
			header: "Ações",
			srOnlyHeader: true,
			render: (i) => (
				<Button variant="tertiary" className="compact" onClick={() => abrirEdicao(i)}>
					Editar
				</Button>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Orientações"
				description="Acompanhe o progresso de todos os TCCs do curso."
				action={
					<Button icon="add" onClick={() => setNovaAberta(true)}>
						Nova orientação
					</Button>
				}
			/>
			<TableToolbar
				search={busca}
				onSearchChange={setBusca}
				searchPlaceholder="Buscar por discente, matrícula ou orientador"
				filterCount={filtrosAtivos}
				filtersOpen={filtrosAbertos}
				onToggleFilters={() => setFiltrosAbertos((x) => !x)}
			>
				<Select value={cursoEfetivo || TODOS} onChange={(e) => setCurso(e.target.value === TODOS ? "" : e.target.value)} aria-label="Filtrar por curso">
					{cursos.length !== 1 && <option value={TODOS}>Todos os cursos</option>}
					{cursos.map((c) => (
						<option key={c.id} value={String(c.id)}>
							{nomeCurso(c)}
						</option>
					))}
				</Select>
			</TableToolbar>
			{filtrosAbertos && (
				<AdvancedFilters resultCount={resposta.total} onClear={limparFiltros}>
					<FilterField label="Fase">
						<Select value={fase || TODOS} onChange={(e) => setFase(e.target.value === TODOS ? "" : e.target.value)}>
							<option value={TODOS}>Todos</option>
							<option value="1">Projeto (TCC I)</option>
							<option value="2">TCC (TCC II)</option>
						</Select>
					</FilterField>
				</AdvancedFilters>
			)}
			<DataTable
				columns={colunas}
				rows={resposta.itens}
				getRowKey={(i) => i.id_tcc}
				total={resposta.total}
				page={pagina}
				pageSize={POR_PAGINA}
				onPageChange={setPagina}
				tableClassName="orientation-table"
				loading={carregando}
				onClearFilters={limparFiltros}
			/>

			<OrientacaoDrawer
				item={editando}
				orientadores={editando ? (orientadoresPorCurso[editando.id_curso] ?? []) : []}
				onClose={() => setEditando(null)}
				onSalvo={() => {
					setEditando(null);
					setRecarregar((x) => x + 1);
				}}
			/>

			<NovaOrientacao
				aberta={novaAberta}
				idCurso={cursoEfetivo}
				periodo={selecionado ? { ano: String(selecionado.ano), semestre: String(selecionado.semestre) } : null}
				rotulo={rotuloPeriodo(selecionado)}
				carregarOrientadores={carregarOrientadores}
				onClose={() => setNovaAberta(false)}
				onSalvo={() => {
					setNovaAberta(false);
					setRecarregar((x) => x + 1);
				}}
			/>
		</>
	);
}

interface NovaOrientacaoProps {
	aberta: boolean;
	idCurso: string;
	periodo: { ano: string; semestre: string } | null;
	rotulo: string;
	carregarOrientadores: (idCurso: number) => Promise<OrientadorCurso[]>;
	onClose: () => void;
	onSalvo: () => void;
}

/** "Nova orientação": define o orientador de um TCC do período que ainda não tem. */
function NovaOrientacao({ aberta, idCurso, periodo, rotulo, carregarOrientadores, onClose, onSalvo }: NovaOrientacaoProps) {
	const notificar = useNotice();
	const [semOrientador, setSemOrientador] = useState<ItemAcompanhamento[]>([]);
	const [orientadores, setOrientadores] = useState<OrientadorCurso[]>([]);
	const [tcc, setTcc] = useState("");
	const [docente, setDocente] = useState("");
	const [salvando, setSalvando] = useState(false);

	useEffect(() => {
		if (!aberta || !periodo) return;
		let ativo = true;
		(async () => {
			const itens: ItemAcompanhamento[] = [];
			for (let pagina = 1; ; pagina++) {
				const r = await acompanhamentoService.listarAcompanhamento({ ...periodo, id_curso: idCurso, pagina, limite: 100 });
				itens.push(...r.itens);
				if (pagina >= r.total_paginas) break;
			}
			if (!ativo) return;
			const lista = itens.filter((i) => !i.orientador);
			setSemOrientador(lista);
			setTcc(lista[0] ? String(lista[0].id_tcc) : "");
		})().catch((e) => notificar(getErrorMessage(e, "Erro ao carregar os discentes"), "error"));
		return () => {
			ativo = false;
		};
	}, [aberta, periodo?.ano, periodo?.semestre, idCurso, notificar]); // eslint-disable-line react-hooks/exhaustive-deps

	const selecionado = semOrientador.find((i) => String(i.id_tcc) === tcc);
	useEffect(() => {
		if (!selecionado) return;
		carregarOrientadores(selecionado.id_curso).then((lista) => {
			setOrientadores(lista);
			setDocente(lista[0]?.codigo_docente ?? "");
		});
	}, [selecionado?.id_tcc]); // eslint-disable-line react-hooks/exhaustive-deps

	const salvar = async () => {
		if (!selecionado || !docente) return;
		setSalvando(true);
		try {
			await acompanhamentoService.definirOrientador({ idTcc: selecionado.id_tcc, fase: selecionado.fase, novoCodigo: docente, atual: null });
			notificar("Orientação registrada.");
			onSalvo();
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível registrar a orientação."), "error");
		} finally {
			setSalvando(false);
		}
	};

	return (
		<SideDrawer
			open={aberta}
			onClose={onClose}
			eyebrow="ACOMPANHAMENTO"
			title="Nova orientação"
			footer={
				<>
					<Button variant="secondary" onClick={onClose} disabled={salvando}>
						Cancelar
					</Button>
					<Button onClick={salvar} disabled={salvando || !selecionado || !docente}>
						Registrar orientação
					</Button>
				</>
			}
		>
			<section className="drawer-section">
				<h3>Discente e orientador</h3>
				<p className="section-description">
					Discentes de {rotulo} que ainda não têm orientador. Um convite de orientação já aceito é registrado em nome da coordenação.
				</p>
				{semOrientador.length === 0 ? (
					<div className="readonly-box">
						<Icon name="check_circle" size={16} />
						<span>Todos os discentes do período já têm orientador.</span>
					</div>
				) : (
					<div className="form-stack">
						<label>
							<span>Discente</span>
							<Select value={tcc} onChange={(e) => setTcc(e.target.value)}>
								{semOrientador.map((i) => (
									<option key={i.id_tcc} value={String(i.id_tcc)}>
										{`${i.nome} · ${i.matricula} · ${i.fase === 2 ? "TCC II" : "TCC I"}`}
									</option>
								))}
							</Select>
						</label>
						<label>
							<span>Orientador</span>
							<Select value={docente} onChange={(e) => setDocente(e.target.value)}>
								{orientadores.map((o) => (
									<option key={o.codigo_docente} value={o.codigo_docente}>
										{o.docente?.nome ?? o.codigo_docente}
									</option>
								))}
							</Select>
						</label>
					</div>
				)}
			</section>
		</SideDrawer>
	);
}
