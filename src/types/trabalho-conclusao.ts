import type { Curso } from "./curso";
import type { Defesa } from "./defesa";
import type { Dicente } from "./dicente";
import type { Docente } from "./docente";

export interface OrientacaoEmbutida {
	id: number;
	codigo_docente: string;
	id_tcc: number;
	orientador: boolean;
	docente?: {
		codigo: string;
		nome: string | null;
		email: string;
	};
}

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
	/** Orientações embutidas retornadas pela API (Sequelize inclui como "Orientacoes" ou "orientacoes") */
	Orientacoes?: OrientacaoEmbutida[];
	orientacoes?: OrientacaoEmbutida[];
	Defesas?: Defesa[];
	defesas?: Defesa[];
}

/** Uma linha do grid: o mesmo aluno pode aparecer duas vezes (Projeto e TCC). */
export interface LinhaOrientacao extends Dicente {
	idLinha: string;
	tccId: number;
	faseTcc: number;
	anoTcc: number;
	semestreTcc: number;
	/** true quando a linha representa um período já concluído (ex.: fase 1 de
	 * um TCC que já avançou para fase 2) — apenas leitura, sem edição. */
	historico: boolean;
}

export interface Orientacao {
	id: number;
	codigo_docente: string;
	id_tcc: number;
	orientador: boolean;
	docente?: Docente;
	trabalhoConclusao?: TrabalhoConclusao;
}
