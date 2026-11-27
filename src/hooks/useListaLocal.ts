import { useEffect, useMemo, useState } from "react";

/** Normaliza texto para busca sem acento e sem diferenciar maiúsculas. */
export function normalizar(texto: unknown): string {
	return String(texto ?? "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLocaleLowerCase("pt-BR");
}

export function contemBusca(busca: string, ...valores: unknown[]): boolean {
	const termo = normalizar(busca.trim());
	return !termo || valores.some((v) => normalizar(v).includes(termo));
}

/**
 * Filtro e paginação no cliente; volta para a página 1 quando o filtro muda.
 * `dependencias` são os valores dos quais o filtro depende, comparados item a item
 * (como as dependências de um hook) — a lista deve ter sempre o mesmo tamanho.
 */
export function useListaLocal<T>(itens: T[], filtro: (item: T) => boolean, dependencias: readonly unknown[], porPagina = 10) {
	const [pagina, setPagina] = useState(1);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const filtrados = useMemo(() => itens.filter(filtro), [itens, ...dependencias]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => setPagina(1), dependencias);

	const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
	const paginaAtual = Math.min(pagina, totalPaginas);
	const visiveis = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
	return { filtrados, visiveis, pagina: paginaAtual, setPagina, porPagina };
}
