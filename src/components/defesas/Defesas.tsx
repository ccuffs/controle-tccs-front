import { useEffect, useState } from "react";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useCursosCoordenacao } from "../../hooks/useCursosCoordenacao";
import acompanhamentoService from "../../services/acompanhamento-service";
import { abrirAta, cancelarDefesa, historicoDefesa, type EventoHistorico } from "../../services/defesas-acoes";
import visaoGeralService from "../../services/visao-geral-service";
import type { ItemAcompanhamento } from "../../types/acompanhamento";
import type { DefesaAgenda } from "../../types/dashboard";
import { getErrorMessage } from "../../utils/apiError";
import { dataBr } from "../../utils/formatos";
import { Button, ConfirmDialog, FilterBar, FilterField, PageHeader, Select, useNotice } from "../ui";
import AgendamentoDialog from "./AgendamentoDialog";
import DefenseList from "./DefenseList";

const TODOS = "__todos__";

/** Histórico exibido no painel da defesa (carregado ao abrir). */
function Historico({ defesa }: { defesa: DefesaAgenda }) {
	const [eventos, setEventos] = useState<EventoHistorico[] | null>(null);
	useEffect(() => {
		let ativo = true;
		historicoDefesa(defesa.id_tcc, defesa.fase)
			.then((e) => ativo && setEventos(e))
			.catch(() => ativo && setEventos([]));
		return () => {
			ativo = false;
		};
	}, [defesa.id_tcc, defesa.fase]);
	return (
		<section className="drawer-section">
			<h3>Histórico</h3>
			{eventos === null ? (
				<div className="readonly-box">Carregando…</div>
			) : eventos.length === 0 ? (
				<div className="readonly-box">Sem registros.</div>
			) : (
				<div className="defense-timeline">
					{eventos.map((e, i) => (
						<div key={`${e.data}-${i}`}>
							<i />
							<span>
								<strong>{e.titulo}</strong>
								<small>
									{dataBr(e.data)}
									{e.detalhe ? ` · ${e.detalhe}` : ""}
								</small>
							</span>
						</div>
					))}
				</div>
			)}
		</section>
	);
}

