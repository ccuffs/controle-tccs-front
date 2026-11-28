import { useEffect, useMemo, useState } from "react";
import { Tab, Tabs } from "@mui/material";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useDocenteAtual } from "../../hooks/useDocenteAtual";
import acompanhamentoService from "../../services/acompanhamento-service";
import avaliarDefesasService from "../../services/avaliar-defesas-service";
import { abrirAta } from "../../services/defesas-acoes";
import visaoGeralService from "../../services/visao-geral-service";
import type { DefesaAgenda } from "../../types/dashboard";
import { getErrorMessage } from "../../utils/apiError";
import {
	Avatar,
	Button,
	Card,
	DateTile,
	EmptyState,
	Icon,
	Input,
	PageHeader,
	PhaseChip,
	PlainButton,
	StatusChip,
	Surface,
	Textarea,
	useNotice,
} from "../ui";

type Aba = "pendentes" | "concluidas" | "todas";
const LIMITE_PARECER = 1000;

const completa = (d: DefesaAgenda) => d.membros.length > 0 && d.membros.every((m) => m.avaliacao !== null);
const chave = (d: DefesaAgenda) => `${d.id_tcc}-${d.fase}`;
const formatar = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const lerNota = (texto: string): number | null => {
	const n = Number(texto.replace(",", "."));
	return texto.trim() === "" || Number.isNaN(n) ? null : n;
};

/** Avaliações das defesas em que o docente participa (imagens avaliacao_defesa_orientador*.png). */
export default function Avaliacoes() {
	const notificar = useNotice();
	const { filtro, escolha } = usePeriodo();
	const { codigo } = useDocenteAtual();

	const [defesas, setDefesas] = useState<DefesaAgenda[]>([]);
	const [carregando, setCarregando] = useState(true);
	const [recarregar, setRecarregar] = useState(0);
	const [aba, setAba] = useState<Aba>("pendentes");
	const [aberta, setAberta] = useState<DefesaAgenda | null>(null);

	useEffect(() => {
		if (!codigo || !escolha) return;
		let ativo = true;
		setCarregando(true);
		visaoGeralService
			// Histórico: o período é atribuído pela data da defesa; sem ano/semestre ("todos"), traz todas.
			.defesas({ ...filtro, codigo_docente: codigo }, { incluir_historico: true })
			.then((r) => {
				if (!ativo) return;
				setDefesas(r.itens);
				setAberta((atual) => (atual ? (r.itens.find((d) => chave(d) === chave(atual)) ?? null) : null));
			})
			.catch((e) => ativo && notificar(getErrorMessage(e, "Erro ao carregar as defesas"), "error"))
			.finally(() => ativo && setCarregando(false));
		return () => {
			ativo = false;
		};
	}, [codigo, escolha, filtro, recarregar, notificar]);

	const contagem = useMemo(
		() => ({ pendentes: defesas.filter((d) => !completa(d)).length, concluidas: defesas.filter(completa).length, todas: defesas.length }),
		[defesas],
	);
	const visiveis = defesas.filter((d) => (aba === "todas" ? true : aba === "pendentes" ? !completa(d) : completa(d)));

	if (aberta) {
		return (
			<Detalhe
				defesa={aberta}
				podeEditar={aberta.papel_docente === "orientador"}
				onVoltar={() => setAberta(null)}
				onSalvo={() => setRecarregar((x) => x + 1)}
			/>
		);
	}

	return (
		<>
			<PageHeader title="Avaliações de defesa" description="Registre notas e pareceres das bancas em que você participa." />
			<Tabs className="segments" value={aba} onChange={(_, v: Aba) => setAba(v)}>
				<Tab value="pendentes" label={`Pendentes · ${contagem.pendentes}`} />
				<Tab value="concluidas" label={`Concluídas · ${contagem.concluidas}`} />
				<Tab value="todas" label={`Todas · ${contagem.todas}`} />
			</Tabs>
			<div className="invite-list">
				{visiveis.map((d) => (
					<Card className="card evaluation-row" key={chave(d)}>
						<DateTile data={d.data} />
						<div>
							<PhaseChip fase={d.fase} />
							<h2>{d.estudante}</h2>
							<p>{d.titulo}</p>
							<span className="meta-line">
								<Icon name="schedule" size={16} />
								{d.hora} · <Icon name="location_on" size={16} />
								{d.local || "Local a definir"}
							</span>
						</div>
						{completa(d) ? (
							<StatusChip type="success">Média {formatar(d.nota_media ?? 0)}</StatusChip>
						) : (
							<StatusChip type="warning">Aguardando notas</StatusChip>
						)}
						<Button variant={completa(d) ? "secondary" : "primary"} onClick={() => setAberta(d)}>
							{d.papel_docente !== "orientador" ? "Ver avaliação" : completa(d) ? "Revisar avaliação" : "Avaliar defesa"}
						</Button>
					</Card>
				))}
				{!carregando && visiveis.length === 0 && (
					<Surface className="card">
						<EmptyState
							icon="fact_check"
							title={aba === "concluidas" ? "Nenhuma avaliação concluída" : "Nenhuma avaliação pendente"}
							text="As defesas do período selecionado em que você participa aparecem aqui."
						/>
					</Surface>
				)}
			</div>
		</>
	);
}

interface DetalheProps {
	defesa: DefesaAgenda;
	podeEditar: boolean;
	onVoltar: () => void;
	onSalvo: () => void;
}

