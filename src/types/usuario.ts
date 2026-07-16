import type { Curso } from "./curso";

export interface Permissao {
	id: number;
	codigo: string;
	descricao: string | null;
	codigo_categoria_permissao: string;
}

export interface Grupo {
	id: number;
	nome: string;
	descricao: string | null;
	sistema: number;
}

export interface Usuario {
	id: string;
	nome: string | null;
	email: string | null;
	cursos?: Curso[];
	grupos?: Grupo[];
	permissoes?: Permissao[];
	temConsultaTodos?: boolean;
}
