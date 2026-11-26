import { forwardRef, useEffect, useMemo, useState } from "react";
import { useBlocker } from "react-router";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useGerenciarDisponibilidadeBanca, type GerenciarDisponibilidadeHandle } from "../../hooks/useGerenciarDisponibilidadeBanca";
import {
	AdvancedFilters,
	Button,
	Card,
	EmptyState,
	FilterField,
	Icon,
	ModalDialog,
	PageHeader,
	PlainButton,
	SaveBar,
	Select,
	Surface,
	TableToolbar,
	useNotice,
} from "../ui";

interface CursoOpcao {
	id: number | string;
	nome?: string | null;
}

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const dataLocal = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);

/** Segunda-feira da semana de uma data "AAAA-MM-DD". */
function inicioDaSemana(iso: string): string {
	const d = dataLocal(iso);
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
	return d.toISOString().slice(0, 10);
}

function rotuloSemana(datas: string[]): string {
	const primeira = dataLocal(datas[0] ?? "");
	const ultima = dataLocal(datas[datas.length - 1] ?? "");
	return primeira.getMonth() === ultima.getMonth()
		? `${primeira.getDate()}–${ultima.getDate()} de ${MESES[ultima.getMonth()]}`
		: `${primeira.getDate()} de ${MESES[primeira.getMonth()]} – ${ultima.getDate()} de ${MESES[ultima.getMonth()]}`;
}

/**
 * Grade semanal de disponibilidade (imagem dispnibilidade_orientador.png).
 * Reaproveita o hook da tela anterior (dados, bloqueios por defesa e sincronização).
 * Ano e semestre vêm do período do topo. Sair com alterações não salvas pede confirmação.
 */
