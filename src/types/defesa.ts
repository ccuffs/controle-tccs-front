import type { Curso } from "./curso";
import type { Docente } from "./docente";
import type { TrabalhoConclusao } from "./trabalho-conclusao";

export interface Defesa {
	id_tcc: number;
	membro_banca: string;
	fase: number;
	data_defesa: string | null;
	avaliacao: number | null;
	orientador: boolean;
	trabalhoConclusao?: TrabalhoConclusao;
	membroBanca?: Docente;
}

export interface DisponibilidadeBanca {
	ano: number;
	semestre: number;
	id_curso: number;
	fase: number;
	codigo_docente: string;
	data_defesa: string;
	hora_defesa: string;
	docente?: Docente;
	curso?: Curso;
}

export interface GradeDisponibilidade {
	horarios: string[];
	datas: string[];
	disponibilidades: (DisponibilidadeBanca & { disponivel: boolean })[];
	datasDefesa: { inicio: string; fim: string; [key: string]: unknown };
}
