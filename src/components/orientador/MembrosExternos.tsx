import { useEffect, useState } from "react";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useDocenteAtual } from "../../hooks/useDocenteAtual";
import acompanhamentoService from "../../services/acompanhamento-service";
import {
	adicionarMembroExterno,
	buscarExternosPorNome,
	gerarDeclaracaoExternoHtml,
	getMembrosExternosTcc,
	removerMembroExterno,
} from "../../services/membros-externos-service";
import orientacaoService from "../../services/orientacao-service";
import temasTccService from "../../services/temas-tcc-service";
import type { ItemAcompanhamento } from "../../types/acompanhamento";
import type { OrientadorCurso } from "../../types/curso";
import type { Docente } from "../../types/docente";
import { abrirHtmlEmNovaAba } from "../../utils/abrirHtml";
import { getErrorMessage } from "../../utils/apiError";
import { dataBr } from "../../utils/formatos";
import {
	Avatar,
	Button,
	Card,
	ConfirmDialog,
	EmptyState,
	FilterBar,
	FilterField,
	Icon,
	Input,
	ModalDialog,
	PageHeader,
	PhaseChip,
	Select,
	StatusChip,
	Surface,
	useNotice,
} from "../ui";

interface Formulario {
	nome: string;
	email: string;
	instituicao: string;
	siape: string;
	codigo?: string;
}

const VAZIO: Formulario = { nome: "", email: "", instituicao: "", siape: "" };

