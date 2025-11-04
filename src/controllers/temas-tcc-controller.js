/**
 * Extrai cursos das orientações
 */
export function extrairCursos(orientacoes) {
	return orientacoes.map((orientacao) => orientacao.curso);
}

/**
 * Verifica se deve pré-selecionar curso único
 */
export function devPreSelecionarCurso(cursos) {
	return cursos.length === 1 ? cursos[0].id : null;
}

/**
 * Prepara dados iniciais do formulário
 */
export function prepararFormDataInicial(isOrientadorView, usuarioCodigo) {
	return {
		descricao: "",
		id_area_tcc: "",
		codigo_docente: isOrientadorView ? usuarioCodigo || "" : "",
	};
}

/**
 * Prepara dados iniciais de nova área
 */
export function prepararNovaAreaInicial() {
	return {
		descricao: "",
		codigo_docente: "",
	};
}

/**
 * Prepara dados iniciais de vagas
 */
export function prepararVagasInicial() {
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
export function validarCamposTema(descricao, idAreaTcc, codigoDocente) {
	return !!(descricao && idAreaTcc && codigoDocente);
}

/**
 * Valida descrição da área
 */
export function validarDescricaoArea(descricao) {
	return !!descricao;
}

/**
 * Prepara dados de vagas para edição
 */
export function prepararDadosVagas(tema, isOrientadorView, usuario) {
	const codigoDocente = isOrientadorView
		? usuario?.codigo || usuario?.id
		: tema.codigo_docente;
	const docenteNome = isOrientadorView ? usuario?.nome : tema.docenteNome;

	return {
		id: tema.id,
		vagas: tema.vagasOferta || tema.vagas || 0,
		codigoDocente: codigoDocente,
		docenteNome: docenteNome,
	};
}

/**
 * Prepara dados de nova área para criação
 */
export function prepararDadosNovaArea(codigoDocente, descricao) {
	return {
		descricao,
		codigo_docente: codigoDocente,
	};
}

/**
 * Valida se pode abrir modal de área
 */
export function validarAberturaModalArea(
	isOrientadorView,
	usuarioCodigo,
	formDataCodigoDocente,
) {
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
export function formatarMensagemSucessoVagas(isOrientadorView, docenteNome) {
	return isOrientadorView
		? "Vagas da sua oferta atualizadas com sucesso!"
		: `Vagas da oferta do ${docenteNome} atualizadas com sucesso!`;
}

/**
 * Calcula estatísticas dos temas
 */
export function calcularEstatisticasTemas(temas) {
	const totalTemas = temas.length;

	const docentesUnicos = Object.keys(
		temas.reduce((acc, tema) => {
			const codigo = tema.Docente?.codigo || "sem-docente";
			acc[codigo] = true;
			return acc;
		}, {}),
	).length;

	const areasUnicas = Object.keys(
		temas.reduce((acc, tema) => {
			const idArea = tema.AreaTcc?.id || "sem-area";
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

