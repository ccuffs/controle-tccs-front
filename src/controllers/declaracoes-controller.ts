export interface ConfiguracoesPdf {
	margin: number;
	filename: string;
	image: { type: string; quality: number };
	html2canvas: {
		scale: number;
		useCORS: boolean;
		letterRendering: boolean;
		windowWidth: number;
	};
	jsPDF: {
		unit: string;
		format: string;
		orientation: string;
	};
}

interface UsuarioComCursos {
	cursos?: { id: number }[];
}

/**
 * Determina o tipo de participação baseado no campo foi_orientador
 */
export function obterTipoParticipacao(foiOrientador: boolean): string {
	return foiOrientador ? "orientacao" : "banca";
}

/**
 * Mapeia fase para texto descritivo
 */
export function obterDescricaoFase(fase: number): string {
	const fases: Record<number, string> = {
		0: "Orientação",
		1: "TCC I",
		2: "TCC II",
	};
	return fases[fase] || `Fase ${fase}`;
}

/**
 * Formata período (ano/semestre)
 */
export function formatarPeriodo(ano: number, semestre: number): string {
	return `${ano}/${semestre}`;
}

/**
 * Obtém o texto de participação (Orientador ou Banca)
 */
export function obterTextoParticipacao(foiOrientador: boolean): string {
	return foiOrientador ? "Orientador" : "Banca";
}

const PARTICULAS_PT = new Set([
	"a", "as", "o", "os", "e",
	"de", "da", "do", "das", "dos",
	"em", "na", "no", "nas", "nos",
	"para", "com", "por", "sob", "sobre",
	"entre", "sem", "ao", "aos", "à", "às",
	"pela", "pelo", "pelas", "pelos",
]);

function capitalizarPalavra(palavra: string): string {
	return palavra
		.split("-")
		.map((parte) => {
			if (!parte) return parte;
			const idxApostrofe = parte.search(/['’]/);
			if (idxApostrofe >= 0 && idxApostrofe < parte.length - 1) {
				const prefixo = parte.slice(0, idxApostrofe + 1).toLowerCase();
				const resto = parte.slice(idxApostrofe + 1);
				return (
					prefixo +
					resto.charAt(0).toLocaleUpperCase("pt-BR") +
					resto.slice(1).toLocaleLowerCase("pt-BR")
				);
			}
			return (
				parte.charAt(0).toLocaleUpperCase("pt-BR") +
				parte.slice(1).toLocaleLowerCase("pt-BR")
			);
		})
		.join("-");
}

/**
 * Capitaliza nomes próprios seguindo regras do português.
 * Ex.: "JOÃO DA SILVA" → "João da Silva"
 */
export function formatarNomeProprio(
	texto: string | null | undefined,
): string {
	if (!texto?.trim()) return texto || "";

	return texto
		.trim()
		.split(/\s+/)
		.map((palavra, index) => {
			const lower = palavra.toLocaleLowerCase("pt-BR");
			if (index > 0 && PARTICULAS_PT.has(lower)) return lower;
			return capitalizarPalavra(palavra);
		})
		.join(" ");
}

/**
 * Gera o nome do arquivo PDF
 */
export function gerarNomeArquivoPdf(
	nomeDicente: string,
	tipoParticipacao: string,
): string {
	const nomeLimpo = nomeDicente
		.toLowerCase()
		.replace(/\s+/g, "_")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
	return `declaracao_${nomeLimpo}_${tipoParticipacao}.pdf`;
}

/**
 * Retorna um trecho de CSS a ser injetado no <head> do documento HTML da declaração.
 * Não define @media print para não interferir com o html2canvas (que captura em modo tela).
 * O template já carrega suas próprias fontes e espaçamentos via classe .c22.
 */
export function gerarCssImpressao(): string {
	return `
		<style>
			* {
				-webkit-print-color-adjust: exact;
				color-adjust: exact;
			}
			@media print {
				@page {
					size: A4;
					margin: 0;
				}
			}
		</style>
	`;
}

/**
 * Injeta o CSS de impressão corretamente dentro do <head> do HTML da declaração.
 * Evita colocar o <style> antes do <html>, o que seria markup inválido.
 */
export function injetarCssNoHead(
	htmlDeclaracao: string,
	cssImpressao: string,
): string {
	if (htmlDeclaracao.includes("</head>")) {
		return htmlDeclaracao.replace("</head>", `${cssImpressao}</head>`);
	}
	return cssImpressao + htmlDeclaracao;
}

/**
 * Configurações para geração de PDF com html2pdf
 * Margem zero porque o template HTML já define seu próprio espaçamento interno (.c22).
 * windowWidth fixo em 794px (A4 a 96 DPI) para garantir que o texto quebre
 * nas mesmas posições que aparecem na tela da nova aba.
 */
export function obterConfiguracoesPdf(nomeArquivo: string): ConfiguracoesPdf {
	return {
		margin: 0,
		filename: nomeArquivo,
		image: { type: "jpeg", quality: 0.98 },
		html2canvas: {
			scale: 2,
			useCORS: true,
			letterRendering: true,
			windowWidth: 794,
		},
		jsPDF: {
			unit: "in",
			format: "a4",
			orientation: "portrait",
		},
	};
}

/**
 * Verifica se usuário tem apenas um curso e retorna o ID
 */
export function obterCursoUnicoUsuario(
	usuario: UsuarioComCursos | null | undefined,
): number | null {
	if (usuario?.cursos && usuario.cursos.length === 1) {
		return usuario.cursos[0]?.id ?? null;
	}
	return null;
}

/**
 * Valida se o curso foi selecionado
 */
export function validarCursoSelecionado(
	cursoSelecionado: string | number | null | undefined,
): boolean {
	return !!cursoSelecionado;
}

// Exportação padrão
const declaracoesController = {
	obterTipoParticipacao,
	obterDescricaoFase,
	formatarPeriodo,
	obterTextoParticipacao,
	formatarNomeProprio,
	gerarNomeArquivoPdf,
	gerarCssImpressao,
	injetarCssNoHead,
	obterConfiguracoesPdf,
	obterCursoUnicoUsuario,
	validarCursoSelecionado,
};

export default declaracoesController;
