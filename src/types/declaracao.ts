export interface Declaracao {
	id_tcc: number;
	ano: number;
	semestre: number;
	fase: number;
	titulo_tcc: string;
	matricula?: string;
	nome_dicente: string | null;
	nome_docente: string | null;
	siape_docente?: number;
	codigo_docente?: string;
	externo: boolean;
	instituicao?: string | null;
	nome_curso?: string;
	nome_coordenador?: string;
	siape_coordenador?: number;
	tipo_participacao: "orientacao" | "banca";
	foi_orientador: boolean;
	data_defesa?: string | null;
}

export interface DeclaracoesFiltros {
	curso?: number | string;
	ano?: number | string;
	semestre?: number | string;
	fase?: number | string;
}