/** Notas por membro, parecer e média parcial de uma defesa. */
function Detalhe({ defesa, podeEditar, onVoltar, onSalvo }: DetalheProps) {
	const notificar = useNotice();
	const membros = useMemo(
		() => [...defesa.membros].sort((a, b) => (a.papel === "orientador" ? -1 : b.papel === "orientador" ? 1 : 0)),
		[defesa],
	);
	const [notas, setNotas] = useState<Record<string, string>>({});
	const [parecer, setParecer] = useState("");
	const [aprovado, setAprovado] = useState(false);
	const [ocupado, setOcupado] = useState(false);

	useEffect(() => {
		setNotas(Object.fromEntries(membros.map((m) => [m.codigo, m.avaliacao === null ? "" : formatar(m.avaliacao)])));
		acompanhamentoService
			.obterTrabalho(defesa.id_tcc)
			.then((t) => {
				setParecer(t.comentarios_tcc ?? "");
				setAprovado(defesa.fase === 2 ? Boolean(t.aprovado_tcc) : Boolean(t.aprovado_projeto));
			})
			.catch(() => undefined);
	}, [defesa, membros]);

	const valores = membros.map((m) => lerNota(notas[m.codigo] ?? ""));
	const preenchidas = valores.filter((v): v is number => v !== null);
	const media = preenchidas.length ? preenchidas.reduce((a, b) => a + b, 0) / preenchidas.length : null;
	const todasPreenchidas = preenchidas.length === membros.length;

	const salvar = async () => {
		if (valores.some((v) => v !== null && (v < 0 || v > 10))) {
			notificar("As notas devem estar entre 0,0 e 10,0.", "error");
			return;
		}
		setOcupado(true);
		try {
			await Promise.all(
				membros.map((m, i) => {
					const v = valores[i];
					return v === null || v === undefined || v === m.avaliacao
						? Promise.resolve()
						: avaliarDefesasService.salvarAvaliacaoDefesa(defesa.id_tcc, m.codigo, { avaliacao: v, fase: defesa.fase });
				}),
			);
			await avaliarDefesasService.atualizarTrabalhoConclusao(defesa.id_tcc, { comentarios_tcc: parecer });
			notificar("Avaliação salva.");
			onSalvo();
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar a avaliação."), "error");
		} finally {
			setOcupado(false);
		}
	};

	const aprovarTcc = async () => {
		setOcupado(true);
		try {
			await avaliarDefesasService.atualizarTrabalhoConclusao(defesa.id_tcc, { aprovado_tcc: true });
			setAprovado(true);
			notificar("TCC aprovado.");
			onSalvo();
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível aprovar o TCC."), "error");
		} finally {
			setOcupado(false);
		}
	};

	return (
		<>
			<PlainButton className="back-link" onClick={onVoltar}>
				<Icon name="arrow_back" />
				Voltar para avaliações
			</PlainButton>
			<PageHeader
				title="Avaliação da defesa"
				description={`${defesa.estudante} · ${defesa.titulo}`}
				action={<PhaseChip fase={defesa.fase} />}
			/>
			<div className="detail-grid">
				<Card className="card scores-card">
					<div className="card-title">
						<div>
							<h2>Notas por membro</h2>
							<p>{podeEditar ? "Escala de 0,0 a 10,0" : "As notas são registradas pelo orientador do trabalho."}</p>
						</div>
					</div>
					{membros.map((m) => (
						<label className="score-row" key={m.codigo}>
							<div>
								<Avatar nome={m.nome} size="small" />
								<span>
									<strong>
										{m.nome} · {m.papel === "orientador" ? "Orientador" : m.externo ? "Banca externa" : "Banca"}
									</strong>
									{m.externo && (
										<StatusChip type="neutral">
											<Icon name="domain" size={14} />
											Externo
										</StatusChip>
									)}
								</span>
							</div>
							<Input
								value={notas[m.codigo] ?? ""}
								placeholder="0,0"
								inputMode="decimal"
								readOnly={!podeEditar}
								onChange={(e) => setNotas((atual) => ({ ...atual, [m.codigo]: e.target.value }))}
							/>
						</label>
					))}
					<label className="textarea-label">
						<span>Parecer da banca</span>
						<Textarea
							rows={5}
							value={parecer}
							placeholder="Registre as considerações da banca..."
							onChange={(e) => setParecer(e.target.value.slice(0, LIMITE_PARECER))}
							disabled={!podeEditar}
						/>
						<small>
							{parecer.length} / {LIMITE_PARECER}
						</small>
					</label>
				</Card>
				<aside>
					<Card className="card average-card">
						<span>{todasPreenchidas ? "MÉDIA FINAL" : "MÉDIA PARCIAL"}</span>
						<strong>{media === null ? "—" : formatar(media)}</strong>
						{todasPreenchidas && media !== null ? (
							<StatusChip type={media >= 6 ? "success" : "danger"}>{media >= 6 ? "Aprovado" : "Reprovado"}</StatusChip>
						) : (
							<StatusChip type="warning">Aguardando notas</StatusChip>
						)}
						<p>A aprovação requer média igual ou superior a 6,0.</p>
					</Card>
				</aside>
			</div>
			<div className="form-footer">
				<Button
					variant="secondary"
					icon="picture_as_pdf"
					onClick={() => abrirAta(defesa.id_tcc, defesa.fase, defesa.local).catch((e) => notificar(getErrorMessage(e, "Erro ao gerar a ata."), "error"))}
				>
					Gerar ata
				</Button>
				{podeEditar && defesa.fase === 2 && (
					<Button variant="secondary" onClick={aprovarTcc} disabled={ocupado || aprovado}>
						{aprovado ? "TCC aprovado" : "Aprovar TCC"}
					</Button>
				)}
				{podeEditar && (
					<Button icon="save" onClick={salvar} disabled={ocupado}>
						Salvar avaliação
					</Button>
				)}
			</div>
		</>
	);
}
