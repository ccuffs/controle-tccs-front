import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert } from "@mui/material";
import axiosInstance from "../../auth/axios";
import orientacaoService from "../../services/orientacao-service";
import { salvarAgendamento } from "../../services/defesas-acoes";
import { visaoGeralService } from "../../services/visao-geral-service";
import type { ItemAcompanhamento } from "../../types/acompanhamento";
import type { DefesaAgenda } from "../../types/dashboard";
import type { Docente } from "../../types/docente";
import type { OrientadorCurso } from "../../types/curso";
import { getErrorMessage } from "../../utils/apiError";
import { Button, DateTile, EmptyState, Icon, Input, ModalDialog, PlainButton, Select, useNotice } from "../ui";

interface AgendamentoDialogProps {
	open: boolean;
	/** Defesa existente (editar) ou null (agendar nova). */
	defesa: DefesaAgenda | null;
	/** TCCs com orientador que podem ser agendados (apenas para nova defesa). */
	trabalhos: ItemAcompanhamento[];
	onClose: () => void;
	onSalvo: () => void;
	/** Quando informado, fixa o orientador (perfil de orientador: o próprio usuário). */
	orientadorFixo?: { codigo: string; nome?: string };
}

interface Form {
	tcc: string;
	orientador: string;
	data: string;
	hora: string;
	local: string;
	avaliador1: string;
	avaliador2: string;
}

interface Disponibilidade {
	data_defesa: string;
	hora_defesa: string;
	disponivel?: boolean;
}

interface Grade {
	datas?: string[];
	disponibilidades?: Disponibilidade[];
}

/** Dados brutos de disponibilidade por docente — usados na verificação de conflitos. */
interface GradeDocente {
	codigo: string;
	nome: string;
	disponibilidades: Disponibilidade[];
}

/** Horários válidos para agendamento manual: 30 em 30 minutos, de 13h30 a 21h00. */
const SLOTS_VALIDOS = Array.from({ length: 16 }, (_, i) => {
	const totalMin = 13 * 60 + 30 + i * 30;
	return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
});

const chave = (d: string, h: string) => `${d}|${h}`;
const hhmm = (hora: string) => hora.slice(0, 5);
const dataLonga = (iso: string) => {
	const texto = new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});
	return texto.charAt(0).toUpperCase() + texto.slice(1);
};

function datasNaoDefinidas(e: unknown): boolean {
	if (axios.isAxiosError(e) && e.response?.status === 404) return true;
	return getErrorMessage(e, "").toLowerCase().includes("datas de defesa não encontradas");
}

/**
 * "Agendar defesa" / "Editar agendamento": trabalho, orientador, avaliadores, data/hora e local.
 * Avaliadores vêm antes da data/hora; quando todos os três docentes estão selecionados
 * a interseção de disponibilidades é calculada e os horários em comum são exibidos para seleção.
 * Há opção de selecionar data/hora manualmente (com verificação de conflitos ao confirmar).
 */
