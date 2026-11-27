import { Avatar, DateTile, EmptyState, Icon, StatusChip } from "../../ui";

interface DefesaDaFase {
	membro_banca: string;
	data_defesa?: string | null;
	orientador?: boolean;
	local?: string | null;
	avaliacao?: number | string | null;
	membroBanca?: { nome?: string };
}

interface EtapaDefesaResultadoProps {
	/** 1 = defesa do projeto; 2 = defesa final. */
	fase: 1 | 2;
	/** Registros de defesa da fase (um por membro, incluindo o orientador). */
	defesas: DefesaDaFase[];
	/** aprovado_projeto (fase 1) ou aprovado_tcc (fase 2). */
	aprovado: boolean;
}

const MEDIA_APROVACAO = 6;
const formatar = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nota = (v: DefesaDaFase["avaliacao"]): number | null => (v === null || v === undefined || v === "" ? null : Number(v));
const dataLonga = (iso: string) => {
	const texto = new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
	return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/**
 * Passo "Defesa e resultado" (fim do TCC I e do TCC II): defesa agendada, notas por membro,
 * média e situação. A aprovação oficial vem do TCC (aprovado_projeto / aprovado_tcc);
 * a média segue a mesma regra da tela de avaliações do docente (≥ 6,0).
 */
export default function EtapaDefesaResultado({ fase, defesas, aprovado }: EtapaDefesaResultadoProps) {
	const agendada = defesas.find((d) => d.data_defesa);

	if (!agendada?.data_defesa) {
		return (
			<EmptyState
				icon="workspace_premium"
				title="Sua defesa será exibida aqui"
				text="Agende a defesa na etapa anterior. Depois dela, consulte notas, média e resultado final."
			/>
		);
	}

	const iso = agendada.data_defesa; // horário local gravado como UTC (ver utils/dataDefesa.ts)
	const banca = [...defesas].sort((a, b) => Number(Boolean(b.orientador)) - Number(Boolean(a.orientador)));
	const notas = banca.map((d) => nota(d.avaliacao)).filter((n): n is number => n !== null && !Number.isNaN(n));
	const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
	const completas = notas.length === banca.length && banca.length > 0;
	const situacao: [string, "success" | "danger" | "warning"] = aprovado
		? ["Aprovado", "success"]
		: completas && media !== null && media < MEDIA_APROVACAO
			? ["Reprovado", "danger"]
			: ["Em avaliação", "warning"];

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
				<StatusChip type={notas.length > 0 ? "info" : "neutral"}>{notas.length > 0 ? "Avaliada" : "Agendada"}</StatusChip>
			</div>

			<div className="result-kpis resultado-defesa">
				<div>
					<span>Notas registradas</span>
					<strong>
						{notas.length} de {banca.length}
					</strong>
				</div>
				<div>
					<span>{completas ? "Média final" : "Média parcial"}</span>
					<strong>{media === null ? "—" : formatar(media)}</strong>
				</div>
				<div className={situacao[1] === "success" ? "success-text" : situacao[1] === "danger" ? "danger-text" : ""}>
					<span>Situação</span>
					<strong>{situacao[0]}</strong>
				</div>
			</div>

			<div className="banca-membros">
				<div className="banca-membros-head">
					<h3>Notas da banca</h3>
				</div>
				{banca.map((d) => {
					const n = nota(d.avaliacao);
					return (
						<div className="defense-person" key={d.membro_banca}>
							<Avatar nome={d.membroBanca?.nome ?? d.membro_banca} size="small" />
							<div>
								<strong>{d.membroBanca?.nome ?? d.membro_banca}</strong>
								<span>{d.orientador ? "Orientador" : "Membro da banca"}</span>
							</div>
							{n === null ? <StatusChip type="warning">Sem nota</StatusChip> : <StatusChip type="neutral">{formatar(n)}</StatusChip>}
						</div>
					);
				})}
			</div>

			{aprovado ? (
				<div className="readonly-box success-box">
					<Icon name="workspace_premium" />
					<span>
						{fase === 1
							? "Projeto aprovado! Na próxima oferta, você continua no TCC II com o mesmo trabalho."
							: "TCC aprovado. Parabéns pela conclusão do seu Trabalho de Conclusão de Curso!"}
					</span>
				</div>
			) : (
				<div className="readonly-box">
					<Icon name="info" />
					<span>
						A situação final é registrada pelo orientador após a avaliação da banca. A aprovação requer média igual ou superior a 6,0.
					</span>
				</div>
			)}
		</>
	);
}
