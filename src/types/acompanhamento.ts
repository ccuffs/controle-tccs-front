import type { PendenciaTcc } from "./dashboard";

export interface DocenteOrientacao {
	id_orientacao: number;
	codigo: string;
	nome: string;
}

export interface ItemAcompanhamento {
	id_tcc: number;
	matricula: string;
	nome: string;
	email: string | null;
	id_curso: number;
	ano: number;
	semestre: number;
	periodo: string;
	fase: number;
	fase_label: string;
	etapa: number;
	etapa_label: string;
	progresso: number;
	aprovado: boolean;
	tema: string | null;
	titulo: string | null;
	resumo: string | null;
	orientador: DocenteOrientacao | null;
	coorientadores: DocenteOrientacao[];
	nota_media: number | null;
	pendencias: PendenciaTcc[];
}

export interface RespostaAcompanhamento {
	pagina: number;
	limite: number;
	total: number;
	total_paginas: number;
	codigo_docente?: string;
	itens: ItemAcompanhamento[];
}

export interface FiltrosAcompanhamento {
	q?: string;
	id_curso?: string;
	ano?: string;
	semestre?: string;
	fase?: string;
	codigo_docente?: string;
	pagina?: number;
	limite?: number;
}