/** Membros externos das bancas dos orientandos (imagem adiciona_membro_externo.png). */
export default function MembrosExternos() {
	const notificar = useNotice();
	const { selecionado } = usePeriodo();
	const { codigo } = useDocenteAtual();

	const [cursos, setCursos] = useState<OrientadorCurso[]>([]);
	const [curso, setCurso] = useState("");
	const [trabalhos, setTrabalhos] = useState<ItemAcompanhamento[]>([]);
	const [tcc, setTcc] = useState("");
	const [membros, setMembros] = useState<Docente[]>([]);
	const [dataDefesa, setDataDefesa] = useState<string | null>(null);
	const [recarregar, setRecarregar] = useState(0);

	const [form, setForm] = useState<Formulario | null>(null);
	const [sugestoes, setSugestoes] = useState<Docente[]>([]);
	const [remover, setRemover] = useState<Docente | null>(null);
	const [ocupado, setOcupado] = useState(false);

	useEffect(() => {
		if (!codigo) return;
		temasTccService
			.getCursosOrientador(codigo)
			.then((lista) => {
				setCursos(lista);
				setCurso((atual) => atual || (lista[0] ? String(lista[0].id_curso) : ""));
			})
			.catch(() => setCursos([]));
	}, [codigo]);

	useEffect(() => {
		if (!codigo || !curso || !selecionado) return;
		acompanhamentoService
			.listarAcompanhamento({
				codigo_docente: codigo,
				id_curso: curso,
				ano: String(selecionado.ano),
				semestre: String(selecionado.semestre),
				limite: 100,
			})
			.then((r) => {
				const meus = r.itens.filter((i) => i.orientador?.codigo === codigo);
				setTrabalhos(meus);
				setTcc((atual) => (meus.some((m) => String(m.id_tcc) === atual) ? atual : meus[0] ? String(meus[0].id_tcc) : ""));
			})
			.catch((e) => notificar(getErrorMessage(e, "Erro ao carregar seus orientandos"), "error"));
	}, [codigo, curso, selecionado, notificar]);

	const trabalho = trabalhos.find((t) => String(t.id_tcc) === tcc) ?? null;

	useEffect(() => {
		if (!trabalho) {
			setMembros([]);
			setDataDefesa(null);
			return;
		}
		let ativo = true;
		Promise.all([getMembrosExternosTcc(trabalho.id_tcc), orientacaoService.getDefesasPorTcc(trabalho.id_tcc).catch(() => [])])
			.then(([externos, defesas]) => {
				if (!ativo) return;
				setMembros(externos);
				setDataDefesa(defesas.find((d) => Number(d.fase) === trabalho.fase && d.data_defesa)?.data_defesa ?? null);
			})
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar membros externos"), "error"));
		return () => {
			ativo = false;
		};
	}, [trabalho?.id_tcc, trabalho?.fase, recarregar, notificar]); // eslint-disable-line react-hooks/exhaustive-deps

	// Busca de cadastro existente pelo nome (a partir de 2 letras).
	const nomeBusca = form && !form.codigo ? form.nome.trim() : "";
	useEffect(() => {
		if (nomeBusca.length < 2) {
			setSugestoes([]);
			return;
		}
		const t = setTimeout(() => buscarExternosPorNome(nomeBusca).then(setSugestoes).catch(() => setSugestoes([])), 300);
		return () => clearTimeout(t);
	}, [nomeBusca]);

	const salvar = async () => {
		if (!form || !trabalho) return;
		if (!form.nome.trim() || !form.email.includes("@") || !form.instituicao.trim()) {
			notificar("Informe nome, e-mail válido e instituição.", "error");
			return;
		}
		if (form.siape.trim() && !/^\d+$/.test(form.siape.trim())) {
			notificar("O SIAPE deve conter apenas números.", "error");
			return;
		}
		setOcupado(true);
		try {
			await adicionarMembroExterno({
				id_tcc: trabalho.id_tcc,
				fase: trabalho.fase,
				// Mesma data dos demais membros da banca (sem data, a defesa ainda não foi marcada).
				data_hora_defesa: dataDefesa ?? "",
				docente: {
					codigo: form.codigo,
					nome: form.nome.trim(),
					email: form.email.trim(),
					instituicao: form.instituicao.trim(),
					siape: form.siape.trim() ? Number(form.siape) : undefined,
				},
			});
			notificar("Membro externo adicionado à banca.");
			setForm(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível adicionar o membro externo."), "error");
		} finally {
			setOcupado(false);
		}
	};

	const confirmarRemocao = async () => {
		if (!remover || !trabalho) return;
		setOcupado(true);
		try {
			await removerMembroExterno(trabalho.id_tcc, remover.codigo, trabalho.fase);
			notificar("Membro externo removido da banca.");
			setRemover(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível remover o membro externo."), "error");
		} finally {
			setOcupado(false);
		}
	};

	const declaracao = (m: Docente) =>
		trabalho &&
		abrirHtmlEmNovaAba(() => gerarDeclaracaoExternoHtml(trabalho.id_tcc, m.codigo)).catch((e) =>
			notificar(getErrorMessage(e, "Não foi possível gerar a declaração."), "error"),
		);

	const defesaTexto = dataDefesa ? `${dataBr(dataDefesa)} · ${dataDefesa.slice(11, 16)}` : "Não agendada";

	return (
		<>
			<PageHeader
				title="Membros externos"
				description="Gerencie a participação externa nas bancas dos seus orientandos."
				action={
					<Button icon="add" onClick={() => setForm({ ...VAZIO })} disabled={!trabalho}>
						Adicionar externo
					</Button>
				}
			/>
			<FilterBar>
				<FilterField label="Curso">
					<Select value={curso} onChange={(e) => setCurso(e.target.value)}>
						{cursos.map((c) => (
							<option key={c.id_curso} value={String(c.id_curso)}>
								{c.curso?.nome ?? `Curso ${c.id_curso}`}
							</option>
						))}
					</Select>
				</FilterField>
				<FilterField label="Trabalho">
					<Select value={tcc} onChange={(e) => setTcc(e.target.value)} displayEmpty>
						{trabalhos.length === 0 && <option value="">Nenhum orientando no período</option>}
						{trabalhos.map((t) => (
							<option key={t.id_tcc} value={String(t.id_tcc)}>
								{`${t.nome} · ${t.fase === 2 ? "TCC (TCC II)" : "Projeto (TCC I)"}`}
							</option>
						))}
					</Select>
				</FilterField>
			</FilterBar>

			{membros.map((m) => (
				<Card className="card external-card" key={m.codigo} style={{ marginBottom: 12 }}>
					<div className="external-heading">
						<Avatar nome={m.nome ?? m.codigo} className="external-avatar" />
						<div>
							<div className="chips">
								<StatusChip type="neutral">
									<Icon name="domain" size={14} />
									Externo
								</StatusChip>
								{trabalho && <PhaseChip fase={trabalho.fase} />}
							</div>
							<h2>{m.nome ?? m.codigo}</h2>
							<p>{m.instituicao ?? "Instituição não informada"}</p>
						</div>
					</div>
					<div className="external-details">
						<div>
							<span>E-mail</span>
							<strong>{m.email}</strong>
						</div>
						<div>
							<span>SIAPE</span>
							<strong className="mono">{m.siape ?? "—"}</strong>
						</div>
						<div>
							<span>Defesa</span>
							<strong>{defesaTexto}</strong>
						</div>
						<div>
							<span>Discente</span>
							<strong>{trabalho?.nome ?? "—"}</strong>
						</div>
					</div>
					<div className="external-footer" style={{ gap: 8 }}>
						<Button variant="secondary" icon="description" onClick={() => declaracao(m)}>
							Declaração
						</Button>
						<Button variant="danger" icon="delete" onClick={() => setRemover(m)}>
							Remover da banca
						</Button>
					</div>
				</Card>
			))}
			{membros.length === 0 && (
				<Surface className="card">
					<EmptyState
						icon="domain_add"
						title="Nenhum membro externo nesta banca"
						text={trabalho ? "Você pode adicionar um membro externo à banca deste trabalho." : "Selecione um trabalho para gerenciar a banca."}
						action={trabalho ? "Adicionar membro externo" : undefined}
						onAction={() => setForm({ ...VAZIO })}
					/>
				</Surface>
			)}

			<ModalDialog
				open={Boolean(form)}
				onClose={() => setForm(null)}
				icon="domain_add"
				title="Adicionar membro externo"
				description="Busque um cadastro existente ou informe os dados do convidado."
				actions={
					<>
						<Button variant="secondary" onClick={() => setForm(null)} disabled={ocupado}>
							Cancelar
						</Button>
						<Button onClick={salvar} disabled={ocupado}>
							Adicionar à banca
						</Button>
					</>
				}
			>
				{form && (
					<div className="form-grid dialog-form">
						<label className="full">
							<span>Nome</span>
							<Input
								value={form.nome}
								onChange={(e) => setForm({ ...VAZIO, ...form, nome: e.target.value, codigo: undefined })}
								placeholder="Buscar ou cadastrar nome"
							/>
							{form.codigo ? (
								<small>Cadastro existente selecionado.</small>
							) : (
								sugestoes.length > 0 && (
									<div className="attention-detail-list" style={{ marginTop: 6 }}>
										{sugestoes.slice(0, 5).map((s) => (
											<Button
												key={s.codigo}
												variant="tertiary"
												onClick={() =>
													setForm({
														codigo: s.codigo,
														nome: s.nome ?? "",
														email: s.email ?? "",
														instituicao: s.instituicao ?? "",
														siape: s.siape ? String(s.siape) : "",
													})
												}
											>
												{`${s.nome ?? s.codigo}${s.instituicao ? ` · ${s.instituicao}` : ""}`}
											</Button>
										))}
									</div>
								)
							)}
						</label>
						<label className="full">
							<span>E-mail</span>
							<Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@instituicao.edu.br" />
						</label>
						<label>
							<span>Instituição</span>
							<Input value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} placeholder="Instituição de vínculo" />
						</label>
						<label>
							<span>SIAPE (opcional)</span>
							<Input value={form.siape} onChange={(e) => setForm({ ...form, siape: e.target.value })} placeholder="7 dígitos" inputMode="numeric" />
						</label>
						<label className="full">
							<span>Data da defesa</span>
							<Input value={defesaTexto} readOnly />
							<small>Usa a data já agendada para a banca deste trabalho.</small>
						</label>
					</div>
				)}
			</ModalDialog>

			<ConfirmDialog
				open={Boolean(remover)}
				title="Remover da banca"
				description={remover ? `Remover ${remover.nome ?? remover.codigo} da banca de ${trabalho?.nome ?? "este trabalho"}?` : ""}
				confirmLabel="Remover da banca"
				busy={ocupado}
				onConfirm={confirmarRemocao}
				onClose={() => setRemover(null)}
			/>
		</>
	);
}
