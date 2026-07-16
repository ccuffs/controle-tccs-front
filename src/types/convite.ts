import type { Docente } from "./docente";
import type { TrabalhoConclusao } from "./trabalho-conclusao";

export interface Convite {
	id_tcc: number;
	codigo_docente: string;
	fase: number;
	data_envio: string;
	mensagem_envio: string;
	data_feedback: string | null;
	aceito: boolean;
	mensagem_feedback: string;
	orientacao: boolean;
	trabalhoConclusao?: TrabalhoConclusao;
	docente?: Docente;
}
