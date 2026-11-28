import { useEffect, useState } from "react";
import { Switch } from "@mui/material";
import { useDocenteAtual } from "../../hooks/useDocenteAtual";
import { rotuloPeriodo, usePeriodo } from "../../contexts/PeriodoContext";
import temasTccService from "../../services/temas-tcc-service";
import type { OrientadorCurso } from "../../types/curso";
import type { AreaTcc, TemaTcc } from "../../types/tema-tcc";
import { getErrorMessage } from "../../utils/apiError";
import {
	AvisoPeriodoUnico,
	Button,
	Card,
	ConfirmDialog,
	EmptyState,
	Icon,
	Input,
	ModalDialog,
	PageHeader,
	RowActions,
	Select,
	StatusChip,
	Surface,
	Textarea,
	useNotice,
} from "../ui";

const NOVA_AREA = "__nova__";
const LIMITE_DESCRICAO = 600;

interface Formulario {
	id: number | null;
	area: string;
	novaArea: string;
	descricao: string;
}

const atualizadoEm = (iso?: string) =>
	iso ? `Atualizado em ${new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}` : "";

/** Oferta de temas do docente por curso (imagem meus_temas_novo_tema_orientador.png). */
export default function MeusTemas() {
	const notificar = useNotice();
	const { codigo } = useDocenteAtual();
	const { periodoEfetivo } = usePeriodo();

	const [cursos, setCursos] = useState<OrientadorCurso[]>([]);
	const [curso, setCurso] = useState("");
	const [temas, setTemas] = useState<TemaTcc[]>([]);
	const [areas, setAreas] = useState<AreaTcc[]>([]);
	const [vagas, setVagas] = useState("0");
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);

	const [form, setForm] = useState<Formulario | null>(null);
	const [remover, setRemover] = useState<TemaTcc | null>(null);
	const [ocupado, setOcupado] = useState(false);

	useEffect(() => {
		if (!codigo) return;
		temasTccService
			.getCursosOrientador(codigo)
			.then((lista) => {
				setCursos(lista);
				setCurso((atual) => atual || (lista[0] ? String(lista[0].id_curso) : ""));
			})
			.catch((e) => notificar(getErrorMessage(e, "Erro ao carregar seus cursos"), "error"));
	}, [codigo, notificar]);

	useEffect(() => {
		if (!codigo || !curso) return;
		let ativo = true;
		setCarregando(true);
		Promise.all([
			temasTccService.getTemasPorCursoOrientador(codigo, Number(curso), periodoEfetivo),
			temasTccService.getAreasTccPorDocente(codigo),
		])
			.then(([listaTemas, listaAreas]) => {
				if (!ativo) return;
				setTemas(listaTemas);
				setAreas(listaAreas);
				setVagas(String(listaTemas[0]?.vagasOferta ?? 0));
			})
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar seus temas"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [codigo, curso, periodoEfetivo?.ano, periodoEfetivo?.semestre, recarregar, notificar]); // eslint-disable-line react-hooks/exhaustive-deps

	const ocupadas = temas[0]?.vagasOcupadas ?? 0;

	const salvarVagas = async () => {
		const n = Number(vagas);
		if (!codigo || !Number.isInteger(n) || n < 0) {
			notificar("Informe um número de vagas válido.", "error");
			return;
		}
		setOcupado(true);
		try {
			await temasTccService.atualizarVagasOferta(codigo, Number(curso), n, periodoEfetivo);
			notificar("Vagas atualizadas.");
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar as vagas."), "error");
		} finally {
			setOcupado(false);
		}
	};

	const alternarAtivo = async (tema: TemaTcc, ativo: boolean) => {
		setTemas((lista) => lista.map((t) => (t.id === tema.id ? { ...t, ativo } : t)));
		try {
			await temasTccService.atualizarTemaTcc(tema.id, ativo);
		} catch (e) {
			setTemas((lista) => lista.map((t) => (t.id === tema.id ? { ...t, ativo: !ativo } : t)));
			notificar(getErrorMessage(e, "Não foi possível alterar o status do tema."), "error");
		}
	};

	const salvarTema = async () => {
		if (!form || !codigo) return;
		const criandoArea = form.area === NOVA_AREA;
		if (!form.descricao.trim() || (!form.area && !criandoArea) || (criandoArea && !form.novaArea.trim())) {
			notificar("Escolha a área e descreva o tema.", "error");
			return;
		}
		setOcupado(true);
		try {
			const idArea = criandoArea ? await temasTccService.criarAreaERetornarId(form.novaArea.trim(), codigo) : Number(form.area);
			const original = temas.find((t) => t.id === form.id);
			const dados = { descricao: form.descricao.trim(), id_area_tcc: idArea, codigo_docente: codigo, ativo: original?.ativo ?? true };
			if (form.id) await temasTccService.editarTemaCompleto(form.id, dados);
			else await temasTccService.criarTemaCompleto(dados);
			notificar(form.id ? "Tema atualizado." : "Tema criado.");
			setForm(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar o tema."), "error");
		} finally {
			setOcupado(false);
		}
	};

	const confirmarRemocao = async () => {
		if (!remover) return;
		setOcupado(true);
		try {
			await temasTccService.deletarTemaTcc(remover.id);
			notificar("Tema removido.");
			setRemover(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível remover o tema."), "error");
		} finally {
			setOcupado(false);
		}
	};

	return (
		<>
			<PageHeader
				title="Meus temas"
				description="Gerencie sua oferta de orientação por curso."
				action={
					<Button icon="add" onClick={() => setForm({ id: null, area: areas[0] ? String(areas[0].id) : "", novaArea: "", descricao: "" })} disabled={!curso}>
						Novo tema
					</Button>
				}
			/>
			<AvisoPeriodoUnico />
			<div className="table-toolbar card">
				<label>
					<span>Curso</span>
					<Select value={curso} onChange={(e) => setCurso(e.target.value)}>
						{cursos.map((c) => (
							<option key={c.id_curso} value={String(c.id_curso)}>
								{c.curso?.nome ?? `Curso ${c.id_curso}`}
							</option>
						))}
					</Select>
				</label>
			</div>
			<Surface className="card offer-card">
				<div>
					<span className="eyebrow">OFERTA DO DOCENTE</span>
					<h2>Vagas neste curso em {rotuloPeriodo(periodoEfetivo)}</h2>
					<p>
						As vagas são compartilhadas entre todos os seus temas ativos. {ocupadas} {ocupadas === 1 ? "vaga ocupada" : "vagas ocupadas"} no
						período.
					</p>
				</div>
				<div className="vacancy-editor">
					<Input type="number" min={0} value={vagas} onChange={(e) => setVagas(e.target.value)} aria-label="Vagas" />
					<span>vagas</span>
					<Button variant="secondary" icon="save" onClick={salvarVagas} disabled={ocupado}>
						Salvar
					</Button>
				</div>
			</Surface>
			<div className="theme-list">
				{temas.map((t) => (
					<Card className="card managed-theme" key={t.id}>
						<div className="theme-symbol">
							<Icon name="menu_book" />
						</div>
						<div className="managed-theme-content">
							<div>
								<span className="theme-area-label">ÁREA DO TCC</span>
								<StatusChip type="info">{t.areaTcc?.descricao ?? "—"}</StatusChip>
								<StatusChip type={t.ativo ? "success" : "neutral"}>{t.ativo ? "Ativo" : "Inativo"}</StatusChip>
							</div>
							<h2>{t.descricao}</h2>
							<small>{atualizadoEm(t.updatedAt)}</small>
						</div>
						<label className="switch-label">
							<Switch checked={t.ativo} onChange={(_, marcado) => alternarAtivo(t, marcado)} color="primary" />
							<span>{t.ativo ? "Ativo" : "Inativo"}</span>
						</label>
						<RowActions
							label="Ações do tema"
							onEdit={() => setForm({ id: t.id, area: String(t.id_area_tcc), novaArea: "", descricao: t.descricao })}
							onRemove={() => setRemover(t)}
						/>
					</Card>
				))}
				{!carregando && temas.length === 0 && (
					<Surface className="card">
						<EmptyState
							icon="menu_book"
							title="Nenhum tema cadastrado"
							text="Adicione temas para que os discentes encontrem sua oferta de orientação."
							action="Novo tema"
							onAction={() => setForm({ id: null, area: areas[0] ? String(areas[0].id) : "", novaArea: "", descricao: "" })}
						/>
					</Surface>
				)}
			</div>

			<ModalDialog
				open={Boolean(form)}
				onClose={() => setForm(null)}
				icon="menu_book"
				title={form?.id ? "Editar tema" : "Novo tema"}
				description="Adicione uma possibilidade de pesquisa à sua oferta."
				actions={
					<>
						<Button variant="secondary" onClick={() => setForm(null)} disabled={ocupado}>
							Cancelar
						</Button>
						<Button onClick={salvarTema} disabled={ocupado || (form?.area === NOVA_AREA && !form.novaArea.trim())}>
							Salvar tema
						</Button>
					</>
				}
			>
				{form && (
					<div className="form-stack">
						<label>
							<span>Área do TCC</span>
							<Select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} displayEmpty>
								<option value="">Selecione…</option>
								{areas.map((a) => (
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
									onChange={(e) => setForm({ ...form, novaArea: e.target.value })}
									placeholder="Ex.: Computação Gráfica"
									error={!form.novaArea.trim()}
									helperText={!form.novaArea.trim() ? "Informe o nome da nova área." : "A área será criada ao salvar o tema."}
								/>
							</label>
						)}
						<label>
							<span>Descrição</span>
							<Textarea
								rows={6}
								value={form.descricao}
								placeholder="Descreva o tema e possíveis recortes de pesquisa..."
								onChange={(e) => setForm({ ...form, descricao: e.target.value.slice(0, LIMITE_DESCRICAO) })}
							/>
							<small>
								{form.descricao.length} / {LIMITE_DESCRICAO}
							</small>
						</label>
					</div>
				)}
			</ModalDialog>

			<ConfirmDialog
				open={Boolean(remover)}
				title="Remover tema"
				description={remover ? `Remover o tema "${remover.descricao}"? Esta ação não pode ser desfeita.` : ""}
				confirmLabel="Remover"
				busy={ocupado}
				onConfirm={confirmarRemocao}
				onClose={() => setRemover(null)}
			/>
		</>
	);
}
