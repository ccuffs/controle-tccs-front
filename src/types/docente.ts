import type { Curso } from "./curso";

export interface Docente {
	codigo: string;
	email: string;
	nome: string | null;
	sala: number | null;
	siape: number | null;
	externo: boolean;
	instituicao: string | null;
	id_usuario: string | null;
	cursos?: Curso[];
	cursosOrientacao?: Curso[];
}
