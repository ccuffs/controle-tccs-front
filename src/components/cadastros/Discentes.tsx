import { useCallback, useEffect, useState } from "react";
import { usePeriodo, rotuloPeriodo } from "../../contexts/PeriodoContext";
import dicentesController from "../../controllers/dicentes-controller";
import { nomeCurso, useCursosCoordenacao } from "../../hooks/useCursosCoordenacao";
import { contemBusca, useListaLocal } from "../../hooks/useListaLocal";
import dicentesService, { type DicenteComTccs } from "../../services/dicentes-service";
import { getErrorMessage } from "../../utils/apiError";
import {
	AdvancedFilters,
	Button,
	ConfirmDialog,
	DataTable,
	FilterField,
	Input,
	PageHeader,
	PhaseChip,
	RowActions,
	Select,
	SideDrawer,
	TableToolbar,
	useNotice,
	type DataTableColumn,
	Realce,
} from "../ui";

const TODOS = "__todos__";

interface Formulario {
	matricula: string;
	nome: string;
	email: string;
}

const faseAtual = (d: DicenteComTccs): number | null => {
	const fases = (d.trabalhosConclusao ?? []).map((t) => Number(t.fase));
	return fases.length ? Math.max(...fases) : null;
};

/** Cadastro de discentes (imagem discentes_coordenador.png). */
export default function Discentes() {
	const notificar = useNotice();
	const { selecionado } = usePeriodo();
	const { cursos, padrao } = useCursosCoordenacao();

	const [curso, setCurso] = useState<string | null>(null);
	const [busca, setBusca] = useState("");
	const [filtrosAbertos, setFiltrosAbertos] = useState(false);
	const [fase, setFase] = useState("");
	const [escopo, setEscopo] = useState<"periodo" | "todos">("periodo");

	const [discentes, setDiscentes] = useState<DicenteComTccs[]>([]);
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);

	const [drawer, setDrawer] = useState<{ modo: "novo" | "editar"; dados: Formulario } | null>(null);
	const [salvando, setSalvando] = useState(false);
	const [remover, setRemover] = useState<DicenteComTccs | null>(null);

	const cursoEfetivo = curso ?? padrao;
	const porPeriodo = escopo === "periodo";

	useEffect(() => {
		if (porPeriodo && !selecionado) return;
		let ativo = true;
		setCarregando(true);
		dicentesService
			.getDicentesFiltrados(
				porPeriodo ? { ano: selecionado?.ano, semestre: selecionado?.semestre, id_curso: cursoEfetivo } : {},
			)
			.then((lista) => ativo && setDiscentes(lista))
			.catch((e) => {
				if (!ativo) return;
				setDiscentes([]);
				notificar(getErrorMessage(e, "Erro ao buscar discentes"), "error");
			})
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [porPeriodo, selecionado, cursoEfetivo, recarregar, notificar]);

	const filtrosAtivos = (fase ? 1 : 0) + (porPeriodo ? 0 : 1);
	const { filtrados, visiveis, pagina, setPagina, porPagina } = useListaLocal(
		discentes,
		(d) => contemBusca(busca, d.nome, d.matricula, d.email) && (!fase || String(faseAtual(d)) === fase),
		[busca, fase, discentes],
	);

	const limparFiltros = () => {
		setBusca("");
		setFase("");
		setEscopo("periodo");
		setCurso(null);
	};

	const salvar = useCallback(async () => {
		if (!drawer) return;
		const editando = drawer.modo === "editar";
		const validacao = dicentesController.validateFormData(drawer.dados, editando);
		if (!validacao.isValid) {
			notificar(validacao.message ?? "Verifique os campos.", "error");
			return;
		}
		setSalvando(true);
		try {
			if (editando) {
				await dicentesService.updateDicente(drawer.dados.matricula, dicentesController.prepareDataForUpdate(drawer.dados));
				notificar("Discente atualizado com sucesso.");
			} else {
				await dicentesService.createDicente(dicentesController.prepareDataForCreate(drawer.dados));
				notificar(
					porPeriodo
						? "Discente cadastrado. Ele aparece neste período quando tiver um TCC (importação ou orientação)."
						: "Discente cadastrado com sucesso.",
				);
			}
			setDrawer(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, `Falha ao ${editando ? "atualizar" : "cadastrar"} o discente.`), "error");
		} finally {
			setSalvando(false);
		}
	}, [drawer, notificar, porPeriodo]);

	const confirmarRemocao = async () => {
		if (!remover) return;
		setSalvando(true);
		try {
			await dicentesService.deleteDicente(remover.matricula);
			notificar("Discente removido.");
			setRemover(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível remover o discente."), "error");
		} finally {
			setSalvando(false);
		}
	};

	const colunas: DataTableColumn<DicenteComTccs>[] = [
		{ key: "matricula", header: "Matrícula", className: "mono", render: (d) => <Realce texto={d.matricula} busca={busca} /> },
		{
			key: "nome",
			header: "Nome",
			render: (d) => (
				<strong>
					<Realce texto={d.nome} busca={busca} />
				</strong>
			),
		},
		{ key: "email", header: "E-mail", render: (d) => <Realce texto={d.email || "—"} busca={busca} /> },
		{
			key: "fase",
			header: "Fase atual",
			render: (d) => {
				const f = faseAtual(d);
				return f ? <PhaseChip fase={f} /> : "—";
			},
		},
		{
			key: "acoes",
			header: "Ações",
			srOnlyHeader: true,
			render: (d) => (
				<RowActions
					label={`Ações de ${d.nome}`}
					onEdit={() => setDrawer({ modo: "editar", dados: { matricula: d.matricula, nome: d.nome, email: d.email ?? "" } })}
					onRemove={() => setRemover(d)}
				/>
			),
		},
	];

	const descricao = porPeriodo
		? `${discentes.length} discentes em ${rotuloPeriodo(selecionado)}`
		: `${discentes.length} discentes cadastrados`;

	const alterarCampo = (campo: keyof Formulario) => (valor: string) =>
		setDrawer((atual) => (atual ? { ...atual, dados: { ...atual.dados, [campo]: valor } } : atual));

	return (
		<>
			<PageHeader
				title="Discentes"
				description={carregando ? "Carregando…" : descricao}
				action={
					<Button icon="add" onClick={() => setDrawer({ modo: "novo", dados: { matricula: "", nome: "", email: "" } })}>
						Adicionar discente
					</Button>
				}
			/>
			<TableToolbar
				search={busca}
				onSearchChange={setBusca}
				searchPlaceholder="Buscar por nome ou matrícula"
				filterCount={filtrosAtivos}
				filtersOpen={filtrosAbertos}
				onToggleFilters={() => setFiltrosAbertos((x) => !x)}
			>
				<Select
					value={cursoEfetivo || TODOS}
					onChange={(e) => setCurso(e.target.value === TODOS ? "" : e.target.value)}
					aria-label="Filtrar por curso"
					disabled={!porPeriodo}
				>
					{cursos.length !== 1 && <option value={TODOS}>Todos os cursos</option>}
					{cursos.map((c) => (
						<option key={c.id} value={String(c.id)}>
							{nomeCurso(c)}
						</option>
					))}
				</Select>
			</TableToolbar>
			{filtrosAbertos && (
				<AdvancedFilters resultCount={filtrados.length} onClear={limparFiltros}>
					<FilterField label="Fase">
						<Select value={fase || TODOS} onChange={(e) => setFase(e.target.value === TODOS ? "" : e.target.value)}>
							<option value={TODOS}>Todos</option>
							<option value="1">Projeto (TCC I)</option>
							<option value="2">TCC (TCC II)</option>
						</Select>
					</FilterField>
					<FilterField label="Discentes">
						<Select value={escopo} onChange={(e) => setEscopo(e.target.value as "periodo" | "todos")}>
							<option value="periodo">Com TCC no período</option>
							<option value="todos">Todos os cadastrados</option>
						</Select>
					</FilterField>
				</AdvancedFilters>
			)}
			<DataTable
				columns={colunas}
				rows={visiveis}
				getRowKey={(d) => d.matricula}
				total={filtrados.length}
				page={pagina}
				pageSize={porPagina}
				onPageChange={setPagina}
				loading={carregando}
				onClearFilters={limparFiltros}
			/>

			<SideDrawer
				open={Boolean(drawer)}
				onClose={() => setDrawer(null)}
				eyebrow="CADASTRO"
				title={drawer?.modo === "editar" ? "Editar discente" : "Adicionar discente"}
				footer={
					<>
						<Button variant="secondary" onClick={() => setDrawer(null)} disabled={salvando}>
							Cancelar
						</Button>
						<Button onClick={salvar} disabled={salvando}>
							{drawer?.modo === "editar" ? "Salvar alterações" : "Adicionar discente"}
						</Button>
					</>
				}
			>
				{drawer && (
					<section className="drawer-section">
						<h3>Dados do discente</h3>
						<div className="form-grid">
							<label>
								<span>Matrícula</span>
								<Input
									value={drawer.dados.matricula}
									onChange={(e) => alterarCampo("matricula")(e.target.value)}
									readOnly={drawer.modo === "editar"}
									inputMode="numeric"
								/>
								{drawer.modo === "editar" && <small>Não pode ser alterada na edição.</small>}
							</label>
							<label>
								<span>Nome completo</span>
								<Input value={drawer.dados.nome} onChange={(e) => alterarCampo("nome")(e.target.value)} />
							</label>
							<label className="full">
								<span>E-mail institucional</span>
								<Input
									type="email"
									value={drawer.dados.email}
									onChange={(e) => alterarCampo("email")(e.target.value)}
								/>
							</label>
						</div>
					</section>
				)}
			</SideDrawer>

			<ConfirmDialog
				open={Boolean(remover)}
				title="Remover discente"
				description={remover ? `Remover ${remover.nome} (${remover.matricula})? Esta ação não pode ser desfeita.` : ""}
				confirmLabel="Remover"
				busy={salvando}
				onConfirm={confirmarRemocao}
				onClose={() => setRemover(null)}
			/>
		</>
	);
}
