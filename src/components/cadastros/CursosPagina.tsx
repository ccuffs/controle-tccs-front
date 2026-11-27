import { useEffect, useState } from "react";
import { contemBusca, useListaLocal } from "../../hooks/useListaLocal";
import cursosService from "../../services/cursos-service";
import type { Curso } from "../../types/curso";
import { getErrorMessage } from "../../utils/apiError";
import {
	Button,
	ConfirmDialog,
	DataTable,
	Input,
	PageHeader,
	RowActions,
	Select,
	SideDrawer,
	TableToolbar,
	useNotice,
	type DataTableColumn,
	Realce,
} from "../ui";

const TURNOS = ["Matutino", "Vespertino", "Integral", "Noturno"];

interface Formulario {
	id: number | null;
	codigo: string;
	nome: string;
	turno: string;
}

/** Cadastro de cursos (fora do design; mesmo padrão das demais telas de cadastro, só ADMIN). */
export default function CursosPagina() {
	const notificar = useNotice();
	const [cursos, setCursos] = useState<Curso[]>([]);
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);
	const [busca, setBusca] = useState("");
	const [form, setForm] = useState<Formulario | null>(null);
	const [remover, setRemover] = useState<Curso | null>(null);
	const [salvando, setSalvando] = useState(false);

	useEffect(() => {
		let ativo = true;
		setCarregando(true);
		cursosService
			.getCursos()
			.then((lista) => ativo && setCursos(lista ?? []))
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar cursos"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [recarregar, notificar]);

	const { filtrados, visiveis, pagina, setPagina, porPagina } = useListaLocal(
		cursos,
		(c) => contemBusca(busca, c.nome, c.codigo, c.turno),
		[busca, cursos],
	);

	const salvar = async () => {
		if (!form) return;
		if (!form.codigo.trim() || !form.nome.trim() || !form.turno) {
			notificar("Preencha código, nome e turno.", "error");
			return;
		}
		setSalvando(true);
		try {
			const dados = { codigo: form.codigo.trim(), nome: form.nome.trim(), turno: form.turno };
			if (form.id) await cursosService.updateCurso({ ...dados, id: form.id });
			else await cursosService.createCurso(dados);
			notificar(form.id ? "Curso atualizado." : "Curso cadastrado.");
			setForm(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar o curso."), "error");
		} finally {
			setSalvando(false);
		}
	};

	const confirmarRemocao = async () => {
		if (!remover) return;
		setSalvando(true);
		try {
			await cursosService.deleteCurso(remover.id);
			notificar("Curso removido.");
			setRemover(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível remover o curso."), "error");
		} finally {
			setSalvando(false);
		}
	};

	const colunas: DataTableColumn<Curso>[] = [
		{ key: "codigo", header: "Código", className: "mono", render: (c) => <Realce texto={c.codigo ?? "—"} busca={busca} /> },
		{
			key: "nome",
			header: "Nome",
			render: (c) => (
				<strong>
					<Realce texto={c.nome ?? "—"} busca={busca} />
				</strong>
			),
		},
		{ key: "turno", header: "Turno", render: (c) => <Realce texto={c.turno ?? "—"} busca={busca} /> },
		{
			key: "acoes",
			header: "Ações",
			srOnlyHeader: true,
			render: (c) => (
				<RowActions
					label={`Ações de ${c.nome ?? "curso"}`}
					onEdit={() => setForm({ id: c.id, codigo: String(c.codigo ?? ""), nome: c.nome ?? "", turno: c.turno ?? "" })}
					onRemove={() => setRemover(c)}
				/>
			),
		},
	];

	const alterar = (campo: keyof Omit<Formulario, "id">) => (valor: string) =>
		setForm((f) => (f ? { ...f, [campo]: valor } : f));

	return (
		<>
			<PageHeader
				title="Cursos"
				description={`${cursos.length} ${cursos.length === 1 ? "curso cadastrado" : "cursos cadastrados"}.`}
				action={
					<Button icon="add" onClick={() => setForm({ id: null, codigo: "", nome: "", turno: "" })}>
						Novo curso
					</Button>
				}
			/>
			<TableToolbar search={busca} onSearchChange={setBusca} searchPlaceholder="Buscar por nome, código ou turno" />
			<DataTable
				columns={colunas}
				rows={visiveis}
				getRowKey={(c) => c.id}
				total={filtrados.length}
				page={pagina}
				pageSize={porPagina}
				onPageChange={setPagina}
				loading={carregando}
				onClearFilters={() => setBusca("")}
			/>
			<SideDrawer
				open={Boolean(form)}
				onClose={() => setForm(null)}
				eyebrow="CADASTRO"
				title={form?.id ? "Editar curso" : "Novo curso"}
				footer={
					<>
						<Button variant="secondary" onClick={() => setForm(null)} disabled={salvando}>
							Cancelar
						</Button>
						<Button onClick={salvar} disabled={salvando}>
							{form?.id ? "Salvar alterações" : "Cadastrar curso"}
						</Button>
					</>
				}
			>
				{form && (
					<section className="drawer-section">
						<h3>Dados do curso</h3>
						<div className="form-grid">
							<label>
								<span>Código</span>
								<Input value={form.codigo} onChange={(e) => alterar("codigo")(e.target.value)} inputMode="numeric" />
							</label>
							<label>
								<span>Turno</span>
								<Select value={form.turno} onChange={(e) => alterar("turno")(e.target.value)} displayEmpty>
									<option value="">Selecione…</option>
									{(form.turno && !TURNOS.includes(form.turno) ? [form.turno, ...TURNOS] : TURNOS).map((t) => (
										<option key={t} value={t}>
											{t}
										</option>
									))}
								</Select>
							</label>
							<label className="full">
								<span>Nome</span>
								<Input value={form.nome} onChange={(e) => alterar("nome")(e.target.value)} />
							</label>
						</div>
					</section>
				)}
			</SideDrawer>
			<ConfirmDialog
				open={Boolean(remover)}
				title="Remover curso"
				description={remover ? `Remover o curso ${remover.nome ?? ""}? Esta ação não pode ser desfeita.` : ""}
				confirmLabel="Remover"
				busy={salvando}
				onConfirm={confirmarRemocao}
				onClose={() => setRemover(null)}
			/>
		</>
	);
}
