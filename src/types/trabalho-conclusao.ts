import type { Curso } from "./curso";
import type { Dicente } from "./dicente";
import type { Docente } from "./docente";

export interface TrabalhoConclusao {
	id: number;
	ano: number;
	semestre: number;
	id_curso: number;
	fase: number;
	matricula: string;
	tema: string | null;
	titulo: string | null;
	resumo: string | null;
	seminario_andamento: string | null;
	etapa: number | null;
	aprovado_projeto: boolean;
	aprovado_tcc: boolean;
	comentarios_tcc: string | null;
	dicente?: Dicente;
	curso?: Curso;
}

export interface Orientacao {
	id: number;
	codigo_docente: string;
	id_tcc: number;
	orientador: boolean;
	docente?: Docente;
	trabalhoConclusao?: TrabalhoConclusao;
}
