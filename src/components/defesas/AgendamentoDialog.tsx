import { useEffect, useMemo, useState } from "react";
import { Alert } from "@mui/material";
import orientacaoService from "../../services/orientacao-service";
import { salvarAgendamento } from "../../services/defesas-acoes";
import type { ItemAcompanhamento } from "../../types/acompanhamento";
import type { DefesaAgenda } from "../../types/dashboard";
import type { Docente } from "../../types/docente";
import { getErrorMessage } from "../../utils/apiError";
import { Button, Input, ModalDialog, Select, useNotice } from "../ui";

interface AgendamentoDialogProps {
	open: boolean;
	/** Defesa existente (editar) ou null (agendar nova). */
	defesa: DefesaAgenda | null;
	/** TCCs com orientador que podem ser agendados (apenas para nova defesa). */
	trabalhos: ItemAcompanhamento[];
	onClose: () => void;
	onSalvo: () => void;
}

interface Form {
	tcc: string;
	data: string;
	hora: string;
	local: string;
	avaliador1: string;
	avaliador2: string;
}

/** "Agendar defesa" / "Editar agendamento": trabalho, data, hora, local e os dois avaliadores. */
export default function AgendamentoDialog({ open, defesa, trabalhos, onClose, onSalvo }: AgendamentoDialogProps) {
	const notificar = useNotice();
	const [form, setForm] = useState<Form>({ tcc: "", data: "", hora: "", local: "", avaliador1: "", avaliador2: "" });
	const [docentes, setDocentes] = useState<Docente[]>([]);
	const [salvando, setSalvando] = useState(false);

	useEffect(() => {
		if (!open) return;
		if (defesa) {
			const banca = defesa.membros.filter((m) => m.papel === "banca").map((m) => m.codigo);
			setForm({
				tcc: String(defesa.id_tcc),
				data: defesa.data,
				hora: defesa.hora,
				local: defesa.local ?? "",
				avaliador1: banca[0] ?? "",
				avaliador2: banca[1] ?? "",
			});
		} else {
			setForm({ tcc: trabalhos[0] ? String(trabalhos[0].id_tcc) : "", data: "", hora: "", local: "", avaliador1: "", avaliador2: "" });
		}
	}, [open, defesa, trabalhos]);

	const trabalho = trabalhos.find((t) => String(t.id_tcc) === form.tcc);
	const idCurso = defesa?.id_curso ?? trabalho?.id_curso;
	const orientador = defesa ? defesa.membros.find((m) => m.papel === "orientador")?.codigo : trabalho?.orientador?.codigo;

	useEffect(() => {
		if (!open || !idCurso) return;
		let ativo = true;
		orientacaoService
			.getDocentesBancaCurso(idCurso)
			.then((lista) => ativo && setDocentes(lista.map((d) => d.docente).filter(Boolean)))
			.catch(() => ativo && setDocentes([]));
		return () => {
			ativo = false;
		};
	}, [open, idCurso]);

	// Opções de avaliador: docentes de banca do curso + membros atuais (ex.: externos), sem o orientador.
	const opcoes = useMemo(() => {
		const mapa = new Map<string, string>();
		docentes.forEach((d) => mapa.set(d.codigo, d.nome ?? d.codigo));
		defesa?.membros.filter((m) => m.papel === "banca").forEach((m) => mapa.set(m.codigo, `${m.nome}${m.externo ? " · Externo" : ""}`));
		if (orientador) mapa.delete(orientador);
		return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt"));
	}, [docentes, defesa, orientador]);

	const alterar = (campo: keyof Form) => (valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

	const salvar = async () => {
		const idTcc = Number(form.tcc);
		const fase = defesa?.fase ?? trabalho?.fase;
		if (!idTcc || !fase || !orientador) {
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
			await salvarAgendamento({
				idTcc,
				fase,
				orientador,
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
				{!defesa && (
					<label className="full">
						<span>Discente</span>
						<Select value={form.tcc} onChange={(e) => alterar("tcc")(e.target.value)}>
							{trabalhos.map((t) => (
								<option key={t.id_tcc} value={String(t.id_tcc)}>
									{`${t.nome} · ${t.fase === 2 ? "TCC II" : "TCC I"}`}
								</option>
							))}
						</Select>
					</label>
				)}
				<label>
					<span>Data</span>
					<Input type="date" value={form.data} onChange={(e) => alterar("data")(e.target.value)} />
				</label>
				<label>
					<span>Hora</span>
					<Input type="time" value={form.hora} onChange={(e) => alterar("hora")(e.target.value)} step={1800} />
				</label>
				<label className="full">
					<span>Local</span>
					<Input value={form.local} onChange={(e) => alterar("local")(e.target.value)} placeholder="Sala ou link da videoconferência" />
				</label>
				{seletorAvaliador("avaliador1", "Primeiro avaliador")}
				{seletorAvaliador("avaliador2", "Segundo avaliador")}
			</div>
			{!defesa && trabalhos.length === 0 && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Não há trabalhos com orientador no período selecionado.
				</Alert>
			)}
		</ModalDialog>
	);
}
