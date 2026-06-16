/**
 * Determina o tipo de participação baseado no campo foi_orientador
 */
export function obterTipoParticipacao(foiOrientador) {
	return foiOrientador ? "orientacao" : "banca";
}

/**
 * Mapeia fase para texto descritivo
 */
export function obterDescricaoFase(fase) {
	const fases = {
		0: "Orientação",
		1: "Projeto",
		2: "TCC",
	};
	return fases[fase] || `Fase ${fase}`;
}

/**
 * Formata período (ano/semestre)
 */
export function formatarPeriodo(ano, semestre) {
	return `${ano}/${semestre}`;
}

/**
 * Obtém o texto de participação (Orientador ou Banca)
 */
export function obterTextoParticipacao(foiOrientador) {
	return foiOrientador ? "Orientador" : "Banca";
}

/**
 * Gera o nome do arquivo PDF
 */
export function gerarNomeArquivoPdf(nomeDicente, tipoParticipacao) {
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
export function gerarCssImpressao() {
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
export function injetarCssNoHead(htmlDeclaracao, cssImpressao) {
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
export function obterConfiguracoesPdf(nomeArquivo) {
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
export function obterCursoUnicoUsuario(usuario) {
	if (usuario?.cursos && usuario.cursos.length === 1) {
		return usuario.cursos[0].id;
	}
	return null;
}

/**
 * Valida se o curso foi selecionado
 */
export function validarCursoSelecionado(cursoSelecionado) {
	return !!cursoSelecionado;
}

// Exportação padrão
const declaracoesController = {
	obterTipoParticipacao,
	obterDescricaoFase,
	formatarPeriodo,
	obterTextoParticipacao,
	gerarNomeArquivoPdf,
	gerarCssImpressao,
	injetarCssNoHead,
	obterConfiguracoesPdf,
	obterCursoUnicoUsuario,
	validarCursoSelecionado,
};

export default declaracoesController;
