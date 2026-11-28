import { Permissoes } from "../../enums/permissoes";
import type { Grupo } from "../../types/usuario";

export type Perfil = "coordenacao" | "orientador" | "banca" | "discente" | "administracao";

export interface ItemNavegacao {
	id: string;
	rotulo: string;
	icone: string;
	/** Caminho relativo ao perfil (ex.: "visao-geral" → /coordenacao/visao-geral). */
	caminho: string;
	/** Rótulo do grupo no menu lateral (exibido antes do primeiro item do grupo). */
	grupoMenu?: string;
	/** Se informado, o usuário precisa pertencer a um destes grupos. */
	grupos?: number[];
}

const { ADMIN, PROFESSOR_CCR, ORIENTADOR, PROFESSOR, BANCA, ESTUDANTE } = Permissoes.GRUPOS;

export const PERFIS: Record<Perfil, { rotulo: string; grupos: number[]; exceto?: number[] }> = {
	coordenacao: { rotulo: "Coordenador", grupos: [ADMIN, PROFESSOR_CCR] },
	orientador: { rotulo: "Orientador", grupos: [ORIENTADOR, PROFESSOR] },
	/** Só participa de bancas: quem também orienta usa o perfil Orientador. */
	banca: { rotulo: "Banca", grupos: [BANCA], exceto: [ORIENTADOR, PROFESSOR] },
	discente: { rotulo: "Discente", grupos: [ESTUDANTE] },
	administracao: { rotulo: "Administrador", grupos: [ADMIN] },
};

/**
 * Ordem de prioridade para a página inicial (mesma regra do roteamento anterior).
 * Administração por último: o ADMIN continua entrando pela coordenação.
 */
const ORDEM_PERFIS: Perfil[] = ["coordenacao", "orientador", "banca", "discente", "administracao"];

export const NAVEGACAO: Record<Perfil, ItemNavegacao[]> = {
	coordenacao: [
		{ id: "visao-geral", rotulo: "Visão geral", icone: "space_dashboard", caminho: "visao-geral", grupoMenu: "GESTÃO" },
		{ id: "orientacoes", rotulo: "Orientações", icone: "route", caminho: "orientacoes", grupoMenu: "ACOMPANHAMENTO" },
		{ id: "defesas", rotulo: "Defesas", icone: "co_present", caminho: "defesas", grupoMenu: "ACOMPANHAMENTO" },
		{ id: "discentes", rotulo: "Discentes", icone: "school", caminho: "discentes", grupoMenu: "CADASTROS" },
		{ id: "docentes", rotulo: "Docentes", icone: "group", caminho: "docentes", grupoMenu: "CADASTROS" },
		{ id: "temas", rotulo: "Temas", icone: "menu_book", caminho: "temas", grupoMenu: "CADASTROS" },
		{ id: "importar", rotulo: "Importar lista", icone: "upload_file", caminho: "importar", grupoMenu: "FERRAMENTAS" },
	],
	orientador: [
		{ id: "inicio", rotulo: "Início", icone: "home", caminho: "inicio", grupoMenu: "VISÃO GERAL" },
		{ id: "orientandos", rotulo: "Meus orientandos", icone: "school", caminho: "orientandos", grupoMenu: "ORIENTAÇÃO" },
		{ id: "temas", rotulo: "Meus temas", icone: "menu_book", caminho: "temas", grupoMenu: "ORIENTAÇÃO" },
		{ id: "convites", rotulo: "Convites", icone: "mail", caminho: "convites", grupoMenu: "ORIENTAÇÃO" },
		{ id: "disponibilidade", rotulo: "Disponibilidade", icone: "calendar_month", caminho: "disponibilidade", grupoMenu: "BANCAS" },
		{ id: "avaliacoes", rotulo: "Avaliações", icone: "fact_check", caminho: "avaliacoes", grupoMenu: "BANCAS" },
		{ id: "externos", rotulo: "Membros externos", icone: "domain", caminho: "externos", grupoMenu: "BANCAS" },
		{ id: "declaracoes", rotulo: "Declarações", icone: "description", caminho: "declaracoes", grupoMenu: "DOCUMENTOS" },
		{ id: "perfil", rotulo: "Perfil", icone: "person", caminho: "perfil", grupoMenu: "CONTA" },
	],
	banca: [
		{ id: "inicio", rotulo: "Início", icone: "home", caminho: "inicio", grupoMenu: "VISÃO GERAL" },
		{ id: "convites", rotulo: "Convites", icone: "mail", caminho: "convites", grupoMenu: "BANCAS" },
		{ id: "disponibilidade", rotulo: "Disponibilidade", icone: "calendar_month", caminho: "disponibilidade", grupoMenu: "BANCAS" },
		{ id: "avaliacoes", rotulo: "Avaliações", icone: "fact_check", caminho: "avaliacoes", grupoMenu: "BANCAS" },
		{ id: "declaracoes", rotulo: "Declarações", icone: "description", caminho: "declaracoes", grupoMenu: "DOCUMENTOS" },
		{ id: "perfil", rotulo: "Perfil", icone: "person", caminho: "perfil", grupoMenu: "CONTA" },
	],
	discente: [
		{ id: "meu-tcc", rotulo: "Meu TCC", icone: "route", caminho: "meu-tcc" },
		{ id: "temas", rotulo: "Temas disponíveis", icone: "menu_book", caminho: "temas" },
		{ id: "convites", rotulo: "Convites", icone: "mail", caminho: "convites" },
		{ id: "perfil", rotulo: "Perfil", icone: "person", caminho: "perfil" },
	],
	/** Mesmas telas da coordenação, mas com todos os períodos (desde 2020/1), mais Cursos e Design System. */
	administracao: [
		{ id: "visao-geral", rotulo: "Visão geral", icone: "space_dashboard", caminho: "visao-geral", grupoMenu: "GESTÃO" },
		{ id: "orientacoes", rotulo: "Orientações", icone: "route", caminho: "orientacoes", grupoMenu: "ACOMPANHAMENTO" },
		{ id: "defesas", rotulo: "Defesas", icone: "co_present", caminho: "defesas", grupoMenu: "ACOMPANHAMENTO" },
		{ id: "discentes", rotulo: "Discentes", icone: "school", caminho: "discentes", grupoMenu: "CADASTROS" },
		{ id: "docentes", rotulo: "Docentes", icone: "group", caminho: "docentes", grupoMenu: "CADASTROS" },
		{ id: "temas", rotulo: "Temas", icone: "menu_book", caminho: "temas", grupoMenu: "CADASTROS" },
		{ id: "cursos", rotulo: "Cursos", icone: "account_balance", caminho: "cursos", grupoMenu: "CADASTROS" },
		{ id: "importar", rotulo: "Importar lista", icone: "upload_file", caminho: "importar", grupoMenu: "FERRAMENTAS" },
		{ id: "design-system", rotulo: "Design System", icone: "palette", caminho: "design-system", grupoMenu: "FERRAMENTAS" },
	],
};

