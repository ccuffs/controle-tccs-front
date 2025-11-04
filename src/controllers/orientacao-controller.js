/**
 * Obtém o ano e semestre atual
 */
export function getAnoSemestreAtual() {
	const data = new Date();
	const anoAtual = data.getFullYear();
	const semestreAtual = data.getMonth() < 6 ? 1 : 2;
	return { ano: anoAtual, semestre: semestreAtual };
}

/**
 * Extrai cursos únicos das orientações
 */
export function extrairCursosUnicos(orientacoes) {
	return orientacoes.map((orientacao) => orientacao.curso);
}

/**
 * Ordena dicentes por nome
 */
export function ordenarDicentesPorNome(dicentes) {
	return [...dicentes].sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Filtra orientações por critérios
 */
export function filtrarOrientacoes(orientacoes, { cursoSelecionado, ano, semestre, fase }) {
	return orientacoes.filter((o) => {
		const tcc = o.TrabalhoConclusao;
		if (!tcc) return false;

		return (
			tcc.Curso?.id === parseInt(cursoSelecionado) &&
			tcc.ano === parseInt(ano) &&
			tcc.semestre === parseInt(semestre) &&
			(fase === "" || tcc.fase === parseInt(fase))
		);
	});
}

/**
 * Extrai dicentes das orientações
 */
export function extrairDicentesDasOrientacoes(orientacoes) {
	return orientacoes
		.map((o) => o.TrabalhoConclusao?.Dicente)
		.filter((dicente) => dicente !== null && dicente !== undefined);
}

/**
 * Cria mapa de trabalhos por matrícula (escolhendo o mais recente)
 */
export function criarMapaTrabalhoPorMatricula(trabalhos) {
	const mapa = {};
	for (const t of trabalhos) {
		const mat = t.Dicente?.matricula || t.matricula;
		if (!mat) continue;
		if (!mapa[mat] || (t.id && mapa[mat].id && t.id > mapa[mat].id)) {
			mapa[mat] = t;
		}
	}
	return mapa;
}

/**
 * Extrai IDs únicos de TCCs
 */
export function extrairIdsTcc(trabalhos) {
	return Array.from(new Set(trabalhos.map((t) => t.id).filter(Boolean)));
}

/**
 * Cria mapa de convites por TCC
 */
export function criarMapaConvitesPorTcc(resultados) {
	const mapaConvites = {};
	for (const { id, convites } of resultados) {
		mapaConvites[id] = convites;
	}
	return mapaConvites;
}

/**
 * Busca orientação atual por matrícula
 */
export function buscarOrientacaoAtual(
	orientacoes,
	matricula,
	{ cursoSelecionado, ano, semestre, fase },
) {
	if (!cursoSelecionado || !ano || !semestre || !fase) return null;

	const orientacao = orientacoes.find((o) => {
		const tcc = o.TrabalhoConclusao || o.trabalhoConclusao;
		const mat = tcc?.matricula;
		const cursoId = tcc?.Curso?.id || tcc?.id_curso || tcc?.idCurso;
		const faseTcc = tcc?.fase != null ? parseInt(tcc.fase) : undefined;
		const anoT = tcc?.ano;
		const semestreT = tcc?.semestre;
		const isOrientador = o.orientador === true;
		return (
			isOrientador &&
			mat === matricula &&
			anoT === parseInt(ano) &&
			semestreT === parseInt(semestre) &&
			cursoId === cursoSelecionado &&
			faseTcc === parseInt(fase)
		);
	});

	return orientacao || null;
}

/**
 * Obtém dados do orientador atual
 */
export function obterOrientadorAtual(orientacao) {
	if (!orientacao) return null;

	return {
		id: orientacao.id,
		codigo: orientacao.codigo_docente || orientacao.codigo || "",
		nome: orientacao.Docente?.nome || "Orientador",
	};
}

/**
 * Obtém nome do orientador
 */
export function obterNomeOrientador(orientador) {
	return orientador?.nome || "Sem orientador";
}

/**
 * Gera lista de anos únicos das ofertas
 */
export function gerarAnosUnicos(ofertas) {
	return [
		...new Set(
			ofertas
				.filter(
					(oferta) =>
						oferta &&
						typeof oferta.ano === "number" &&
						oferta.ano > 0,
				)
				.map((oferta) => oferta.ano),
		),
	].sort((a, b) => a - b);
}

/**
 * Gera lista de semestres únicos das ofertas
 */
export function gerarSemestresUnicos(ofertas) {
	return [
		...new Set(
			ofertas
				.filter(
					(oferta) =>
						oferta &&
						typeof oferta.semestre === "number" &&
						oferta.semestre > 0,
				)
				.map((oferta) => oferta.semestre),
		),
	].sort((a, b) => a - b);
}

/**
 * Gera lista de fases únicas das ofertas
 */
export function gerarFasesUnicas(ofertas) {
	return [
		...new Set(
			ofertas
				.filter(
					(oferta) =>
						oferta &&
						oferta.fase !== null &&
						oferta.fase !== undefined,
				)
				.map((oferta) => oferta.fase.toString()),
		),
	]
		.filter((fase) => fase && fase !== "undefined" && fase !== "null")
		.sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * Verifica se tem convite de orientação
 */
export function temConviteOrientacao(convites) {
	return Array.isArray(convites)
		? convites.some((c) => c.orientacao === true)
		: false;
}

/**
 * Verifica se tem convite de banca na fase
 */
export function temConviteBancaNaFase(convites, faseAtualTcc, fase) {
	const convitesBanca = Array.isArray(convites)
		? convites.filter((c) => c.orientacao === false)
		: [];

	return convitesBanca.some((c) =>
		faseAtualTcc == null
			? true
			: fase
				? parseInt(c.fase) === faseAtualTcc
				: true,
	);
}

/**
 * Calcula média das notas de defesa
 */
export function calcularMediaDefesa(defesas, fase) {
	const notas = defesas
		.filter((d) => (fase ? parseInt(d.fase) === fase : true))
		.map((d) => d.avaliacao)
		.filter((v) => v !== null && v !== undefined);

	return notas.length > 0
		? notas.reduce((a, b) => a + Number(b), 0) / notas.length
		: null;
}

/**
 * Filtra convites de orientação por fase
 */
export function filtrarConvitesOrientacao(convites, fase) {
	return (convites || []).filter(
		(c) => c.orientacao === true && parseInt(c.fase) === parseInt(fase),
	);
}

/**
 * Filtra convites de banca por fase
 */
export function filtrarConvitesBanca(convites, fase) {
	return (convites || []).filter(
		(c) => c.orientacao === false && parseInt(c.fase) === parseInt(fase),
	);
}

/**
 * Filtra defesas por fase
 */
export function filtrarDefesasPorFase(defesas, fase) {
	return defesas.filter(
		(defesa) => parseInt(defesa.fase) === parseInt(fase) && !defesa.orientador,
	);
}

/**
 * Extrai membros da banca das defesas
 */
export function extrairMembrosBanca(defesas) {
	const membros = {
		membroBanca1: "",
		membroBanca2: "",
		dataHoraDefesa: null,
	};

	if (defesas.length > 0) {
		membros.membroBanca1 = defesas[0]?.membro_banca || "";
		if (defesas[0]?.data_defesa) {
			membros.dataHoraDefesa = new Date(defesas[0].data_defesa);
		}
	}

	if (defesas.length > 1) {
		membros.membroBanca2 = defesas[1]?.membro_banca || "";
	}

	return membros;
}

/**
 * Prepara payload para criar/atualizar convite de orientação
 */
export function prepararConviteOrientacao(
	idTcc,
	fase,
	codigoDocente,
	mensagem,
	aceito = true,
) {
	const dataAtual = new Date().toISOString();

	return {
		id_tcc: idTcc,
		codigo_docente: codigoDocente,
		fase: parseInt(fase),
		data_envio: dataAtual,
		mensagem_envio: mensagem,
		data_feedback: dataAtual,
		aceito: aceito,
		mensagem_feedback: mensagem,
		orientacao: true,
	};
}

/**
 * Prepara payload para criar orientação
 */
export function prepararOrientacao(codigoDocente, idTcc) {
	return {
		codigo_docente: codigoDocente,
		id_tcc: idTcc,
		orientador: true,
	};
}

/**
 * Prepara payload para gerenciar banca
 */
export function prepararPayloadGerenciarBanca(
	idTcc,
	fase,
	membrosNovos,
	membrosExistentes,
	convites,
	alteracoes,
	orientadorCodigo,
	dataHoraDefesa,
) {
	return {
		id_tcc: idTcc,
		fase: parseInt(fase),
		membros_novos: membrosNovos,
		membros_existentes: membrosExistentes,
		convites_banca_existentes: convites,
		alteracoes: alteracoes,
		orientador_codigo: orientadorCodigo,
		data_hora_defesa: dataHoraDefesa,
	};
}

/**
 * Prepara payload para agendar defesa
 */
export function prepararPayloadAgendarDefesa(
	idTcc,
	fase,
	data,
	hora,
	codigoOrientador,
	membrosBanca,
) {
	return {
		id_tcc: idTcc,
		fase: parseInt(fase),
		data: data,
		hora: hora,
		codigo_orientador: codigoOrientador,
		membros_banca: membrosBanca,
	};
}

/**
 * Identifica alterações na banca
 */
export function identificarAlteracoesBanca(
	membrosNovos,
	membrosExistentes,
	convites,
) {
	const alteracoes = [];

	for (const membroExistente of membrosExistentes) {
		if (!membrosNovos.includes(membroExistente) && membrosNovos.length > 0) {
			const membroSubstituto = membrosNovos.find(
				(novoMembro) => !membrosExistentes.includes(novoMembro),
			);

			if (membroSubstituto) {
				const conviteAntigo = convites.find(
					(c) => c.codigo_docente === membroExistente,
				);

				if (conviteAntigo && conviteAntigo.aceito === true) {
					alteracoes.push({
						membro_antigo: membroExistente,
						membro_novo: membroSubstituto,
					});
				}
			}
		}
	}

	return alteracoes;
}

/**
 * Valida se pode salvar com data de defesa
 */
export function validarSalvarComDataDefesa(dataHoraDefesa, membroBanca1, membroBanca2) {
	if (dataHoraDefesa) {
		return membroBanca1 && membroBanca2;
	}
	return true;
}

/**
 * Prepara dados de edição para modal
 */
export function prepararDadosEdicao(
	tcc,
	orientador,
	membrosBanca,
	isOrientadorView,
	usuarioCodigo,
) {
	return {
		orientador: isOrientadorView
			? usuarioCodigo || orientador?.codigo || ""
			: orientador?.codigo || "",
		tema: tcc?.tema || "",
		titulo: tcc?.titulo || "",
		resumo: tcc?.resumo || "",
		seminarioAndamento: tcc?.seminario_andamento || "",
		etapa: tcc?.etapa || 0,
		membroBanca1: membrosBanca?.membroBanca1 || "",
		membroBanca2: membrosBanca?.membroBanca2 || "",
		dataHoraDefesa: membrosBanca?.dataHoraDefesa || null,
	};
}

/**
 * Determina a etapa máxima baseada na fase
 */
export function obterEtapaMaxima(fase) {
	return parseInt(fase) === 2 ? 9 : 6;
}

/**
 * Verifica se edição da banca está habilitada
 */
export function isEdicaoBancaHabilitada(etapa, fase) {
	const etapaNum = parseInt(etapa);
	const faseNum = parseInt(fase);
	return (etapaNum === 5 && faseNum === 1) || (etapaNum === 8 && faseNum === 2);
}

/**
 * Verifica se deve mostrar campos da banca
 */
export function deveMostrarCamposBanca(
	etapa,
	temHistoricoConvites,
	temHistoricoDefesas,
) {
	const etapaNum = parseInt(etapa);
	return etapaNum >= 5 || temHistoricoConvites || temHistoricoDefesas;
}

/**
 * Obtém tipo de defesa baseado na etapa
 */
export function obterTipoDefesa(etapa) {
	return parseInt(etapa) === 8 ? "TCC" : "Projeto";
}

/**
 * Obtém mensagem de ajuda para banca
 */
export function obterMensagemAjudaBanca(etapa, fase, edicaoHabilitada) {
	const tipoDefesa = obterTipoDefesa(etapa);

	if (edicaoHabilitada) {
		return `Selecione 2 docentes para compor a banca de defesa de ${tipoDefesa.toLowerCase()} (além do orientador) e defina a data/hora da defesa`;
	}

	return `Visualização do histórico da banca de defesa de ${tipoDefesa.toLowerCase()}. Campos de seleção disponíveis apenas na etapa ${parseInt(fase) === 1 ? "5" : "8"}.`;
}

/**
 * Obtém helper text para data de defesa
 */
export function obterHelperTextDataDefesa(
	edicaoHabilitada,
	fase,
	dataHoraDefesa,
	membroBanca1,
	membroBanca2,
) {
	if (!edicaoHabilitada) {
		return `Edição disponível apenas na etapa ${parseInt(fase) === 1 ? "5" : "8"}`;
	}

	if (dataHoraDefesa && (!membroBanca1 || !membroBanca2)) {
		return "⚠️ Selecione os 2 membros da banca para definir a data da defesa";
	}

	return "Selecione a data e horário para a defesa";
}

/**
 * Valida se arquivo é PDF
 */
export function validarArquivoPdf(file) {
	return file && file.type === "application/pdf";
}

/**
 * Valida campos obrigatórios para upload
 */
export function validarCamposUpload(ano, semestre, fase, curso) {
	return !!(ano && semestre && fase && curso);
}

/**
 * Formata tamanho de arquivo
 */
export function formatarTamanhoArquivo(bytes) {
	return (bytes / 1024 / 1024).toFixed(2);
}

/**
 * Obtém cor do chip de status de upload
 */
export function obterCorStatusUpload(status) {
	const statusMap = {
		dicente_e_orientacao_inseridos: "success",
		orientacao_inserida: "success",
		dicente_inserido_orientacao_ja_existe: "info",
		orientacao_ja_existe: "warning",
		dicente_ja_existe: "warning",
		inserido: "success",
		já_existe: "warning",
	};

	return statusMap[status] || "error";
}

/**
 * Obtém label do chip de status de upload
 */
export function obterLabelStatusUpload(status) {
	const labelMap = {
		dicente_e_orientacao_inseridos: "Novo dicente + orientação",
		orientacao_inserida: "Orientação criada",
		dicente_inserido_orientacao_ja_existe: "Novo dicente (orientação já existe)",
		orientacao_ja_existe: "Orientação já existe",
		dicente_ja_existe: "Dicente já existe",
		inserido: "Inserido",
		já_existe: "Já existe",
	};

	return labelMap[status] || status;
}

/**
 * Filtra docentes disponíveis (remove orientador e outro membro)
 */
export function filtrarDocentesDisponiveis(
	docentesBanca,
	orientadorCodigo,
	outroMembroCodigo,
) {
	return docentesBanca.filter(
		(item) =>
			item.docente?.codigo !== orientadorCodigo &&
			item.docente?.codigo !== outroMembroCodigo,
	);
}

// Exportação padrão
const orientacaoController = {
	getAnoSemestreAtual,
	extrairCursosUnicos,
	ordenarDicentesPorNome,
	filtrarOrientacoes,
	extrairDicentesDasOrientacoes,
	criarMapaTrabalhoPorMatricula,
	extrairIdsTcc,
	criarMapaConvitesPorTcc,
	buscarOrientacaoAtual,
	obterOrientadorAtual,
	obterNomeOrientador,
	gerarAnosUnicos,
	gerarSemestresUnicos,
	gerarFasesUnicas,
	temConviteOrientacao,
	temConviteBancaNaFase,
	calcularMediaDefesa,
	filtrarConvitesOrientacao,
	filtrarConvitesBanca,
	filtrarDefesasPorFase,
	extrairMembrosBanca,
	prepararConviteOrientacao,
	prepararOrientacao,
	prepararPayloadGerenciarBanca,
	prepararPayloadAgendarDefesa,
	identificarAlteracoesBanca,
	validarSalvarComDataDefesa,
	prepararDadosEdicao,
	obterEtapaMaxima,
	isEdicaoBancaHabilitada,
	deveMostrarCamposBanca,
	obterTipoDefesa,
	obterMensagemAjudaBanca,
	obterHelperTextDataDefesa,
	validarArquivoPdf,
	validarCamposUpload,
	formatarTamanhoArquivo,
	obterCorStatusUpload,
	obterLabelStatusUpload,
	filtrarDocentesDisponiveis,
};

export default orientacaoController;

