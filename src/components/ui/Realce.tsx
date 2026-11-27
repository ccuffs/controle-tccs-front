import { normalizar } from "../../hooks/useListaLocal";

/**
 * Trechos [início, fim) de `texto` que contêm `busca`, com a mesma regra da busca
 * (sem diferenciar acentos nem maiúsculas). Os índices são do texto original:
 * buscar "andre" em "ANDRÉ" devolve o trecho inteiro, com o "É".
 */
export function trechosEncontrados(texto: string, busca: string): [number, number][] {
	const termo = normalizar(busca.trim());
	if (!termo) return [];

	// Texto comparável e, para cada caractere dele, onde começa e termina no original.
	let comparavel = "";
	const inicioOriginal: number[] = [];
	const fimOriginal: number[] = [];
	let posicao = 0;
	for (const caractere of texto) {
		for (const c of normalizar(caractere)) {
			comparavel += c;
			inicioOriginal.push(posicao);
			fimOriginal.push(posicao + caractere.length);
		}
		posicao += caractere.length;
	}

	const trechos: [number, number][] = [];
	for (let i = comparavel.indexOf(termo); i !== -1; i = comparavel.indexOf(termo, i + termo.length)) {
		const inicio = inicioOriginal[i] ?? 0;
		let fim = fimOriginal[i + termo.length - 1] ?? texto.length;
		// Acento escrito como caractere separado (ex.: "E" + "◌́") fica junto da letra.
		while (fim < texto.length && /\p{M}/u.test(texto.charAt(fim))) fim++;
		trechos.push([inicio, fim]);
	}
	return trechos;
}

interface RealceProps {
	texto: string | number | null | undefined;
	/** Termo buscado; vazio mostra o texto sem realce. */
	busca: string;
}

/** Texto com os trechos que casam com a busca realçados (`<mark>`). */
export function Realce({ texto, busca }: RealceProps) {
	const valor = texto == null ? "" : String(texto);
	const trechos = trechosEncontrados(valor, busca);
	if (trechos.length === 0) return <>{valor}</>;

	const partes = [];
	let atual = 0;
	for (const [inicio, fim] of trechos) {
		if (inicio > atual) partes.push(valor.slice(atual, inicio));
		partes.push(
			<mark key={inicio} className="realce">
				{valor.slice(inicio, fim)}
			</mark>,
		);
		atual = fim;
	}
	if (atual < valor.length) partes.push(valor.slice(atual));
	return <>{partes}</>;
}
