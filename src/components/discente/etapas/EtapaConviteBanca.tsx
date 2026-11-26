import type { Convite } from "../../../types/convite";
import { dataBr } from "../../../utils/formatos";
import { Avatar, Button, EmptyState, Icon, StatusChip, type StatusTone } from "../../ui";

interface EtapaConviteBancaProps {
	/** 1 = banca do projeto (etapa 4); 2 = banca final (etapa 7). */
	fase: 1 | 2;
	/** Convites de banca desta fase. */
	convites: Convite[];
	/** Fase 2: membros que aceitaram a banca do projeto (vêm sugeridos no convite). */
	bancaProjeto?: Convite[];
	onConvidar: () => void;
}

const MEMBROS = 2;

type Situacao = "aceito" | "pendente" | "recusado";
const situacao = (c: Convite): Situacao => (c.aceito ? "aceito" : c.data_feedback ? "recusado" : "pendente");
const ORDEM: Record<Situacao, number> = { aceito: 0, pendente: 1, recusado: 2 };
const CHIP: Record<Situacao, [StatusTone, string]> = {
	aceito: ["success", "Aceito"],
	pendente: ["warning", "Pendente"],
	recusado: ["danger", "Recusado"],
};
const nomeDe = (c: Convite) => c.docente?.nome ?? c.codigo_docente;

/**
 * Convite de banca do discente (etapas 4 e 7 do stepper). Mostra cada membro convidado com
 * a situação do convite e libera novos convites enquanto aceitos + pendentes < 2
 * (mesma regra do diálogo de convite).
 */
export default function EtapaConviteBanca({ fase, convites, bancaProjeto = [], onConvidar }: EtapaConviteBancaProps) {
	const aceitos = convites.filter((c) => situacao(c) === "aceito").length;
	const pendentes = convites.filter((c) => situacao(c) === "pendente").length;
	const recusados = convites.filter((c) => situacao(c) === "recusado").length;
	const faltam = MEMBROS - aceitos - pendentes;
	const ordenados = [...convites].sort((a, b) => ORDEM[situacao(a)] - ORDEM[situacao(b)]);
	const sugeridos = bancaProjeto.filter((c) => c.aceito);

	return (
		<>
			{fase === 2 && sugeridos.length > 0 && (
				<div className="readonly-box" style={{ marginTop: 0, marginBottom: 16 }}>
					<Icon name="history" size={18} />
					<span>
						Banca do projeto: {sugeridos.map(nomeDe).join(" e ")}.
						{convites.length === 0 && " Esses docentes vêm sugeridos no convite da banca final."}
					</span>
				</div>
			)}

			{convites.length === 0 ? (
				<EmptyState
					icon="groups"
					title="Convide dois membros para sua banca"
					text="Selecione docentes e acompanhe cada resposta. Você pode enviar os dois convites de uma vez."
					action="Convidar membros"
					onAction={onConvidar}
				/>
			) : (
				<div className="status-card banca-membros">
					<div className="banca-membros-head">
						<h3>Membros convidados</h3>
						<span>
							{aceitos} de {MEMBROS} confirmados
						</span>
					</div>
					{ordenados.map((c) => {
						const s = situacao(c);
						const [tom, rotulo] = CHIP[s];
						const quando =
							s === "pendente"
								? `Convite enviado em ${dataBr(c.data_envio)}`
								: `${s === "aceito" ? "Aceitou" : "Recusou"} em ${dataBr(c.data_feedback)}`;
						return (
							<div className="defense-person" key={`${c.codigo_docente}-${c.data_envio}`}>
								<Avatar nome={nomeDe(c)} size="small" />
								<div>
									<strong>{nomeDe(c)}</strong>
									<span>{quando}</span>
									{s === "recusado" && c.mensagem_feedback && <small>“{c.mensagem_feedback}”</small>}
								</div>
								<StatusChip type={tom}>{rotulo}</StatusChip>
							</div>
						);
					})}
				</div>
			)}

			{aceitos >= MEMBROS ? (
				<div className="readonly-box success-box">
					<Icon name="check_circle" />
					<span>
						Banca completa com {MEMBROS} membros confirmados. Continue para {fase === 1 ? "agendar a defesa" : "agendar a defesa final"}.
					</span>
				</div>
			) : convites.length > 0 && faltam > 0 ? (
				<div className="alternative-action">
					<span>
						{recusados > 0
							? `${recusados === 1 ? "Um docente recusou" : `${recusados} docentes recusaram`} o convite. Convide ${faltam === 1 ? "outro docente" : "outros docentes"}.`
							: `Falta convidar ${faltam === 1 ? "1 membro" : `${faltam} membros`}.`}
					</span>
					<Button variant="secondary" icon="person_add" onClick={onConvidar}>
						{faltam === 1 ? "Convidar membro" : "Convidar membros"}
					</Button>
				</div>
			) : (
				convites.length > 0 && (
					<div className="readonly-box warning-box">
						<Icon name="hourglass_top" />
						<span>
							Aguardando a resposta de {pendentes === 1 ? "1 docente" : `${pendentes} docentes`}. Você poderá continuar quando{" "}
							{MEMBROS} membros aceitarem.
						</span>
					</div>
				)
			)}
		</>
	);
}
