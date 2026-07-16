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