const pertence = (grupos: Grupo[], ids: number[]) => grupos.some((g) => ids.includes(g.id));

/** Participa só de bancas: tem BANCA, mas não ORIENTADOR nem PROFESSOR. */
export function ehApenasBanca(grupos: Grupo[]): boolean {
	return pertence(grupos, [BANCA]) && !pertence(grupos, [ORIENTADOR, PROFESSOR]);
}

export function perfisDoUsuario(grupos: Grupo[]): Perfil[] {
	return ORDEM_PERFIS.filter((perfil) => {
		const { grupos: exigidos, exceto } = PERFIS[perfil];
		return pertence(grupos, exigidos) && !(exceto && pertence(grupos, exceto));
	});
}

export function itemPermitido(item: ItemNavegacao, grupos: Grupo[]): boolean {
	return !item.grupos || pertence(grupos, item.grupos);
}

export function itensVisiveis(perfil: Perfil, grupos: Grupo[]): ItemNavegacao[] {
	return NAVEGACAO[perfil].filter((item) => itemPermitido(item, grupos));
}

export function caminhoDoItem(perfil: Perfil, item: ItemNavegacao): string {
	return `/${perfil}/${item.caminho}`;
}

/** Primeira página permitida do perfil. */
export function inicioDoPerfil(perfil: Perfil, grupos: Grupo[]): string | null {
	const primeiro = itensVisiveis(perfil, grupos)[0];
	return primeiro ? caminhoDoItem(perfil, primeiro) : null;
}

/** Página inicial do usuário (primeiro perfil disponível na ordem de prioridade). */
export function inicioDoUsuario(grupos: Grupo[]): string | null {
	for (const perfil of perfisDoUsuario(grupos)) {
		const inicio = inicioDoPerfil(perfil, grupos);
		if (inicio) return inicio;
	}
	return null;
}

/** Perfil ativo a partir da URL (/coordenacao/..., /orientador/..., /banca/..., /discente/..., /administracao/...). */
export function perfilDaUrl(pathname: string): Perfil | null {
	const segmento = pathname.split("/")[1];
	return segmento && Object.hasOwn(PERFIS, segmento) ? (segmento as Perfil) : null;
}
