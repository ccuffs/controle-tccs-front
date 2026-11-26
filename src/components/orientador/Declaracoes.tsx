import { useEffect, useMemo, useState } from "react";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useListaLocal } from "../../hooks/useListaLocal";
import { gerarDeclaracaoHtml, gerarDeclaracaoTabelaHtml, getDeclaracoes } from "../../services/declaracoes-service";
import type { Declaracao } from "../../types/declaracao";
import { abrirHtmlEmNovaAba } from "../../utils/abrirHtml";
import { getErrorMessage } from "../../utils/apiError";
import {
	Button,
	Card,
	DataTable,
	FilterBar,
	FilterField,
	Icon,
	PageHeader,
	PhaseChip,
	Select,
	StatusChip,
	useNotice,
	type DataTableColumn,
} from "../ui";

const TODOS = "__todos__";
type Participacao = "orientacao" | "banca";

/** Declarações de orientação e banca do docente (imagem declaracao_orientador.png). */
export default function Declaracoes() {
	const notificar = useNotice();
	const { periodos } = usePeriodo();
	const [periodo, setPeriodo] = useState("");
	const [participacao, setParticipacao] = useState<"" | Participacao>("");
	const [declaracoes, setDeclaracoes] = useState<Declaracao[]>([]);
	const [carregando, setCarregando] = useState(true);

	const [ano, semestre] = periodo ? periodo.split("/") : ["", ""];

	useEffect(() => {
		let ativo = true;
		setCarregando(true);
		getDeclaracoes({ ano, semestre })
			.then((r) => ativo && setDeclaracoes(r.declaracoes))
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar declarações"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [ano, semestre, notificar]);

	const { filtrados, visiveis, pagina, setPagina, porPagina } = useListaLocal(
		declaracoes,
		(d) => !participacao || d.tipo_participacao === participacao,
		[participacao, declaracoes],
	);

	const abrir = (gerar: () => Promise<string>) =>
		abrirHtmlEmNovaAba(gerar).catch((e) => notificar(getErrorMessage(e, "Não foi possível gerar a declaração."), "error"));

	const opcoesPeriodo = useMemo(() => periodos.map((p) => `${p.ano}/${p.semestre}`), [periodos]);

	const colunas: DataTableColumn<Declaracao>[] = [
		{ key: "discente", header: "Discente", render: (d) => <strong>{d.nome_dicente ?? d.matricula ?? "—"}</strong> },
		{ key: "titulo", header: "Título", className: "description-cell", render: (d) => d.titulo_tcc || "—" },
		{ key: "periodo", header: "Período", className: "mono", render: (d) => `${d.ano}/${d.semestre}` },
		{ key: "fase", header: "Fase", render: (d) => <PhaseChip fase={d.fase} /> },
		{
			key: "participacao",
			header: "Participação",
			render: (d) => <StatusChip type="neutral">{d.tipo_participacao === "orientacao" ? "Orientador" : "Banca"}</StatusChip>,
		},
		{
			key: "acao",
			header: "Ação",
			render: (d) => (
				<Button variant="tertiary" icon="download" onClick={() => abrir(() => gerarDeclaracaoHtml(d.id_tcc, d.tipo_participacao))}>
					PDF
				</Button>
			),
		},
	];

	const consolidado = (tipo: Participacao, icone: string, titulo: string, texto: string) => (
		<Card className="card declaration-card">
			<div className="document-icon">
				<Icon name={icone} />
			</div>
			<div>
				<h2>{titulo}</h2>
				<p>{texto}</p>
			</div>
			<Button variant="secondary" icon="download" onClick={() => abrir(() => gerarDeclaracaoTabelaHtml(tipo, { ano, semestre }))}>
				Baixar PDF
			</Button>
		</Card>
	);

	return (
		<>
			<PageHeader title="Declarações" description="Emita comprovantes das suas orientações e participações em bancas." />
			<FilterBar>
				<FilterField label="Período">
					<Select value={periodo || TODOS} onChange={(e) => setPeriodo(e.target.value === TODOS ? "" : e.target.value)}>
						<option value={TODOS}>Todos os períodos</option>
						{opcoesPeriodo.map((p) => (
							<option key={p} value={p}>
								{p}
							</option>
						))}
					</Select>
				</FilterField>
				<FilterField label="Participação">
					<Select value={participacao || TODOS} onChange={(e) => setParticipacao(e.target.value === TODOS ? "" : (e.target.value as Participacao))}>
						<option value={TODOS}>Todas</option>
						<option value="orientacao">Orientador</option>
						<option value="banca">Banca</option>
					</Select>
				</FilterField>
			</FilterBar>
			<div className="declaration-cards">
				{consolidado("orientacao", "description", "Declaração consolidada de orientações", "Reúne todas as orientações concluídas no período selecionado.")}
				{consolidado("banca", "groups", "Declaração consolidada de bancas", "Reúne suas participações como membro de banca.")}
			</div>
			<DataTable
				title={
					<div>
						<h2>Declarações individuais</h2>
						<p>Documentos disponíveis por trabalho.</p>
					</div>
				}
				columns={colunas}
				rows={visiveis}
				getRowKey={(d) => `${d.id_tcc}-${d.fase}-${d.tipo_participacao}`}
				total={filtrados.length}
				page={pagina}
				pageSize={porPagina}
				onPageChange={setPagina}
				loading={carregando}
			/>
		</>
	);
}