/** Agenda de defesas do curso (imagem defesas_coordenador.png). */
export default function Defesas() {
	const notificar = useNotice();
	const { filtro, periodoEfetivo: selecionado } = usePeriodo();
	const { padrao } = useCursosCoordenacao();

	const [status, setStatus] = useState("");
	const [fase, setFase] = useState("");
	const [defesas, setDefesas] = useState<DefesaAgenda[]>([]);
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);

	const [dialogo, setDialogo] = useState<{ defesa: DefesaAgenda | null } | null>(null);
	const [trabalhos, setTrabalhos] = useState<ItemAcompanhamento[]>([]);
	const [cancelar, setCancelar] = useState<DefesaAgenda | null>(null);
	const [ocupado, setOcupado] = useState(false);

	useEffect(() => {
		let ativo = true;
		setCarregando(true);
		visaoGeralService
			.defesas(
				{ ...filtro, fase, id_curso: padrao },
				{ incluir_historico: true, status: status || undefined },
			)
			.then((r) => ativo && setDefesas(r.itens))
			.catch((e) => {
				if (!ativo) return;
				setDefesas([]);
				notificar(getErrorMessage(e, "Erro ao carregar as defesas"), "error");
			})
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [filtro, status, fase, padrao, recarregar, notificar]);

	const abrirNovo = async () => {
		if (!selecionado) return;
		try {
			const [acomp, ds] = await Promise.all([
				acompanhamentoService.listarAcompanhamento({
					ano: String(selecionado.ano),
					semestre: String(selecionado.semestre),
					id_curso: padrao,
					limite: 100,
				}),
				// Busca todas as defesas agendadas do período (sem filtro de status) para excluir quem já tem banca
				visaoGeralService.defesas({ ano: selecionado.ano, semestre: selecionado.semestre, id_curso: padrao }),
			]);
			const agendados = new Set(ds.itens.map((d) => `${d.id_tcc}|${d.fase}`));
			setTrabalhos(acomp.itens.filter((i) => i.orientador && !agendados.has(`${i.id_tcc}|${i.fase}`)));
			setDialogo({ defesa: null });
		} catch (e) {
			notificar(getErrorMessage(e, "Erro ao carregar os trabalhos"), "error");
		}
	};

	const confirmarCancelamento = async () => {
		if (!cancelar) return;
		setOcupado(true);
		try {
			await cancelarDefesa(cancelar.id_tcc, cancelar.fase);
			notificar("Defesa cancelada. A banca foi mantida, sem data.");
			setCancelar(null);
			setRecarregar((x) => x + 1);
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível cancelar a defesa."), "error");
		} finally {
			setOcupado(false);
		}
	};

	const limpar = () => {
		setStatus("");
		setFase("");
	};

	return (
		<>
			<PageHeader
				title="Defesas"
				description="Acompanhe agendamentos, bancas e resultados do curso."
				action={
					<Button icon="calendar_add_on" onClick={abrirNovo}>
						Agendar defesa
					</Button>
				}
			/>
			<FilterBar onClear={limpar}>
				<FilterField label="Status">
					<Select value={status || TODOS} onChange={(e) => setStatus(e.target.value === TODOS ? "" : e.target.value)}>
						<option value={TODOS}>Todas as defesas</option>
						<option value="agendada">Agendada</option>
						<option value="aguardando_confirmacao">Aguardando confirmação</option>
						<option value="concluida">Concluída</option>
					</Select>
				</FilterField>
				<FilterField label="Fase">
					<Select value={fase || TODOS} onChange={(e) => setFase(e.target.value === TODOS ? "" : e.target.value)}>
						<option value={TODOS}>Todas as fases</option>
						<option value="1">Projeto (TCC I)</option>
						<option value="2">TCC (TCC II)</option>
					</Select>
				</FilterField>
			</FilterBar>

			<DefenseList
				defesas={defesas}
				titulo="Defesas"
				subtitulo={carregando ? "Carregando…" : `${defesas.length} ${defesas.length === 1 ? "defesa encontrada" : "defesas encontradas"}`}
				carregando={carregando}
				extraDetalhe={(d) => <Historico defesa={d} />}
				acoesDetalhe={(d, fechar) => (
					<>
						<Button
							variant="secondary"
							icon="edit_calendar"
							onClick={() => {
								fechar();
								setDialogo({ defesa: d });
							}}
						>
							Editar
						</Button>
						<Button
							variant="secondary"
							icon="picture_as_pdf"
							onClick={() => abrirAta(d.id_tcc, d.fase, d.local).catch((e) => notificar(getErrorMessage(e, "Erro ao gerar a ata."), "error"))}
						>
							Gerar ata
						</Button>
						{d.status !== "concluida" && (
							<Button
								variant="danger"
								icon="event_busy"
								onClick={() => {
									fechar();
									setCancelar(d);
								}}
							>
								Cancelar defesa
							</Button>
						)}
					</>
				)}
			/>

			<AgendamentoDialog
				open={Boolean(dialogo)}
				defesa={dialogo?.defesa ?? null}
				trabalhos={trabalhos}
				onClose={() => setDialogo(null)}
				onSalvo={() => {
					setDialogo(null);
					setRecarregar((x) => x + 1);
				}}
			/>

			<ConfirmDialog
				open={Boolean(cancelar)}
				title="Cancelar defesa"
				description={
					cancelar
						? `A defesa de ${cancelar.estudante} em ${dataBr(cancelar.data)} às ${cancelar.hora} será cancelada. A banca é mantida e poderá ser reagendada.`
						: ""
				}
				confirmLabel="Cancelar defesa"
				busy={ocupado}
				onConfirm={confirmarCancelamento}
				onClose={() => setCancelar(null)}
			/>
		</>
	);
}
