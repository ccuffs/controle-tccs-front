import type { OrientadorCurso } from "../types/curso";

interface TemaComVagas {
	id: number;
	codigo_docente?: string;
	docenteNome?: string;
	vagasOferta?: number;
	vagas?: number;
	docente?: { codigo?: string };
	areaTcc?: { id?: number };
}

interface FormDataTema {
	descricao: string;
	id_area_tcc: string | number;
	codigo_docente: string;
}

interface NovaArea {
	descricao: string;
	codigo_docente: string;
}

interface VagasFormData {
	id: number | null;
	vagas: number;
	codigoDocente: string | null;
	docenteNome: string | null;
}

interface ValidacaoModalArea {
	valido: boolean;
	mensagem?: string;
	codigoDocente?: string;
}

interface Usuario {
	id?: string;
	nome?: string | null;
}

interface EstatisticasTemas {
	totalTemas: number;
	docentesUnicos: number;
	areasUnicas: number;
}

/**
 * Extrai cursos das orientações
 */
export function extrairCursos(orientacoes: OrientadorCurso[]): unknown[] {
	return orientacoes.map((orientacao) => orientacao.curso);
}

/**
 * Verifica se deve pré-selecionar curso único
 */
export function devPreSelecionarCurso(cursos: { id: number }[]): number | null {
	return cursos.length === 1 ? (cursos[0]?.id ?? null) : null;
}

/**
 * Prepara dados iniciais do formulário
 */
export function prepararFormDataInicial(
	isOrientadorView: boolean,
	usuarioCodigo: string | undefined,
): FormDataTema {
	return {
		descricao: "",
		id_area_tcc: "",
		codigo_docente: isOrientadorView ? usuarioCodigo || "" : "",
	};
}

/**
 * Prepara dados iniciais de nova área
 */
export function prepararNovaAreaInicial(): NovaArea {
	return {
		descricao: "",
		codigo_docente: "",
	};
}

/**
 * Prepara dados iniciais de vagas
 */
export function prepararVagasInicial(): VagasFormData {
	return {
		id: null,
		vagas: 0,
		codigoDocente: null,
		docenteNome: null,
	};
}

/**
 * Valida campos obrigatórios do tema
 */
export function validarCamposTema(
	descricao: string | undefined,
	idAreaTcc: string | number | undefined,
	codigoDocente: string | undefined,
): boolean {
	return !!(descricao && idAreaTcc && codigoDocente);
}

/**
 * Valida descrição da área
 */
export function validarDescricaoArea(descricao: string | undefined): boolean {
	return !!descricao;
}

/**
 * Prepara dados de vagas para edição
 */
export function prepararDadosVagas(
	tema: TemaComVagas,
	isOrientadorView: boolean,
	usuario: Usuario | null | undefined,
): VagasFormData {
	const codigoDocente = isOrientadorView
		? usuario?.id
		: tema.codigo_docente;
	const docenteNome = isOrientadorView ? usuario?.nome : tema.docenteNome;

	return {
		id: tema.id,
		vagas: tema.vagasOferta || tema.vagas || 0,
		codigoDocente: codigoDocente ?? null,
		docenteNome: docenteNome ?? null,
	};
}

/**
 * Prepara dados de nova área para criação
 */
export function prepararDadosNovaArea(
	codigoDocente: string,
	descricao: string,
): NovaArea {
	return {
		descricao,
		codigo_docente: codigoDocente,
	};
}

/**
 * Valida se pode abrir modal de área
 */
export function validarAberturaModalArea(
	isOrientadorView: boolean,
	usuarioCodigo: string | undefined,
	formDataCodigoDocente: string | undefined,
): ValidacaoModalArea {
	const codigoDocente = isOrientadorView
		? usuarioCodigo
		: formDataCodigoDocente;

	if (!codigoDocente) {
		const mensagem = isOrientadorView
			? "Erro: Código do docente não encontrado!"
			: "Por favor, selecione um docente primeiro!";
		return { valido: false, mensagem };
	}

	return { valido: true, codigoDocente };
}

/**
 * Formata mensagem de sucesso de atualização de vagas
 */
export function formatarMensagemSucessoVagas(
	isOrientadorView: boolean,
	docenteNome: string | null | undefined,
): string {
	return isOrientadorView
		? "Vagas da sua oferta atualizadas com sucesso!"
		: `Vagas da oferta do ${docenteNome} atualizadas com sucesso!`;
}

/**
 * Calcula estatísticas dos temas
 */
export function calcularEstatisticasTemas(
	temas: TemaComVagas[],
): EstatisticasTemas {
	const totalTemas = temas.length;

	const docentesUnicos = Object.keys(
		temas.reduce<Record<string, boolean>>((acc, tema) => {
			const codigo = tema.docente?.codigo || "sem-docente";
			acc[codigo] = true;
			return acc;
		}, {}),
	).length;

	const areasUnicas = Object.keys(
		temas.reduce<Record<string, boolean>>((acc, tema) => {
			const idArea = String(tema.areaTcc?.id || "sem-area");
			acc[idArea] = true;
			return acc;
		}, {}),
	).length;

	return {
		totalTemas,
		docentesUnicos,
		areasUnicas,
	};
}

// Exportação padrão
const temasTccController = {
	extrairCursos,
	devPreSelecionarCurso,
	prepararFormDataInicial,
	prepararNovaAreaInicial,
	prepararVagasInicial,
	validarCamposTema,
	validarDescricaoArea,
	prepararDadosVagas,
	prepararDadosNovaArea,
	validarAberturaModalArea,
	formatarMensagemSucessoVagas,
	calcularEstatisticasTemas,
};

export default temasTccController;
