import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Checkbox } from "@mui/material";
import { nomeCurso, useCursosCoordenacao } from "../../hooks/useCursosCoordenacao";
import { usePerfilAtual } from "../../hooks/usePerfilAtual";
import { contemBusca, useListaLocal } from "../../hooks/useListaLocal";
import docentesService from "../../services/docentes-service";
import orientadoresService from "../../services/orientadores-service";
import type { Docente } from "../../types/docente";
import { getErrorMessage } from "../../utils/apiError";
import {
	Avatar,
	Button,
	ConfirmDialog,
	DataTable,
	Input,
	PageHeader,
	Realce,
	RowActions,
	Select,
	SideDrawer,
	TableToolbar,
	useNotice,
	type DataTableColumn,
} from "../ui";

const TODOS = "__todos__";
/** Docente fictício usado como marcador provisório ("Aguardando professor"); não pode ser vinculado. */
const DOCENTE_PROVISORIO = "sem.professor";

type Modo = "vincular" | "novo" | "editar";

interface Formulario {
	codigo: string;
	siape: string;
	nome: string;
	email: string;
	sala: string;
	curso: string;
	docenteVincular: string;
}

const FORM_VAZIO: Formulario = { codigo: "", siape: "", nome: "", email: "", sala: "", curso: "", docenteVincular: "" };

const numeroOuNulo = (valor: string) => (valor.trim() === "" ? null : Number(valor));

