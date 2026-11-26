export interface AnoSemestre {
	ano: number;
	semestre: number;
}

export interface OrientadoresDefinidosResponse {
	total: number;
	comOrientador: number;
}

export interface EtapaItem {
	etapa: number;
	quantidade: number;
}

export interface TccPorEtapaResponse {
	distribuicao: EtapaItem[];
}

export interface ConvitePeriodoPonto {
	data: string;
	[key: string]: unknown;
}

export interface ConvitesPorPeriodoResponse {
	pontos: ConvitePeriodoPonto[];
}

export interface ConvitesStatusResponse {
	respondidos: number;
	pendentes: number;
	total: number;
}

export interface PorDocenteItem {
	nome?: string;
	codigo_docente: string;
	quantidade: number;
}

export interface PorDocenteResponse {
	itens: PorDocenteItem[];
}

export interface ItensResponse<T = unknown> {
	itens: T[];
}

export interface EstudanteSemConviteBanca {
	id_tcc: number;
	nome: string;
	matricula: string;
	nomeCurso: string;
	faseLabel: string;
}

export interface DocenteSemDisponibilidadeBanca {
	codigo_docente: string;
	nome: string;
}

export interface DefesaAgendada {
	data: string;
	hora: string;
	fase_label?: string;
	fase?: number;
	estudante: string;
	titulo?: string;
	orientador?: string;
	banca?: string[];
}

/* ---------- Novo design (Visão geral e Defesas) ---------- */

export interface PeriodoComparacao extends AnoSemestre {
	total: number;
	comOrientador: number;
	percentual: number;
}

export interface OrientadoresDefinidosDetalhe extends OrientadoresDefinidosResponse {
	percentual: number;
	periodo_anterior: PeriodoComparacao | null;
	variacao_total: number | null;
	variacao_percentual: number | null;
}

export interface ConvitesStatusDetalhe extends ConvitesStatusResponse {
	pendentes_antigos: number;
	dias_pendencia: number;
}

export interface EtapaFaseItem {
	fase: number;
	etapa: number;
	etapa_label: string;
	quantidade: number;
}

export interface ConvitesMesPonto {
	mes: string; // "AAAA-MM"
	orientacao: number;
	banca: number;
}

export type ConfirmacaoMembro = "confirmado" | "pendente" | "recusado";
export type StatusDefesa = "agendada" | "aguardando_confirmacao" | "concluida";

export interface MembroDefesa {
	codigo: string;
	nome: string;
	papel: "orientador" | "banca";
	externo: boolean;
	confirmacao: ConfirmacaoMembro;
	avaliacao: number | null;
}

export interface DefesaAgenda {
	id_tcc: number;
	data: string;
	hora: string;
	data_hora: string;
	fase: number;
	fase_label: string;
	fase_descricao: string;
	ano: number;
	semestre: number;
	id_curso: number;
	estudante: string;
	matricula: string;
	titulo: string;
	local: string | null;
	orientador: string;
	banca: string[];
	membros: MembroDefesa[];
	status: StatusDefesa;
	nota_media: number | null;
	papel_docente?: "orientador" | "avaliador";
}

export interface PendenciaTcc {
	codigo: "SEM_CONVITE_ORIENTACAO" | "SEM_CONVITE_BANCA" | "CONVITE_BANCA_INCOMPLETO";
	descricao: string;
}

export interface EstudantePendenteBanca {
	id_tcc: number;
	matricula: string;
	nome: string;
	id_curso: number;
	nomeCurso: string;
	fase: number;
	etapa: number;
	etapa_label: string;
	pendencia: PendenciaTcc;
	prazo: string | null;
}

export interface DocenteSemDisponibilidade {
	codigo_docente: string;
	nome: string;
	siape: number | null;
	email: string | null;
}

export interface ListaComTotal<T> {
	total: number;
	itens: T[];
}
