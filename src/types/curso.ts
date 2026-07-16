import type { Docente } from "./docente";

export interface Curso {
	id: number;
	codigo: number | null;
	nome: string | null;
	turno: string | null;
	coordenador: string | null;
	coordenadorDocente?: Docente;
	docentes?: Docente[];
	orientadores?: Docente[];
}

/**
 * Relação "docente pode orientar neste curso" (`orientadores_curso`) — não
 * confundir com `Orientacao` (`orientacao`), que vincula um docente a um TCC
 * específico. Ambas as rotas `/orientadores/*` do backend retornam esta forma.
 */
export interface OrientadorCurso {
	id_curso: number;
	codigo_docente: string;
	curso?: Curso;
	docente?: Docente;
}

/**
 * Relação "docente pode participar de banca neste curso" (`banca_curso`).
 */
export interface BancaCurso {
	id_curso: number;
	codigo_docente: string;
	curso?: Curso;
	docente?: Docente;
}
