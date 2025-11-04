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
 * Gera CSS específico para impressão A4
 */
export function gerarCssImpressao() {
	return `
		<style>
			@media print {
				@page {
					size: A4;
					margin: 0.5in;
				}

				/* Remove headers e footers do navegador */
				@page {
					@top-left { content: ""; }
					@top-center { content: ""; }
					@top-right { content: ""; }
					@bottom-left { content: ""; }
					@bottom-center { content: ""; }
					@bottom-right { content: ""; }
				}

				/* Garante que o conteúdo ocupe toda a página */
				body {
					margin: 0;
					padding: 0;
					font-size: 12pt;
					line-height: 1.4;
				}

				/* Otimiza para A4 */
				* {
					-webkit-print-color-adjust: exact;
					color-adjust: exact;
				}
			}
		</style>
	`;
}

/**
 * Configurações para geração de PDF com html2pdf
 */
export function obterConfiguracoesPdf(nomeArquivo) {
	return {
		margin: 0.5,
		filename: nomeArquivo,
		image: { type: "jpeg", quality: 0.98 },
		html2canvas: {
			scale: 2,
			useCORS: true,
			letterRendering: true,
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
	obterConfiguracoesPdf,
	obterCursoUnicoUsuario,
	validarCursoSelecionado,
};

export default declaracoesController;