const GradeDisponibilidade = forwardRef<GerenciarDisponibilidadeHandle>(function GradeDisponibilidade(_, ref) {
	const notificar = useNotice();
	const { selecionado } = usePeriodo();
	const h = useGerenciarDisponibilidadeBanca(ref);
	const [semana, setSemana] = useState(0);
	const [filtrosAbertos, setFiltrosAbertos] = useState(false);

	// Ano/semestre seguem o seletor de período do topo.
	useEffect(() => {
		if (!selecionado) return;
		h.setAno(selecionado.ano);
		h.setSemestre(selecionado.semestre);
	}, [selecionado?.ano, selecionado?.semestre]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (h.error) notificar(h.error, "error");
	}, [h.error, notificar]);
	useEffect(() => {
		if (h.success) notificar(h.success, "success");
	}, [h.success, notificar]);

	// Semanas com apenas os dias úteis da janela de defesas.
	const semanas = useMemo(() => {
		const mapa = new Map<string, string[]>();
		for (const data of h.grade?.datas ?? []) {
			const dia = dataLocal(data).getDay();
			if (dia === 0 || dia === 6) continue;
			const chave = inicioDaSemana(data);
			mapa.set(chave, [...(mapa.get(chave) ?? []), data]);
		}
		return [...mapa.values()];
	}, [h.grade]);

	useEffect(() => setSemana(0), [semanas.length, h.cursoSelecionado, h.fase]);

	const datas = semanas[Math.min(semana, semanas.length - 1)] ?? [];
	const horarios = h.grade?.horarios ?? [];
	const alteracoes = h.calcularNumeroAlteracoes();
	const cursos = (h.cursos as CursoOpcao[]) ?? [];

	const blocker = useBlocker(
		({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname && alteracoes > 0,
	);
	const salvarESair = async () => {
		await h.sincronizarDisponibilidades();
		if (blocker.state === "blocked") blocker.proceed();
	};

	const diaCompleto = (data: string) =>
		horarios.every((hora) => h.bloqueados.has(`${data}-${hora}`) || h.disponibilidades[`${data}-${hora}`]);

	return (
		<>
			<PageHeader
				title="Disponibilidade para bancas"
				description="Marque os horários em que você pode participar de defesas."
				action={
					semanas.length > 0 && (
						<div className="week-nav">
							<PlainButton onClick={() => setSemana((s) => Math.max(0, s - 1))} disabled={semana === 0} aria-label="Semana anterior">
								<Icon name="chevron_left" />
							</PlainButton>
							<strong>{rotuloSemana(datas)}</strong>
							<PlainButton
								onClick={() => setSemana((s) => Math.min(semanas.length - 1, s + 1))}
								disabled={semana >= semanas.length - 1}
								aria-label="Próxima semana"
							>
								<Icon name="chevron_right" />
							</PlainButton>
						</div>
					)
				}
			/>
			<TableToolbar filterCount={0} filtersOpen={filtrosAbertos} onToggleFilters={() => setFiltrosAbertos((x) => !x)}>
				<Select value={String(h.cursoSelecionado ?? "")} onChange={(e) => h.setCursoSelecionado(e.target.value)} aria-label="Curso" displayEmpty>
					{cursos.length === 0 && <option value="">Nenhum curso</option>}
					{cursos.map((c) => (
						<option key={String(c.id)} value={String(c.id)}>
							{c.nome ?? `Curso ${c.id}`}
						</option>
					))}
				</Select>
			</TableToolbar>
			{filtrosAbertos && (
				<AdvancedFilters>
					<FilterField label="Fase">
						<Select value={String(h.fase)} onChange={(e) => h.setFase(Number(e.target.value))}>
							<option value="1">Projeto (TCC I)</option>
							<option value="2">TCC (TCC II)</option>
						</Select>
					</FilterField>
				</AdvancedFilters>
			)}
			<Surface className="calendar-legend card">
				<span>
					<i className="available-swatch" />
					Disponível
				</span>
				<span>
					<i />
					Indisponível
				</span>
				<span>
					<i className="busy-swatch" />
					Ocupado por banca
				</span>
				<small>
					<Icon name="ads_click" size={16} /> Clique para marcar horários
				</small>
			</Surface>
			{datas.length === 0 ? (
				<Card className="card">
					<EmptyState
						icon="calendar_month"
						title={h.loading ? "Carregando…" : "Sem período de defesas"}
						text="Não há datas de defesa cadastradas para o curso, período e fase selecionados."
					/>
				</Card>
			) : (
				<Card className="card calendar-card">
					<div className="calendar-grid" style={{ gridTemplateColumns: `70px repeat(${datas.length}, 1fr)` }}>
						<div className="corner">HORÁRIO</div>
						{datas.map((data) => {
							const d = dataLocal(data);
							const completo = diaCompleto(data);
							return (
								<PlainButton className={`day-head ${completo ? "selected" : ""}`} key={data} onClick={() => h.handleHeaderClick(data)}>
									{`${DIAS[d.getDay()]} ${d.getDate()}`}
									<span>{completo ? "Desmarcar dia" : "Marcar dia"}</span>
								</PlainButton>
							);
						})}
						{horarios.map((hora) => [
							<div className="time-cell" key={`h-${hora}`}>
								{hora.slice(0, 5)}
							</div>,
							...datas.map((data) => {
								const chave = `${data}-${hora}`;
								const bloqueio = h.bloqueados.get(chave);
								const marcado = Boolean(h.disponibilidades[chave]);
								return (
									<PlainButton
										key={chave}
										className={`slot ${marcado ? "selected" : ""} ${bloqueio ? "busy" : ""}`}
										onClick={() => !bloqueio && h.handleCheckboxChange(data, hora, !marcado)}
										title={bloqueio?.nomeDiscente ? `Defesa de ${bloqueio.nomeDiscente}` : undefined}
										aria-pressed={marcado}
										aria-label={`${data} ${hora.slice(0, 5)}`}
									>
										{bloqueio && (
											<>
												<Icon name="event_busy" size={16} />
												<span>{bloqueio.tipo === "banca" ? "Defesa" : "Indisponível"}</span>
											</>
										)}
									</PlainButton>
								);
							}),
						])}
					</div>
				</Card>
			)}
			<SaveBar changes={alteracoes} onDiscard={() => window.location.reload()} onSave={() => void h.sincronizarDisponibilidades()} saving={h.loading} />

			<ModalDialog
				open={blocker.state === "blocked"}
				onClose={() => blocker.reset?.()}
				icon="warning"
				title="Alterações não salvas"
				description={`Você tem ${alteracoes} ${alteracoes === 1 ? "alteração" : "alterações"} de disponibilidade não salvas.`}
				actions={
					<>
						<Button variant="secondary" onClick={() => blocker.reset?.()}>
							Continuar editando
						</Button>
						<Button variant="danger" onClick={() => blocker.proceed?.()}>
							Sair sem salvar
						</Button>
						<Button icon="save" onClick={() => void salvarESair()} disabled={h.loading}>
							Salvar e sair
						</Button>
					</>
				}
			/>
		</>
	);
});

export default GradeDisponibilidade;
