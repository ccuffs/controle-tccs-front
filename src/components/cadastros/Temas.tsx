import { useEffect, useState } from "react";
import { nomeCurso, useCursosCoordenacao } from "../../hooks/useCursosCoordenacao";
import { contemBusca, useListaLocal } from "../../hooks/useListaLocal";
import { rotuloPeriodo, usePeriodo } from "../../contexts/PeriodoContext";
import temasTccService from "../../services/temas-tcc-service";
import type { OrientadorCurso } from "../../types/curso";
import type { AreaTcc, TemaTcc } from "../../types/tema-tcc";
import { getErrorMessage } from "../../utils/apiError";
import {
	AdvancedFilters,
	AvisoPeriodoUnico,
	Button,
	ConfirmDialog,
	DataTable,
	FilterField,
	Input,
	PageHeader,
	Realce,
	RowActions,
	Select,
	SideDrawer,
	StatusChip,
	TableToolbar,
	Textarea,
	useNotice,
	type DataTableColumn,
} from "../ui";

const NOVA_AREA = "__nova__";

interface Formulario {
	id: number | null;
	docente: string;
	area: string;
	novaArea: string;
	descricao: string;
	ativo: boolean;
	vagas: string;
	vagasOriginais: number;
}

/** Temas de TCC por docente e curso (imagem temas_coordenador.png). */
export default function Temas() {
	const notificar = useNotice();
	const { cursos, padrao } = useCursosCoordenacao();
	const { periodoEfetivo } = usePeriodo();

	const [curso, setCurso] = useState<string | null>(null);
	const [busca, setBusca] = useState("");
	const [filtrosAbertos, setFiltrosAbertos] = useState(false);
	const [status, setStatus] = useState<"todos" | "ativos" | "inativos">("todos");

	const [temas, setTemas] = useState<TemaTcc[]>([]);
	const [orientadores, setOrientadores] = useState<OrientadorCurso[]>([]);
	const [areas, setAreas] = useState<AreaTcc[]>([]);
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);

	const [form, setForm] = useState<Formulario | null>(null);
	const [salvando, setSalvando] = useState(false);
	const [remover, setRemover] = useState<TemaTcc | null>(null);

	// Temas são sempre de um curso: sem curso escolhido, usa o único/primeiro disponível.
	const cursoEfetivo = curso || padrao || (cursos[0] ? String(cursos[0].id) : "");

	useEffect(() => {
		if (!cursoEfetivo) return;
		let ativo = true;
		setCarregando(true);
		Promise.all([
			temasTccService.getTemasPorCurso(Number(cursoEfetivo), periodoEfetivo),
			temasTccService.getDocentesOrientadoresPorCurso(Number(cursoEfetivo)),
		])
			.then(([listaTemas, listaOrientadores]) => {
				if (!ativo) return;
				setTemas(listaTemas);
				setOrientadores(listaOrientadores);
			})
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar temas"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [cursoEfetivo, periodoEfetivo?.ano, periodoEfetivo?.semestre, recarregar, notificar]); // eslint-disable-line react-hooks/exhaustive-deps

	// Áreas pertencem ao docente escolhido no formulário.
	const docenteForm = form?.docente ?? "";
	useEffect(() => {
		if (!docenteForm) {
			setAreas([]);
			return;
		}
		let ativo = true;
		temasTccService
			.getAreasTccPorDocente(docenteForm)
			.then((lista) => ativo && setAreas(lista))
			.catch(() => ativo && setAreas([]));
		return () => {
			ativo = false;
		};
	}, [docenteForm]);

	const { filtrados, visiveis, pagina, setPagina, porPagina } = useListaLocal(
		temas,
		(t) =>
			contemBusca(busca, t.descricao, t.areaTcc?.descricao, t.docente?.nome) &&
			(status === "todos" || (status === "ativos" ? t.ativo : !t.ativo)),
		[busca, status, temas],
	);

	const limparFiltros = () => {
		setBusca("");
		setStatus("todos");
	};

	const vagasDoDocente = (codigo: string) => temas.find((t) => t.codigo_docente === codigo)?.vagasOferta ?? 0;

	const abrirNovo = () => {
		const docente = orientadores[0]?.codigo_docente ?? "";
		setForm({ id: null, docente, area: "", novaArea: "", descricao: "", ativo: true, vagas: String(vagasDoDocente(docente)), vagasOriginais: vagasDoDocente(docente) });
	};

	const abrirEdicao = (t: TemaTcc) =>
		setForm({
			id: t.id,
			docente: t.codigo_docente,
			area: String(t.id_area_tcc),
			novaArea: "",
			descricao: t.descricao,
			ativo: t.ativo,
			vagas: String(t.vagasOferta ?? 0),
			vagasOriginais: t.vagasOferta ?? 0,
		});

	const alterar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) =>
		setForm((atual) => {
			if (!atual) return atual;
			const novo = { ...atual, [campo]: valor };
			if (campo === "docente") {
				const vagas = vagasDoDocente(String(valor));
				Object.assign(novo, { area: "", vagas: String(vagas), vagasOriginais: vagas });
			}
			return novo;
		});

	const salvar = async () => {
		if (!form) return;
		const criandoArea = form.area === NOVA_AREA;
		if (!form.docente || !form.descricao.trim() || (!form.area && !criandoArea) || (criandoArea && !form.novaArea.trim())) {
			notificar("Preencha docente, área e descrição.", "error");
			return;
		}
		const vagas = Number(form.vagas);
		if (!Number.isInteger(vagas) || vagas < 0) {
			notificar("Informe um número de vagas válido.", "error");
			return;
		}
		setSalvando(true);
		try {
			const idArea = criandoArea
				? await temasTccService.criarAreaERetornarId(form.novaArea.trim(), form.docente)
				: Number(form.area);
			const dados = { descricao: form.descricao.trim(), id_area_tcc: idArea, codigo_docente: form.docente, ativo: form.ativo };
			if (form.id) await temasTccService.editarTemaCompleto(form.id, dados);
			else await temasTccService.criarTemaCompleto(dados);
			if (vagas !== form.vagasOriginais) {
				await temasTccService.atualizarVagasOferta(form.docente, Number(cursoEfetivo), vagas, periodoEfetivo);
			}
			notificar(form.id ? "Tema atualizado." : "Tema criado.");
			setForm(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar o tema."), "error");
		} finally {
			setSalvando(false);
		}
	};

	const confirmarRemocao = async () => {
		if (!remover) return;
		setSalvando(true);
		try {
			await temasTccService.deletarTemaTcc(remover.id);
			notificar("Tema removido.");
			setRemover(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível remover o tema."), "error");
		} finally {
			setSalvando(false);
		}
	};

	// Enquanto as áreas do docente carregam, mantém a área atual do tema como opção.
	const areaAtual = temas.find((t) => String(t.id_area_tcc) === form?.area)?.areaTcc;
	const opcoesArea = areaAtual && !areas.some((a) => a.id === areaAtual.id) ? [areaAtual, ...areas] : areas;

	const colunas: DataTableColumn<TemaTcc>[] = [
		{
			key: "docente",
			header: "Docente",
			render: (t) => (
				<strong>
					<Realce texto={t.docente?.nome ?? t.codigo_docente} busca={busca} />
				</strong>
			),
		},
		{ key: "area", header: "Área do TCC", render: (t) => (
				<StatusChip type="info">
					<Realce texto={t.areaTcc?.descricao ?? "—"} busca={busca} />
				</StatusChip>
			),
		},
		{ key: "descricao", header: "Descrição", className: "description-cell", render: (t) => <Realce texto={t.descricao} busca={busca} /> },
		{
			key: "status",
			header: "Status",
			render: (t) => <StatusChip type={t.ativo ? "success" : "neutral"}>{t.ativo ? "Ativo" : "Inativo"}</StatusChip>,
		},
		{
			key: "vagas",
			header: "Vagas",
			render: (t) => <strong title="Vagas ocupadas de vagas ofertadas pelo docente">{`${t.vagasOcupadas ?? 0} de ${t.vagasOferta ?? 0}`}</strong>,
		},
		{
			key: "acoes",
			header: "Ações",
			srOnlyHeader: true,
			render: (t) => <RowActions label="Ações do tema" onEdit={() => abrirEdicao(t)} onRemove={() => setRemover(t)} />,
		},
	];

	return (
		<>
			<PageHeader
				title="Temas"
				description="Ofertas de temas por docente e curso."
				action={
					<Button icon="add" onClick={abrirNovo} disabled={orientadores.length === 0}>
						Novo tema
					</Button>
				}
			/>
			<AvisoPeriodoUnico />
			<TableToolbar
				search={busca}
				onSearchChange={setBusca}
				searchPlaceholder="Buscar por área, descrição ou docente"
				filterCount={status === "todos" ? 0 : 1}
				filtersOpen={filtrosAbertos}
				onToggleFilters={() => setFiltrosAbertos((x) => !x)}
			>
				<Select value={cursoEfetivo} onChange={(e) => setCurso(e.target.value)} aria-label="Filtrar por curso">
					{cursos.map((c) => (
						<option key={c.id} value={String(c.id)}>
							{nomeCurso(c)}
						</option>
					))}
				</Select>
			</TableToolbar>
			{filtrosAbertos && (
				<AdvancedFilters resultCount={filtrados.length} onClear={limparFiltros}>
					<FilterField label="Status">
						<Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
							<option value="todos">Todos</option>
							<option value="ativos">Ativos</option>
							<option value="inativos">Inativos</option>
						</Select>
					</FilterField>
				</AdvancedFilters>
			)}
			<DataTable
				columns={colunas}
				rows={visiveis}
				getRowKey={(t) => t.id}
				total={filtrados.length}
				page={pagina}
				pageSize={porPagina}
				onPageChange={setPagina}
				loading={carregando}
				onClearFilters={limparFiltros}
			/>

			<SideDrawer
				open={Boolean(form)}
				onClose={() => setForm(null)}
				eyebrow="CADASTRO"
				title={form?.id ? "Editar tema" : "Novo tema"}
				footer={
					<>
						<Button variant="secondary" onClick={() => setForm(null)} disabled={salvando}>
							Cancelar
						</Button>
						<Button
							onClick={salvar}
							disabled={salvando || (form?.area === NOVA_AREA && !form.novaArea.trim())}
						>
							{form?.id ? "Salvar alterações" : "Criar tema"}
						</Button>
					</>
				}
			>
				{form && (
					<section className="drawer-section">
						<h3>Informações do tema</h3>
						<div className="form-stack">
							<label>
								<span>Docente</span>
								<Select value={form.docente} onChange={(e) => alterar("docente", e.target.value)} disabled={Boolean(form.id)}>
									{orientadores.map((o) => (
										<option key={o.codigo_docente} value={o.codigo_docente}>
											{o.docente?.nome ?? o.codigo_docente}
										</option>
									))}
								</Select>
							</label>
							<label>
								<span>Área do TCC</span>
								<Select value={form.area} onChange={(e) => alterar("area", e.target.value)} displayEmpty>
									<option value="">Selecione…</option>
									{opcoesArea.map((a) => (
										<option key={a.id} value={String(a.id)}>
											{a.descricao}
										</option>
									))}
									<option value={NOVA_AREA}>+ Criar nova área</option>
								</Select>
							</label>
							{form.area === NOVA_AREA && (
								<label className="new-area-field">
									<span>Nome da nova área</span>
									<Input
										autoFocus
										value={form.novaArea}
										onChange={(e) => alterar("novaArea", e.target.value)}
										placeholder="Ex.: Computação Gráfica"
										error={!form.novaArea.trim()}
										helperText={!form.novaArea.trim() ? "Informe o nome da nova área." : "A área será criada ao salvar o tema."}
									/>
								</label>
							)}
							<label>
								<span>Descrição do tema</span>
								<Textarea rows={6} value={form.descricao} onChange={(e) => alterar("descricao", e.target.value)} />
							</label>
							<label>
								<span>Status</span>
								<Select value={form.ativo ? "ativo" : "inativo"} onChange={(e) => alterar("ativo", e.target.value === "ativo")}>
									<option value="ativo">Ativo</option>
									<option value="inativo">Inativo</option>
								</Select>
							</label>
							<label>
								<span>Vagas da oferta em {rotuloPeriodo(periodoEfetivo)}</span>
								<Input type="number" min={0} value={form.vagas} onChange={(e) => alterar("vagas", e.target.value)} />
								<small>Vagas do docente neste curso, compartilhadas entre todos os temas ativos dele.</small>
							</label>
						</div>
					</section>
				)}
			</SideDrawer>

			<ConfirmDialog
				open={Boolean(remover)}
				title="Remover tema"
				description={remover ? `Remover o tema "${remover.descricao}"? Esta ação não pode ser desfeita.` : ""}
				confirmLabel="Remover"
				busy={salvando}
				onConfirm={confirmarRemocao}
				onClose={() => setRemover(null)}
			/>
		</>
	);
}
