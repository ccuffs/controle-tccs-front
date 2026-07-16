import type { Docente } from "./docente";

export interface AreaTcc {
	id: number;
	descricao: string;
	codigo_docente: string;
	docente?: Docente;
}

export interface OfertaTcc {
	ano: number;
	semestre: number;
	id_curso: number;
	fase: number;
}

export interface TemaTcc {
	id: number;
	descricao: string;
	id_area_tcc: number;
	codigo_docente: string;
	ativo: boolean;
	areaTcc?: AreaTcc;
	docente?: Docente;
	vagasOferta?: number;
}