/** Orientadores do curso (orientador_curso); o vínculo é feito com docentes do curso (docente_curso). */
export default function Docentes() {
	const notificar = useNotice();
	// Código do docente: só no perfil Administrador, abaixo do nome (no Coordenador não aparece).
	const ehAdministracao = usePerfilAtual() === "administracao";
	const { cursos, padrao } = useCursosCoordenacao();

	const [curso, setCurso] = useState<string | null>(null);
	const [busca, setBusca] = useState("");

	const [docentes, setDocentes] = useState<Docente[]>([]);
	const [vinculos, setVinculos] = useState<Map<string, Set<number>>>(new Map());
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);

	const [drawer, setDrawer] = useState<{ modo: Modo; dados: Formulario } | null>(null);
	const [salvando, setSalvando] = useState(false);
	const [desvincular, setDesvincular] = useState<Docente | null>(null);
	const [removerGrupo, setRemoverGrupo] = useState(false);
	const [erroDesvinculo, setErroDesvinculo] = useState<string | null>(null);

	const abrirDesvinculo = (docente: Docente | null) => {
		setDesvincular(docente);
		setRemoverGrupo(false);
		setErroDesvinculo(null);
	};

	const cursoEfetivo = curso ?? padrao;

	useEffect(() => {
		if (cursos.length === 0) return;
		let ativo = true;
		setCarregando(true);
		Promise.all([
			docentesService.getDocentes(),
			Promise.all(cursos.map((c) => orientadoresService.getOrientadoresPorCurso(c.id).catch(() => []))),
		])
			.then(([lista, porCurso]) => {
				if (!ativo) return;
				const mapa = new Map<string, Set<number>>();
				porCurso.flat().forEach((o) => {
					if (!mapa.has(o.codigo_docente)) mapa.set(o.codigo_docente, new Set());
					mapa.get(o.codigo_docente)?.add(Number(o.id_curso));
				});
				setDocentes((lista ?? []).filter((d) => !d.externo));
				setVinculos(mapa);
			})
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar docentes"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [cursos, recarregar, notificar]);

	const ehOrientador = useCallback(
		(d: Docente) => {
			const cursosDoDocente = vinculos.get(d.codigo);
			if (!cursosDoDocente) return false;
			return cursoEfetivo ? cursosDoDocente.has(Number(cursoEfetivo)) : cursosDoDocente.size > 0;
		},
		[vinculos, cursoEfetivo],
	);

	const orientadores = useMemo(() => docentes.filter(ehOrientador), [docentes, ehOrientador]);

	const { filtrados, visiveis, pagina, setPagina, porPagina } = useListaLocal(
		orientadores,
		(d) => contemBusca(busca, d.nome, ehAdministracao ? d.codigo : null, d.siape, d.email),
		[busca, orientadores, ehAdministracao],
	);

	/** Docentes do curso escolhido no drawer (docente_curso) que ainda não orientam nele. */
	const cursoVinculo = drawer?.dados.curso ?? "";
	const vinculaveis = useMemo(
		() =>
			cursoVinculo
				? docentes.filter(
						(d) =>
							d.codigo !== DOCENTE_PROVISORIO &&
							(d.cursos ?? []).some((c) => String(c.id) === cursoVinculo) &&
							!vinculos.get(d.codigo)?.has(Number(cursoVinculo)),
					)
				: [],
		[docentes, vinculos, cursoVinculo],
	);

	const limparFiltros = () => {
		setBusca("");
		setCurso(null);
	};

	const abrir = (modo: Modo, docente?: Docente) =>
		setDrawer({
			modo,
			dados: docente
				? {
						...FORM_VAZIO,
						codigo: docente.codigo,
						siape: docente.siape ? String(docente.siape) : "",
						nome: docente.nome ?? "",
						email: docente.email ?? "",
						sala: docente.sala ? String(docente.sala) : "",
						curso: cursoEfetivo,
					}
				: { ...FORM_VAZIO, curso: cursoEfetivo || (cursos[0] ? String(cursos[0].id) : "") },
		});

	// Trocar o curso limpa o docente escolhido, pois a lista de docentes depende do curso.
	const alterar = (campo: keyof Formulario) => (valor: string) =>
		setDrawer((atual) =>
			atual
				? {
						...atual,
						dados: { ...atual.dados, [campo]: valor, ...(campo === "curso" ? { docenteVincular: "" } : {}) },
					}
				: atual,
		);

	const salvar = async () => {
		if (!drawer) return;
		const { modo, dados } = drawer;
		if (modo === "vincular" && (!dados.docenteVincular || !dados.curso)) {
			notificar("Selecione o docente e o curso.", "error");
			return;
		}
		if (modo !== "vincular" && (!dados.codigo.trim() || !dados.nome.trim() || !dados.email.includes("@"))) {
			notificar("Preencha código, nome e um e-mail válido.", "error");
			return;
		}
		if ([dados.siape, dados.sala].some((v) => v.trim() !== "" && Number.isNaN(Number(v)))) {
			notificar("SIAPE e sala devem ser numéricos.", "error");
			return;
		}
		setSalvando(true);
		try {
			if (modo === "vincular") {
				await orientadoresService.createOrientacao({ codigo_docente: dados.docenteVincular, id_curso: Number(dados.curso) });
				notificar("Orientador vinculado ao curso.");
			} else {
				const payload = {
					codigo: dados.codigo.trim(),
					nome: dados.nome.trim(),
					email: dados.email.trim(),
					siape: numeroOuNulo(dados.siape),
					sala: numeroOuNulo(dados.sala),
				};
				if (modo === "novo") {
					await docentesService.createDocente(payload);
					try {
						await orientadoresService.createOrientacao({ codigo_docente: payload.codigo, id_curso: Number(dados.curso) });
						notificar("Docente cadastrado e vinculado como orientador.");
					} catch (e) {
						notificar(getErrorMessage(e, "Docente cadastrado, mas o vínculo com o curso falhou. Use Vincular orientador."), "error");
					}
				} else {
					await docentesService.updateDocente(payload);
					notificar("Docente atualizado com sucesso.");
				}
			}
			setDrawer(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar."), "error");
		} finally {
			setSalvando(false);
		}
	};

	const confirmarDesvinculo = async () => {
		if (!desvincular || !cursoEfetivo) return;
		setSalvando(true);
		setErroDesvinculo(null);
		try {
			await orientadoresService.deleteOrientacao(cursoEfetivo, desvincular.codigo, removerGrupo);
			notificar(removerGrupo ? "Vínculo e grupo de orientador removidos." : "Vínculo de orientador removido.");
			abrirDesvinculo(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			// Mantém o diálogo aberto com o motivo (ex.: orientações ativas).
			setErroDesvinculo(getErrorMessage(e, "Não foi possível remover o vínculo."));
		} finally {
			setSalvando(false);
		}
	};

	const colunas: DataTableColumn<Docente>[] = [
		{
			key: "nome",
			header: "Nome",
			render: (d) => (
				<div className="table-person">
					<Avatar nome={d.nome ?? d.codigo} size="small" />
					<div>
						<strong>
							<Realce texto={d.nome ?? d.codigo} busca={busca} />
						</strong>
						{ehAdministracao && (
							<small className="cell-subtitle mono">
								<Realce texto={d.codigo} busca={busca} />
							</small>
						)}
					</div>
				</div>
			),
		},
		{ key: "siape", header: "SIAPE", className: "mono", render: (d) => <Realce texto={d.siape ?? "—"} busca={busca} /> },
		{ key: "email", header: "E-mail", render: (d) => <Realce texto={d.email} busca={busca} /> },
		{
			key: "acoes",
			header: "Ações",
			srOnlyHeader: true,
			render: (d) => (
				<RowActions
					label={`Ações de ${d.nome ?? d.codigo}`}
					onEdit={() => abrir("editar", d)}
					onRemove={cursoEfetivo ? () => abrirDesvinculo(d) : undefined}
					removeLabel="Remover vínculo"
				/>
			),
		},
	];

	const cursoSelecionado = cursos.find((c) => String(c.id) === cursoEfetivo);
	const titulo =
		drawer?.modo === "editar" ? "Editar docente" : drawer?.modo === "novo" ? "Cadastrar novo docente" : "Vincular orientador";
	const rotuloSalvar =
		drawer?.modo === "novo" ? "Cadastrar e vincular" : drawer?.modo === "vincular" ? "Vincular orientador" : "Salvar alterações";

	const seletorCurso = (rotulo: string) =>
		drawer && (
			<label>
				<span>{rotulo}</span>
				<Select value={drawer.dados.curso} onChange={(e) => alterar("curso")(e.target.value)}>
					{cursos.map((c) => (
						<option key={c.id} value={String(c.id)}>
							{nomeCurso(c)}
						</option>
					))}
				</Select>
			</label>
		);

	return (
		<>
			<PageHeader
				title="Docentes e orientadores"
				description={
					carregando
						? "Carregando…"
						: `${orientadores.length} ${orientadores.length === 1 ? "orientador vinculado" : "orientadores vinculados"} ${cursoSelecionado ? `a ${nomeCurso(cursoSelecionado)}` : "aos cursos"}.`
				}
				action={
					<Button icon="add" onClick={() => abrir("vincular")}>
						Vincular orientador
					</Button>
				}
			/>
			<TableToolbar
				search={busca}
				onSearchChange={setBusca}
				searchPlaceholder={ehAdministracao ? "Buscar por nome, SIAPE ou código" : "Buscar por nome ou SIAPE"}
			>
				<Select
					value={cursoEfetivo || TODOS}
					onChange={(e) => setCurso(e.target.value === TODOS ? "" : e.target.value)}
					aria-label="Filtrar por curso"
				>
					{cursos.length !== 1 && <option value={TODOS}>Todos os cursos</option>}
					{cursos.map((c) => (
						<option key={c.id} value={String(c.id)}>
							{nomeCurso(c)}
						</option>
					))}
				</Select>
			</TableToolbar>
			<DataTable
				tableClassName="primeira-coluna-livre"
				columns={colunas}
				rows={visiveis}
				getRowKey={(d) => d.codigo}
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
				title={titulo}
				footer={
					<>
						<Button
							variant="secondary"
							onClick={() => (drawer?.modo === "novo" ? alterarModo("vincular") : setDrawer(null))}
							disabled={salvando}
						>
							{drawer?.modo === "novo" ? "Voltar" : "Cancelar"}
						</Button>
						<Button onClick={salvar} disabled={salvando}>
							{rotuloSalvar}
						</Button>
					</>
				}
			>
				{drawer?.modo === "vincular" && (
					<section className="drawer-section">
						<h3>Vincular docente ao curso</h3>
						<p className="section-description">Selecione um docente já cadastrado para torná-lo orientador neste curso.</p>
						<div className="form-stack">
							<label>
								<span>Docente</span>
								<Select value={drawer.dados.docenteVincular} onChange={(e) => alterar("docenteVincular")(e.target.value)} displayEmpty>
									<option value="">
										{vinculaveis.length === 0 ? "Nenhum docente do curso disponível" : "Selecione…"}
									</option>
									{vinculaveis.map((d) => (
										<option key={d.codigo} value={d.codigo}>
											{`${d.nome ?? d.codigo}${d.siape ? ` · SIAPE ${d.siape}` : ""}`}
										</option>
									))}
								</Select>
							</label>
							{seletorCurso("Curso")}
						</div>
						<Alert severity="info">O vínculo não altera os dados cadastrais do docente.</Alert>
						<div className="alternative-action">
							<span>O docente ainda não está cadastrado?</span>
							<Button variant="secondary" icon="person_add" onClick={() => alterarModo("novo")}>
								Cadastrar novo docente
							</Button>
						</div>
					</section>
				)}
				{(drawer?.modo === "novo" || drawer?.modo === "editar") && (
					<section className="drawer-section">
						<h3>{drawer.modo === "novo" ? "Dados do novo docente" : "Dados do docente"}</h3>
						{drawer.modo === "novo" && (
							<p className="section-description">
								Cadastre os dados institucionais. Ao concluir, o docente também será vinculado ao curso selecionado.
							</p>
						)}
						<div className="form-grid">
							<label>
								<span>Código</span>
								<Input
									value={drawer.dados.codigo}
									onChange={(e) => alterar("codigo")(e.target.value)}
									readOnly={drawer.modo === "editar"}
									placeholder="ID UFFS do docente"
								/>
								{drawer.modo === "editar" && <small>Não pode ser alterado.</small>}
							</label>
							<label>
								<span>SIAPE</span>
								<Input
									value={drawer.dados.siape}
									onChange={(e) => alterar("siape")(e.target.value)}
									placeholder="7 dígitos"
									inputMode="numeric"
								/>
							</label>
							<label className="full">
								<span>Nome completo</span>
								<Input value={drawer.dados.nome} onChange={(e) => alterar("nome")(e.target.value)} placeholder="Nome do docente" />
							</label>
							<label className="full">
								<span>E-mail institucional</span>
								<Input
									type="email"
									value={drawer.dados.email}
									onChange={(e) => alterar("email")(e.target.value)}
									placeholder="nome@uffs.edu.br"
								/>
							</label>
							<label>
								<span>Sala</span>
								<Input
									value={drawer.dados.sala}
									onChange={(e) => alterar("sala")(e.target.value)}
									placeholder="Ex.: 214"
									inputMode="numeric"
								/>
							</label>
							{drawer.modo === "novo" && seletorCurso("Curso para vínculo")}
						</div>
						{drawer.modo === "novo" && (
							<Alert severity="info">O docente será cadastrado e o vínculo como orientador ficará ativo neste curso.</Alert>
						)}
					</section>
				)}
			</SideDrawer>

			<ConfirmDialog
				open={Boolean(desvincular)}
				title="Remover vínculo de orientador"
				description={
					desvincular && cursoSelecionado
						? `${desvincular.nome ?? desvincular.codigo} deixará de ser orientador em ${nomeCurso(cursoSelecionado)}. O cadastro do docente é mantido.`
						: ""
				}
				confirmLabel="Remover vínculo"
				busy={salvando}
				onConfirm={confirmarDesvinculo}
				onClose={() => abrirDesvinculo(null)}
			>
				<label className="confirm-option">
					<Checkbox
						checked={removerGrupo}
						onChange={(_, marcado) => {
							setRemoverGrupo(marcado);
							setErroDesvinculo(null);
						}}
						disabled={salvando}
						size="small"
					/>
					<span>
						<strong>Remover também o grupo de orientador</strong>
						<small>
							O docente perde as permissões de orientador no sistema. Só é possível sem orientações ativas e sem vínculo
							em outro curso.
						</small>
					</span>
				</label>
				{erroDesvinculo && <Alert severity="error">{erroDesvinculo}</Alert>}
			</ConfirmDialog>
		</>
	);

	function alterarModo(modo: Modo) {
		setDrawer((atual) => (atual ? { ...atual, modo } : atual));
	}
}
