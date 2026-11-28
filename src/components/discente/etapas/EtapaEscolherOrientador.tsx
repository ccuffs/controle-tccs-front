import type { Convite } from "../../../types/convite";
import { dataBr } from "../../../utils/formatos";
import { Avatar, Button, Icon, PlainButton, StatusChip } from "../../ui";
import CatalogoTemas from "../CatalogoTemas";

interface EtapaEscolherOrientadorProps {
	/** Convite de orientação mais recente da fase (pendente, aceito ou recusado). */
	convite: Convite | null;
	idCurso: number | null;
	/** Abre o diálogo de convite; com código, o docente já vem selecionado. */
	onConvidar: (codigoDocente?: string) => void;
	onVerConvite: () => void;
}

/**
 * Passos "Escolher orientador e tema" e "Aguardar aceite" (etapa 0 do stepper).
 * Usa o mesmo catálogo da tela Temas disponíveis (curso vindo do TCC), o que também
 * corrige a lista antiga, que dependia de GET /usuarios/:id/cursos (inexistente na API).
 */
export default function EtapaEscolherOrientador({ convite, idCurso, onConvidar, onVerConvite }: EtapaEscolherOrientadorProps) {
	const nome = convite?.docente?.nome ?? convite?.codigo_docente ?? "";
	const pendente = Boolean(convite && convite.data_feedback === null);
	const aceito = Boolean(convite?.aceito);
	const recusado = Boolean(convite && convite.data_feedback !== null && !convite.aceito);

	if (aceito) {
		return (
			<div className="readonly-box success-box">
				<Icon name="check_circle" />
				<span>
					{nome} aceitou sua orientação{convite?.data_feedback ? ` em ${dataBr(convite.data_feedback)}` : ""}
					{convite ? ` (convite enviado em ${dataBr(convite.data_envio)})` : ""}. Continue para
					preencher tema, título e resumo.
				</span>
			</div>
		);
	}

	if (pendente && convite) {
		return (
			<>
				<div className="journey-icon waiting">
					<Icon name="hourglass_top" size={30} />
				</div>
				<div className="status-card">
					<div className="person-line">
						<Avatar nome={nome} />
						<div>
							<strong>{nome}</strong>
							<span>Convite de orientação</span>
						</div>
					</div>
					<StatusChip type="warning">Pendente</StatusChip>
					<div className="timeline">
						<i />
						<div>
							<strong>Convite enviado</strong>
							<span>{dataBr(convite.data_envio)}</span>
						</div>
					</div>
				</div>
				<p className="section-description">Você receberá a resposta aqui assim que o docente responder.</p>
				<PlainButton className="text-link" onClick={onVerConvite}>
					Ver convite enviado
				</PlainButton>
			</>
		);
	}

	return (
		<>
			{recusado && (
				<div className="readonly-box warning-box" style={{ marginBottom: 16 }}>
					<Icon name="info" />
					<span>
						{nome} recusou o convite{convite?.mensagem_feedback ? `: “${convite.mensagem_feedback}”` : ""}. Escolha outro orientador.
					</span>
				</div>
			)}
			<CatalogoTemas idCurso={idCurso} onConvidar={(codigo) => onConvidar(codigo)} />
			<div className="alternative-action">
				<span>O docente que você procura não tem tema cadastrado?</span>
				<Button variant="secondary" icon="send" onClick={() => onConvidar()}>
					Convidar orientador
				</Button>
			</div>
		</>
	);
}