export default function AgendamentoDialog({ open, defesa, trabalhos, onClose, onSalvo, orientadorFixo }: AgendamentoDialogProps) {
	const notificar = useNotice();
	const [form, setForm] = useState<Form>({ tcc: "", orientador: "", data: "", hora: "", local: "", avaliador1: "", avaliador2: "" });
	const [docentes, setDocentes] = useState<Docente[]>([]);
	const [orientadoresCurso, setOrientadoresCurso] = useState<OrientadorCurso[]>([]);
	const [salvando, setSalvando] = useState(false);

	// Estado da interseção de disponibilidades
	const [carregandoHorarios, setCarregandoHorarios] = useState(false);
	const [erroHorarios, setErroHorarios] = useState("");
	const [semDatas, setSemDatas] = useState(false);
	const [horariosComuns, setHorariosComuns] = useState<Record<string, string[]>>({});
	/** Grades brutas dos três docentes — usadas para verificar conflitos no modo manual. */
	const [gradesDocentes, setGradesDocentes] = useState<GradeDocente[]>([]);

	/** Habilita entrada manual de data/hora quando há horários comuns disponíveis. */
	const [modoManual, setModoManual] = useState(false);

	// Inicializar / resetar o formulário ao abrir
	useEffect(() => {
		if (!open) return;
		setModoManual(false);
		if (defesa) {
			const banca = defesa.membros.filter((m) => m.papel === "banca").map((m) => m.codigo);
			const oriCodigo = orientadorFixo?.codigo ?? defesa.membros.find((m) => m.papel === "orientador")?.codigo ?? "";
			setForm({
				tcc: String(defesa.id_tcc),
				orientador: oriCodigo,
				data: defesa.data,
				hora: hhmm(defesa.hora), // normaliza para HH:MM
				local: defesa.local ?? "",
				avaliador1: banca[0] ?? "",
				avaliador2: banca[1] ?? "",
			});
		} else {
			const tccId = trabalhos[0] ? String(trabalhos[0].id_tcc) : "";
			const primeiroTcc = trabalhos[0];
			setForm({
				tcc: tccId,
				orientador: orientadorFixo?.codigo ?? primeiroTcc?.orientador?.codigo ?? "",
				data: "",
				hora: "",
				local: "",
				avaliador1: "",
				avaliador2: "",
			});
		}
	}, [open, defesa, trabalhos, orientadorFixo]);

	const trabalho = trabalhos.find((t) => String(t.id_tcc) === form.tcc);
	const idCurso = defesa?.id_curso ?? trabalho?.id_curso;

	/** Contexto da oferta (ano/semestre/curso/fase) necessário para buscar a grade. */
	const oferta = defesa
		? { ano: defesa.ano, semestre: defesa.semestre, id_curso: defesa.id_curso, fase: defesa.fase }
		: trabalho
		  ? { ano: trabalho.ano, semestre: trabalho.semestre, id_curso: trabalho.id_curso, fase: trabalho.fase }
		  : null;

	// Carregar docentes de banca do curso
	useEffect(() => {
		if (!open || !idCurso) return;
		let ativo = true;
		orientacaoService
			.getDocentesBancaCurso(idCurso)
			.then((lista) => ativo && setDocentes(lista.map((d) => d.docente).filter((d): d is Docente => Boolean(d))))
			.catch(() => ativo && setDocentes([]));
		return () => {
			ativo = false;
		};
	}, [open, idCurso]);

	// Carregar orientadores do curso — somente na visão de coordenador (sem orientadorFixo)
	useEffect(() => {
		if (!open || !idCurso || orientadorFixo) return;
		let ativo = true;
		orientacaoService
			.getOrientadoresCurso(idCurso)
			.then((lista) => ativo && setOrientadoresCurso(lista))
			.catch(() => ativo && setOrientadoresCurso([]));
		return () => {
			ativo = false;
		};
	}, [open, idCurso, orientadorFixo]);

	// Opções de avaliador: docentes de banca do curso + membros atuais (ex.: externos), excluindo o orientador.
	const opcoes = useMemo(() => {
		const mapa = new Map<string, string>();
		docentes.forEach((d) => mapa.set(d.codigo, d.nome ?? d.codigo));
		defesa?.membros.filter((m) => m.papel === "banca").forEach((m) => mapa.set(m.codigo, `${m.nome}${m.externo ? " · Externo" : ""}`));
		if (form.orientador) mapa.delete(form.orientador);
		return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt"));
	}, [docentes, defesa, form.orientador]);

	// Opções de orientador (apenas coordenador + TCC sem orientador definido)
	const opcoesOrientador = useMemo(() => {
		const mapa = new Map<string, string>();
		orientadoresCurso.forEach((o) => {
			if (o.docente) mapa.set(o.codigo_docente, o.docente.nome ?? o.codigo_docente);
		});
		return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt"));
	}, [orientadoresCurso]);

	// ----- Interseção de disponibilidades -----
	const todosSelecionados = Boolean(form.orientador && form.avaliador1 && form.avaliador2 && oferta);

	/** Chave estável para disparar o efeito apenas quando os docentes ou o contexto mudam. */
	const chaveCarga =
		todosSelecionados && oferta
			? `${oferta.ano}/${oferta.semestre}/${oferta.id_curso}/${oferta.fase}:${form.orientador},${form.avaliador1},${form.avaliador2}`
			: "";

	/** Nomes dos três docentes para usar nas mensagens de conflito. */
	const nomeOrientador =
		orientadorFixo?.nome ??
		defesa?.membros.find((m) => m.papel === "orientador")?.nome ??
		trabalho?.orientador?.nome ??
		"";

	/** Retorna o nome exibível de um docente pelo código. */
	const nomeDocente = (codigo: string): string => {
		if (codigo === form.orientador) return nomeOrientador || codigo;
		return opcoes.find(([c]) => c === codigo)?.[1] ?? codigo;
	};

	useEffect(() => {
		if (!chaveCarga || !oferta) {
			setHorariosComuns({});
			setGradesDocentes([]);
			setErroHorarios("");
			setSemDatas(false);
			setModoManual(false);
			return;
		}
		const codigos = [form.orientador, form.avaliador1, form.avaliador2];
		let ativo = true;
		setCarregandoHorarios(true);
		setErroHorarios("");
		setSemDatas(false);
		setModoManual(false);
		const { ano, semestre, id_curso, fase } = oferta;
		Promise.all(codigos.map((c) => axiosInstance.get<{ grade?: Grade }>(`/disponibilidade-banca/grade/${c}/${ano}/${semestre}/${id_curso}/${fase}`)))
			.then((respostas) => {
				if (!ativo) return;
				const base = respostas[0]?.grade;
				if (!base || !base.datas?.length) {
					setSemDatas(true);
					return;
				}
				// Armazenar grades brutas para verificação de conflitos posterior
				setGradesDocentes(
					codigos.map((c, i) => ({
						codigo: c,
						nome: nomeDocente(c),
						disponibilidades: respostas[i]?.grade?.disponibilidades ?? [],
					})),
				);
				const livres = respostas.map(
					(r) =>
						new Set(
							(r.grade?.disponibilidades ?? [])
								.filter((d) => d.disponivel !== false && d.data_defesa && d.hora_defesa)
								.map((d) => chave(d.data_defesa, d.hora_defesa)),
						),
				);
				const porData: Record<string, string[]> = {};
				for (const d of base.disponibilidades ?? []) {
					const k = chave(d.data_defesa, d.hora_defesa);
					if (!livres.every((s) => s.has(k))) continue;
					const lista = (porData[d.data_defesa] ??= []);
					if (!lista.includes(d.hora_defesa)) lista.push(d.hora_defesa);
				}
				Object.values(porData).forEach((l) => l.sort());
				setHorariosComuns(porData);
			})
			.catch((e) => {
				if (!ativo) return;
				if (datasNaoDefinidas(e)) setSemDatas(true);
				else setErroHorarios("Não foi possível carregar as disponibilidades.");
			})
			.finally(() => ativo && setCarregandoHorarios(false));
		return () => {
			ativo = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chaveCarga]);

	const datasDisponiveis = useMemo(() => Object.keys(horariosComuns).sort(), [horariosComuns]);

	/** True quando os inputs manuais de data/hora devem estar habilitados. */
	const inputsManualHabilitados = modoManual || datasDisponiveis.length === 0;

	const alterar = (campo: keyof Form) => (valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

	/** Indica se o orientador já vem do TCC/defesa (campo somente-leitura no modo coordenador). */
	const orientadorDoTcc = Boolean(defesa?.membros.find((m) => m.papel === "orientador")?.codigo ?? trabalho?.orientador?.codigo);

	/** Converte "HH:MM" ou "HH:MM:SS" em minutos totais desde meia-noite. */
	const toMinutos = (hora: string) => {
		const partes = hora.slice(0, 5).split(":");
		return (Number(partes[0]) || 0) * 60 + (Number(partes[1]) || 0);
	};

	/**
	 * Verifica conflitos consultando as defesas **agendadas** no backend.
	 * Mais confiável do que inspecionar grades locais: o backend remove (ou não inclui)
	 * slots ocupados em vez de marcá-los como `disponivel: false`.
	 *
	 * Regra: se qualquer membro da banca aparece em outra defesa na mesma data, com
	 * horário a menos de 2 horas do horário selecionado, há conflito.
	 */
	const verificarConflitosAgenda = async (): Promise<string[]> => {
		if (!form.data || !form.hora || !oferta) return [];
		const minutosAlvo = toMinutos(form.hora);
		const JANELA_MINUTOS = 120;
		const codigosAlvo = [form.orientador, form.avaliador1, form.avaliador2].filter(Boolean);
		try {
			const { itens } = await visaoGeralService.defesas(
				{
					ano: oferta.ano,
					semestre: oferta.semestre,
					id_curso: String(oferta.id_curso),
					fase: String(oferta.fase),
				},
				{ status: "agendada" },
			);
			const conflitantes = new Set<string>();
			for (const d of itens) {
				if (defesa && d.id_tcc === defesa.id_tcc) continue; // ignora a própria defesa sendo editada
				if (d.data !== form.data) continue;
				if (Math.abs(toMinutos(d.hora) - minutosAlvo) >= JANELA_MINUTOS) continue;
				for (const membro of d.membros) {
					if (codigosAlvo.includes(membro.codigo)) {
						conflitantes.add(membro.nome || nomeDocente(membro.codigo));
					}
				}
			}
			return [...conflitantes];
		} catch {
			// Fallback: verifica por grades locais (disponivel: false dentro da janela)
			if (gradesDocentes.length === 0) return [];
			return gradesDocentes
				.filter(({ disponibilidades }) =>
					disponibilidades.some(
						(d) =>
							d.data_defesa === form.data &&
							d.disponivel === false &&
							Math.abs(toMinutos(d.hora_defesa) - minutosAlvo) < JANELA_MINUTOS,
					),
				)
				.map(({ nome, codigo }) => nome || codigo);
		}
	};

	const salvar = async () => {
		const idTcc = Number(form.tcc);
		const fase = defesa?.fase ?? trabalho?.fase;
		if (!idTcc || !fase || !form.orientador) {
			notificar("Selecione um trabalho com orientador definido.", "error");
			return;
		}
		if (!form.data || !form.hora || !form.avaliador1 || !form.avaliador2) {
			notificar("Informe data, horário e os dois avaliadores.", "error");
			return;
		}
		if (form.avaliador1 === form.avaliador2) {
			notificar("Os avaliadores devem ser diferentes.", "error");
			return;
		}
		setSalvando(true);
		try {
			// Verificar conflitos quando a data foi escolhida manualmente (consulta defesas agendadas)
			if (modoManual || (todosSelecionados && datasDisponiveis.length === 0)) {
				const conflitos = await verificarConflitosAgenda();
				if (conflitos.length > 0) {
					const lista = conflitos.join(", ");
					notificar(
						`Conflito de agenda: ${lista} já ${conflitos.length === 1 ? "possui" : "possuem"} banca agendada em horário próximo (janela de 2 h). Escolha outro horário ou solicite ajuste de disponibilidade.`,
						"error",
					);
					return;
				}
			}
			await salvarAgendamento({
				idTcc,
				fase,
				orientador: form.orientador,
				avaliadores: [form.avaliador1, form.avaliador2],
				data: form.data,
				hora: form.hora,
				local: form.local,
			});
			notificar(defesa ? "Agendamento atualizado com sucesso." : "Defesa agendada.");
			onSalvo();
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar o agendamento."), "error");
		} finally {
			setSalvando(false);
		}
	};

	const seletorAvaliador = (campo: "avaliador1" | "avaliador2", rotulo: string) => (
		<label>
			<span>{rotulo}</span>
			<Select value={form[campo]} onChange={(e) => alterar(campo)(e.target.value)} displayEmpty>
				<option value="">Selecione…</option>
				{opcoes.map(([codigo, nome]) => (
					<option key={codigo} value={codigo}>
						{nome}
					</option>
				))}
			</Select>
		</label>
	);

	/** Seção de horários: slots em comum ou mensagens de estado. */
	const renderHorarios = () => {
		if (!todosSelecionados) {
			return (
				<div className="readonly-box" style={{ marginTop: 16 }}>
					<Icon name="calendar_clock" />
					<span>Selecione os dois avaliadores para ver os horários disponíveis em comum.</span>
				</div>
			);
		}
		if (carregandoHorarios) {
			return <EmptyState icon="hourglass_top" title="Carregando horários…" text="Buscando a disponibilidade do orientador e da banca." />;
		}
		if (erroHorarios) {
			return (
				<div className="readonly-box warning-box" style={{ marginTop: 16 }}>
					<Icon name="error" />
					<span>{erroHorarios}</span>
				</div>
			);
		}
		if (semDatas) {
			return (
				<EmptyState
					icon="calendar_month"
					title="Datas de defesa não definidas"
					text="A coordenação ainda não cadastrou as datas de defesa deste período. Informe a data manualmente abaixo."
				/>
			);
		}
		if (datasDisponiveis.length === 0) {
			return (
				<EmptyState
					icon="event_busy"
					title="Nenhum horário em comum"
					text="O orientador e os membros da banca ainda não têm horários em comum. Informe a data manualmente abaixo."
				/>
			);
		}
		// Horários em comum encontrados
		return (
			<div className="horarios-comuns" style={{ marginTop: 16 }}>
				{datasDisponiveis.map((data) => (
					<div className="horario-dia" key={data}>
						<DateTile data={data} />
						<div>
							<strong>{dataLonga(data)}</strong>
							<div className="horario-opcoes">
								{horariosComuns[data]?.map((hora) => {
									const marcado = form.data === data && form.hora === hora;
									return (
										<button
											type="button"
											key={hora}
											className={`horario-opcao ${marcado ? "selected" : ""}`}
											aria-pressed={marcado}
											onClick={() =>
												setForm((f) => ({
													...f,
													data: marcado ? "" : data,
													hora: marcado ? "" : hhmm(hora), // normaliza para HH:MM
												}))
											}
										>
											{marcado && <Icon name="check" size={14} />}
											{hhmm(hora)}
										</button>
									);
								})}
							</div>
						</div>
					</div>
				))}
			</div>
		);
	};

	/** Seção de data/hora manual: somente renderizada após carregar. */
	const renderDataHoraManual = () => {
		if (!todosSelecionados || carregandoHorarios) return null;

		const temSlots = datasDisponiveis.length > 0;
		const rotuloData = temSlots ? "Data selecionada" : "Data";
		const rotuloHora = temSlots ? "Hora selecionada" : "Hora";

		return (
			<div style={{ marginTop: 16 }}>
				{/* Aviso e toggle — apenas quando há slots disponíveis */}
				{temSlots && (
					<div style={{ marginBottom: 12 }}>
						{modoManual ? (
							<>
								<div className="readonly-box warning-box" style={{ marginBottom: 8 }}>
									<Icon name="warning" />
									<span>
										Horário definido manualmente. Pode haver incompatibilidade na agenda da banca. Ao confirmar, o sistema
										verificará conflitos com bancas já marcadas.
									</span>
								</div>
								<PlainButton onClick={() => setModoManual(false)}>
									<Icon name="event_available" size={16} />
									Usar horários disponíveis
								</PlainButton>
							</>
						) : (
							<PlainButton onClick={() => setModoManual(true)}>
								<Icon name="edit_calendar" size={16} />
								Selecionar manualmente
							</PlainButton>
						)}
					</div>
				)}

				<div className="form-grid dialog-form">
					<label>
						<span>{rotuloData}</span>
						<Input
							type="date"
							value={form.data}
							onChange={(e) => alterar("data")(e.target.value)}
							disabled={!inputsManualHabilitados}
						/>
					</label>
					<label>
						<span>{rotuloHora}</span>
						<Select
							value={hhmm(form.hora)}
							onChange={(e) => alterar("hora")(e.target.value)}
							displayEmpty
							disabled={!inputsManualHabilitados}
						>
							<option value="">Selecione o horário…</option>
							{SLOTS_VALIDOS.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</Select>
					</label>
				</div>
			</div>
		);
	};

	return (
		<ModalDialog
			open={open}
			onClose={onClose}
			icon={defesa ? "edit_calendar" : "calendar_add_on"}
			title={defesa ? "Editar agendamento" : "Agendar defesa"}
			description={defesa ? `${defesa.estudante} · ${defesa.fase_descricao}` : "Selecione o trabalho e defina os dados do encontro."}
			actions={
				<>
					<Button variant="secondary" onClick={onClose} disabled={salvando}>
						Cancelar
					</Button>
					<Button onClick={salvar} disabled={salvando}>
						{defesa ? "Salvar agendamento" : "Confirmar agendamento"}
					</Button>
				</>
			}
		>
			<div className="form-grid dialog-form">
				{/* Discente — apenas ao criar */}
				{!defesa && (
					<label className="full">
						<span>Discente</span>
						<Select
							value={form.tcc}
							onChange={(e) => {
								const novoTcc = e.target.value;
								const t = trabalhos.find((x) => String(x.id_tcc) === novoTcc);
								setForm((f) => ({
									...f,
									tcc: novoTcc,
									orientador: orientadorFixo?.codigo ?? t?.orientador?.codigo ?? "",
									avaliador1: "",
									avaliador2: "",
								}));
							}}
						>
							{trabalhos.map((t) => (
								<option key={t.id_tcc} value={String(t.id_tcc)}>
									{`${t.nome} · ${t.fase === 2 ? "TCC II" : "TCC I"}`}
								</option>
							))}
						</Select>
					</label>
				)}

				{/* Orientador */}
				{orientadorFixo || orientadorDoTcc ? (
					// Perfil de orientador (fixo) ou TCC com orientador definido → somente-leitura
					<label className="full">
						<span>Orientador</span>
						<Input value={nomeOrientador || form.orientador} readOnly />
					</label>
				) : (
					// Coordenador criando/editando defesa cujo TCC ainda não tem orientador → selector
					<label className="full">
						<span>Orientador</span>
						<Select value={form.orientador} onChange={(e) => alterar("orientador")(e.target.value)} displayEmpty>
							<option value="">Selecione o orientador…</option>
							{opcoesOrientador.map(([codigo, nome]) => (
								<option key={codigo} value={codigo}>
									{nome}
								</option>
							))}
						</Select>
					</label>
				)}

				{/* Avaliadores — antes de data/hora */}
				{seletorAvaliador("avaliador1", "Primeiro avaliador")}
				{seletorAvaliador("avaliador2", "Segundo avaliador")}
			</div>

			{/* Horários em comum (tiles) ou mensagens de estado */}
			{renderHorarios()}

			{/* Data/hora manual + toggle Selecionar manualmente */}
			{renderDataHoraManual()}

			{/* Local — sempre visível */}
			<div className="form-grid dialog-form" style={{ marginTop: 16 }}>
				<label className="full">
					<span>Local</span>
					<Input value={form.local} onChange={(e) => alterar("local")(e.target.value)} placeholder="Sala ou link da videoconferência" />
				</label>
			</div>

			{!defesa && trabalhos.length === 0 && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Não há trabalhos com orientador no período selecionado.
				</Alert>
			)}
		</ModalDialog>
	);
}
