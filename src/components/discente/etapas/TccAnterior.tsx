import { Button, Icon, ModalDialog, PhaseChip, StatusChip } from "../../ui";

interface TccResumo {
	ano: number;
	semestre: number;
	fase: number;
	tema?: string | null;
	titulo?: string | null;
	aprovado_projeto?: boolean;
}

interface Periodo {
	ano: number;
	semestre: number;
}

const periodo = (p: Periodo) => `${p.ano}/${p.semestre}`;

function Resumo({ tcc }: { tcc: TccResumo }) {
	return (
		<div className="orientation-content-preview">
			<div>
				<span>PERÍODO</span>
				<strong>
					{periodo(tcc)} · <PhaseChip fase={tcc.fase} />
				</strong>
			</div>
			{tcc.titulo && (
				<div>
					<span>TÍTULO</span>
					<strong>{tcc.titulo}</strong>
				</div>
			)}
			{tcc.tema && (
				<div>
					<span>TEMA</span>
					<p>{tcc.tema}</p>
				</div>
			)}
		</div>
	);
}

/** TCC já aprovado em período anterior: não há nova jornada a percorrer. */
export function TccConcluido({ tcc }: { tcc: TccResumo }) {
	return (
		<div className="tcc-concluido">
			<div className="journey-icon concluido">
				<Icon name="workspace_premium" size={30} />
			</div>
			<StatusChip type="success">TCC aprovado</StatusChip>
			<h2>Seu TCC foi concluído</h2>
			<p>
				Você concluiu seu Trabalho de Conclusão de Curso em {periodo(tcc)}. Não é necessário repetir o processo; em caso de
				dúvidas, procure a coordenação do curso.
			</p>
			<Resumo tcc={tcc} />
		</div>
	);
}

type Tipo = "next_phase" | "import";

interface TccAnteriorProps {
	tipo: Tipo;
	tcc: TccResumo;
	ofertaAtual: Periodo | null;
	aberto: boolean;
	onAbrir: () => void;
	onFechar: () => void;
	/** true = continuar/importar; false = criar um TCC novo. */
	onEscolher: (importar: boolean) => void;
}

const textos = (tipo: Tipo, tcc: TccResumo, oferta: Periodo | null) => {
	const atual = oferta ? periodo(oferta) : "atual";
	return tipo === "next_phase"
		? {
				icone: "trending_up",
				titulo: "Seu projeto foi aprovado",
				descricao: `O projeto de ${periodo(tcc)} foi aprovado. Continue o mesmo trabalho no TCC II, na oferta ${atual}.`,
				sim: "Continuar no TCC II",
				nao: "Criar novo TCC",
				aviso: "Ao continuar, tema, título, resumo e orientação são mantidos e você começa pelo seminário de andamento.",
			}
		: {
				icone: "history",
				titulo: "Encontramos um TCC anterior",
				descricao: `Você tem um TCC de ${periodo(tcc)}. Deseja aproveitar os dados dele na oferta ${atual}?`,
				sim: "Importar dados",
				nao: "Começar do zero",
				aviso: "Ao importar, um novo TCC é criado na oferta atual com tema, título e resumo do anterior.",
			};
};

/**
 * TCC de período anterior ainda não concluído: diálogo para continuar (TCC II) ou importar
 * os dados, e um cartão na jornada para reabrir a escolha se o diálogo for fechado.
 */
export function TccAnterior({ tipo, tcc, ofertaAtual, aberto, onAbrir, onFechar, onEscolher }: TccAnteriorProps) {
	const t = textos(tipo, tcc, ofertaAtual);
	return (
		<>
			<div className="tcc-concluido">
				<div className="journey-icon">
					<Icon name={t.icone} size={30} />
				</div>
				<h2>{t.titulo}</h2>
				<p>{t.descricao}</p>
				<Resumo tcc={tcc} />
				<div className="jornada-acoes">
					<span />
					<Button icon="arrow_forward" onClick={onAbrir}>
						Escolher como continuar
					</Button>
				</div>
			</div>
			<ModalDialog
				open={aberto}
				onClose={onFechar}
				icon={t.icone}
				title={t.titulo}
				description={t.descricao}
				actions={
					<>
						<Button variant="secondary" onClick={() => onEscolher(false)}>
							{t.nao}
						</Button>
						<Button icon={tipo === "next_phase" ? "arrow_forward" : "download"} onClick={() => onEscolher(true)}>
							{t.sim}
						</Button>
					</>
				}
			>
				<Resumo tcc={tcc} />
				<div className="readonly-box">
					<Icon name="info" />
					<span>{t.aviso}</span>
				</div>
			</ModalDialog>
		</>
	);
}
