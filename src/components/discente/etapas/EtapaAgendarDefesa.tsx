import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import axiosInstance from "../../../auth/axios";
import { getErrorMessage } from "../../../utils/apiError";
import { Avatar, DateTile, EmptyState, Icon, StatusChip } from "../../ui";

export interface Participante {
	codigo: string;
	nome: string;
}

export interface Slot {
	data: string;
	hora: string;
}

interface DefesaDaFase {
	membro_banca: string;
	data_defesa?: string | null;
	orientador?: boolean;
	local?: string | null;
	membroBanca?: { nome?: string };
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

interface EtapaAgendarDefesaProps {
	oferta: { ano: number; semestre: number; id_curso: number; fase: number };
	orientador: Participante | null;
	/** Membros da banca da fase com convite aceito. */
	membros: Participante[];
	/** Registros de defesa da fase (um por membro). */
	defesas: DefesaDaFase[];
	selecionado: Slot | null;
	onSelecionar: (slot: Slot | null) => void;
}

/** "2026-12-07" → "Segunda-feira, 7 de dezembro". */
const dataLonga = (iso: string) => {
	const texto = new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
	return texto.charAt(0).toUpperCase() + texto.slice(1);
};
const hhmm = (hora: string) => hora.slice(0, 5);
const chave = (d: string, h: string) => `${d}|${h}`;

function datasNaoDefinidas(e: unknown): boolean {
	if (axios.isAxiosError(e) && e.response?.status === 404) return true;
	return getErrorMessage(e, "").toLowerCase().includes("datas de defesa não encontradas");
}

/**
 * Agendamento da defesa do discente (etapas 5 e 8 do stepper). Mostra os horários em que o
 * orientador e os dois membros da banca estão disponíveis, agrupados por data; o agendamento
 * em si acontece no botão "Agendar defesa" da jornada (POST /defesas/agendar no hook).
 * Com a defesa já agendada, mostra data, horário, local e banca.
 */
export default function EtapaAgendarDefesa({ oferta, orientador, membros, defesas, selecionado, onSelecionar }: EtapaAgendarDefesaProps) {
	const agendada = defesas.find((d) => d.data_defesa);
	const prontos = Boolean(orientador) && membros.length === 2;

	const [carregando, setCarregando] = useState(false);
	const [erro, setErro] = useState("");
	const [semDatas, setSemDatas] = useState(false);
	const [comuns, setComuns] = useState<Record<string, string[]>>({});

	const codigos = [orientador?.codigo, ...membros.map((m) => m.codigo)].filter(Boolean) as string[];
	const chaveCarga = `${oferta.ano}/${oferta.semestre}/${oferta.id_curso}/${oferta.fase}:${codigos.join(",")}`;

	useEffect(() => {
		if (agendada || !prontos) return;
		let ativo = true;
		setCarregando(true);
		setErro("");
		setSemDatas(false);
		const { ano, semestre, id_curso, fase } = oferta;
		Promise.all(
			codigos.map((c) => axiosInstance.get<{ grade?: Grade }>(`/disponibilidade-banca/grade/${c}/${ano}/${semestre}/${id_curso}/${fase}`)),
		)
			.then((respostas) => {
				if (!ativo) return;
				const base = respostas[0]?.grade;
				if (!base || !base.datas?.length) {
					setSemDatas(true);
					return;
				}
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
				setComuns(porData);
			})
			.catch((e) => {
				if (!ativo) return;
				if (datasNaoDefinidas(e)) setSemDatas(true);
				else setErro("Não foi possível carregar as disponibilidades dos docentes.");
			})
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chaveCarga, Boolean(agendada), prontos]);

	const datas = useMemo(() => Object.keys(comuns).sort(), [comuns]);

	if (agendada?.data_defesa) {
		const iso = agendada.data_defesa; // horário local gravado como UTC (ver utils/dataDefesa.ts)
		const banca = [...defesas].sort((a, b) => Number(Boolean(b.orientador)) - Number(Boolean(a.orientador)));
		return (
			<>
				<div className="status-card defesa-agendada">
					<DateTile data={iso.slice(0, 10)} />
					<div>
						<strong>{dataLonga(iso)}</strong>
						<span>
							<Icon name="schedule" size={14} />
							{iso.slice(11, 16)} · <Icon name="location_on" size={14} />
							{agendada.local || "Local a definir"}
						</span>
					</div>
					<StatusChip type="success">Agendada</StatusChip>
				</div>
				<div className="banca-membros">
					<div className="banca-membros-head">
						<h3>Banca</h3>
					</div>
					{banca.map((d) => (
						<div className="defense-person" key={d.membro_banca}>
							<Avatar nome={d.membroBanca?.nome ?? d.membro_banca} size="small" />
							<div>
								<strong>{d.membroBanca?.nome ?? d.membro_banca}</strong>
								<span>{d.orientador ? "Orientador" : "Membro da banca"}</span>
							</div>
						</div>
					))}
				</div>
				<div className="readonly-box success-box">
					<Icon name="event_available" />
					<span>Defesa agendada. Continue para acompanhar a defesa e o resultado.</span>
				</div>
			</>
		);
	}

	if (!prontos) {
		return (
			<div className="readonly-box warning-box" style={{ marginTop: 0 }}>
				<Icon name="info" />
				<span>Para agendar, o orientador e os dois membros da banca precisam ter aceitado o convite.</span>
			</div>
		);
	}

	const nomes = [orientador?.nome, ...membros.map((m) => m.nome)].filter(Boolean);

	return (
		<>
			<div className="readonly-box" style={{ marginTop: 0 }}>
				<Icon name="groups" size={18} />
				<span>
					Horários em que {nomes.slice(0, -1).join(", ")} e {nomes[nomes.length - 1]} estão disponíveis.
				</span>
			</div>

			{carregando ? (
				<EmptyState icon="hourglass_top" title="Carregando horários…" text="Buscando a disponibilidade do orientador e da banca." />
			) : erro ? (
				<div className="readonly-box warning-box">
					<Icon name="error" />
					<span>{erro}</span>
				</div>
			) : semDatas ? (
				<EmptyState
					icon="calendar_month"
					title="Datas de defesa ainda não definidas"
					text="A coordenação ainda não cadastrou as datas de defesa deste período. Volte mais tarde."
				/>
			) : datas.length === 0 ? (
				<EmptyState
					icon="event_busy"
					title="Nenhum horário em comum"
					text="O orientador e os membros da banca ainda não marcaram horários em comum. Peça que atualizem a disponibilidade."
				/>
			) : (
				<div className="horarios-comuns">
					{datas.map((data) => (
						<div className="horario-dia" key={data}>
							<DateTile data={data} />
							<div>
								<strong>{dataLonga(data)}</strong>
								<div className="horario-opcoes">
									{comuns[data]?.map((hora) => {
										const marcado = selecionado?.data === data && selecionado?.hora === hora;
										return (
											<button
												type="button"
												key={hora}
												className={`horario-opcao ${marcado ? "selected" : ""}`}
												aria-pressed={marcado}
												onClick={() => onSelecionar(marcado ? null : { data, hora })}
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
			)}

			{selecionado && (
				<div className="readonly-box success-box">
					<Icon name="event_available" />
					<span>
						Horário escolhido: {dataLonga(selecionado.data).toLowerCase()}, às {hhmm(selecionado.hora)}. Clique em “Agendar defesa” para confirmar.
					</span>
				</div>
			)}
		</>
	);
}
