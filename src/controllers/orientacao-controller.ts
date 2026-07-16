import type { Dicente } from "../types/dicente";
import type { OfertaTcc } from "../types/tema-tcc";

interface CursoLegado {
	id?: number;
	nome?: string | null;
}

interface TrabalhoLegado {
	id?: number;
	ano?: number;
	semestre?: number;
	fase?: number | string;
	matricula?: string;
	tema?: string | null;
	titulo?: string | null;
	resumo?: string | null;
	seminario_andamento?: string | null;
	etapa?: number | null;
	curso?: CursoLegado;
	dicente?: DicenteLegado;
	id_curso?: number;
	idCurso?: number;
}

interface DicenteLegado {
	nome?: string | null;
	matricula?: string;
}

interface OrientacaoLegado {
	id?: number;
	codigo_docente?: string;
	codigo?: string;
	orientador?: boolean;
	trabalhoConclusao?: TrabalhoLegado;
	docente?: { nome?: string | null };
	curso?: unknown;
}

interface FiltrosOrientacoes {
	cursoSelecionado?: string | number;
	ano?: string | number;
	semestre?: string | number;
	fase?: string | number;
}

interface ConviteLegado {
	orientacao?: boolean;
	fase?: number | string;
	codigo_docente?: string;
	aceito?: boolean;
}

interface DefesaLegado {
	fase?: number | string;
	orientador?: boolean;
	avaliacao?: number | string | null;
	membro_banca?: string;
	data_defesa?: string | null;
}

interface OrientadorAtual {
	id?: number;
	codigo: string;
	nome: string;
}

interface MembrosBanca {
	membroBanca1: string;
	membroBanca2: string;
	dataHoraDefesa: Date | null;
}

interface DadosEdicao {
	orientador: string;
	tema: string;
	titulo: string;
	resumo: string;
	seminarioAndamento: string;
	etapa: number;
	membroBanca1: string;
	membroBanca2: string;
	dataHoraDefesa: Date | null;
}

interface AlteracaoBanca {
	membro_antigo: string;
	membro_novo: string;
}

interface DocenteBancaItem {
	docente?: {
		codigo?: string;
		nome?: string | null;
		externo?: boolean;
		instituicao?: string | null;
	};
}

/**
 * Obtém o ano e semestre atual
 */
export function getAnoSemestreAtual(): { ano: number; semestre: number } {
	const data = new Date();
	const anoAtual = data.getFullYear();
	const semestreAtual = data.getMonth() < 6 ? 1 : 2;
	return { ano: anoAtual, semestre: semestreAtual };
}

/**
 * Extrai cursos únicos das orientações
 */
export function extrairCursosUnicos(orientacoes: OrientacaoLegado[]): unknown[] {
	return orientacoes.map((orientacao) => orientacao.curso);
}

/**
 * Ordena dicentes por nome
 */
export function ordenarDicentesPorNome(dicentes: Dicente[]): Dicente[] {
	return [...dicentes].sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Filtra orientações por critérios
 */
export function filtrarOrientacoes(
	orientacoes: OrientacaoLegado[],
	{ cursoSelecionado, ano, semestre, fase }: FiltrosOrientacoes,
): OrientacaoLegado[] {
	return orientacoes.filter((o) => {
		const tcc = o.trabalhoConclusao;
		if (!tcc) return false;

		return (
			tcc.curso?.id === parseInt(String(cursoSelecionado)) &&
			tcc.ano === parseInt(String(ano)) &&
			tcc.semestre === parseInt(String(semestre)) &&
			(fase === "" || tcc.fase === parseInt(String(fase)))
		);
	});
}

/**
 * Extrai dicentes das orientações
 */
export function extrairDicentesDasOrientacoes(
	orientacoes: OrientacaoLegado[],
): DicenteLegado[] {
	return orientacoes
		.map((o) => o.trabalhoConclusao?.dicente)
		.filter((dicente): dicente is DicenteLegado => dicente !== null && dicente !== undefined);
}

/**
 * Cria mapa de trabalhos por matrícula (escolhendo o mais recente)
 */
export function criarMapaTrabalhoPorMatricula(
	trabalhos: TrabalhoLegado[],
): Record<string, TrabalhoLegado> {
	const mapa: Record<string, TrabalhoLegado> = {};
	for (const t of trabalhos) {
		const mat = t.dicente?.matricula || t.matricula;
		if (!mat) continue;
		const existente = mapa[mat];
		if (!existente || (t.id && existente.id && t.id > existente.id)) {
			mapa[mat] = t;
		}
	}
	return mapa;
}

/**
 * Extrai IDs únicos de TCCs
 */
export function extrairIdsTcc(trabalhos: TrabalhoLegado[]): number[] {
	return Array.from(
		new Set(trabalhos.map((t) => t.id).filter((id): id is number => Boolean(id))),
	);
}

/**
 * Cria mapa de convites por TCC
 */
export function criarMapaConvitesPorTcc(
	resultados: { id: number; convites: ConviteLegado[] }[],
): Record<number, ConviteLegado[]> {
	const mapaConvites: Record<number, ConviteLegado[]> = {};
	for (const { id, convites } of resultados) {
		mapaConvites[id] = convites;
	}
	return mapaConvites;
}

/**
 * Busca orientação atual por matrícula
 */
export function buscarOrientacaoAtual(
	orientacoes: OrientacaoLegado[],
	matricula: string,
	{ cursoSelecionado, ano, semestre, fase }: FiltrosOrientacoes,
): OrientacaoLegado | null {
	if (!cursoSelecionado || !ano || !semestre || !fase) return null;

	const orientacao = orientacoes.find((o) => {
		const tcc = o.trabalhoConclusao;
		const mat = tcc?.matricula;
		const cursoId = tcc?.curso?.id ?? tcc?.id_curso ?? tcc?.idCurso;
		const faseTcc = tcc?.fase != null ? parseInt(String(tcc.fase)) : undefined;
		const anoT = tcc?.ano;
		const semestreT = tcc?.semestre;
		const isOrientador = o.orientador === true;
		return (
			isOrientador &&
			mat === matricula &&
			anoT === parseInt(String(ano)) &&
			semestreT === parseInt(String(semestre)) &&
			cursoId === cursoSelecionado &&
			faseTcc === parseInt(String(fase))
		);
	});

	return orientacao || null;
}

/**
 * Obtém dados do orientador atual
 */
export function obterOrientadorAtual(
	orientacao: OrientacaoLegado | null | undefined,
): OrientadorAtual | null {
	if (!orientacao) return null;

	return {
		id: orientacao.id,
		codigo: orientacao.codigo_docente || orientacao.codigo || "",
		nome: orientacao.docente?.nome || "Orientador",
	};
}

/**
 * Obtém nome do orientador
 */
export function obterNomeOrientador(
	orientador: OrientadorAtual | null | undefined,
): string {
	return orientador?.nome || "Sem orientador";
}

/**
 * Gera lista de anos únicos das ofertas
 */
export function gerarAnosUnicos(ofertas: OfertaTcc[]): number[] {
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
export function gerarSemestresUnicos(ofertas: OfertaTcc[]): number[] {
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
export function gerarFasesUnicas(ofertas: OfertaTcc[]): string[] {
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
export function temConviteOrientacao(
	convites: ConviteLegado[] | null | undefined,
): boolean {
	return Array.isArray(convites)
		? convites.some((c) => c.orientacao === true)
		: false;
}

/**
 * Verifica se tem convite de banca na fase
 */
export function temConviteBancaNaFase(
	convites: ConviteLegado[] | null | undefined,
	faseAtualTcc: number | null | undefined,
	fase: string | number | undefined,
): boolean {
	const convitesBanca = Array.isArray(convites)
		? convites.filter((c) => c.orientacao === false)
		: [];

	return convitesBanca.some((c) =>
		faseAtualTcc == null
			? true
			: fase
				? parseInt(String(c.fase)) === faseAtualTcc
				: true,
	);
}

/**
 * Calcula média das notas de defesa
 */
export function calcularMediaDefesa(
	defesas: DefesaLegado[],
	fase: string | number | undefined,
): number | null {
	const notas = defesas
		.filter((d) => (fase ? parseInt(String(d.fase)) === fase : true))
		.map((d) => d.avaliacao)
		.filter((v): v is number | string => v !== null && v !== undefined);

	return notas.length > 0
		? notas.reduce<number>((a, b) => a + Number(b), 0) / notas.length
		: null;
}

/**
 * Filtra convites de orientação por fase
 */
export function filtrarConvitesOrientacao<T extends ConviteLegado>(
	convites: T[] | null | undefined,
	fase: string | number,
): T[] {
	return (convites || []).filter(
		(c) => c.orientacao === true && parseInt(String(c.fase)) === parseInt(String(fase)),
	);
}

/**
 * Filtra convites de banca por fase
 */
export function filtrarConvitesBanca<T extends ConviteLegado>(
	convites: T[] | null | undefined,
	fase: string | number,
): T[] {
	return (convites || []).filter(
		(c) => c.orientacao === false && parseInt(String(c.fase)) === parseInt(String(fase)),
	);
}

/**
 * Filtra defesas por fase
 */
export function filtrarDefesasPorFase(
	defesas: DefesaLegado[],
	fase: string | number,
): DefesaLegado[] {
	return defesas.filter(
		(defesa) =>
			parseInt(String(defesa.fase)) === parseInt(String(fase)) && !defesa.orientador,
	);
}

/**
 * Extrai membros da banca das defesas
 */
export function extrairMembrosBanca(defesas: DefesaLegado[]): MembrosBanca {
	const membros: MembrosBanca = {
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
	idTcc: number,
	fase: string | number,
	codigoDocente: string,
	mensagem: string,
	aceito = true,
) {
	const dataAtual = new Date().toISOString();

	return {
		id_tcc: idTcc,
		codigo_docente: codigoDocente,
		fase: parseInt(String(fase)),
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
export function prepararOrientacao(codigoDocente: string, idTcc: number) {
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
	idTcc: number,
	fase: string | number,
	membrosNovos: string[],
	membrosExistentes: string[],
	convites: ConviteLegado[],
	alteracoes: AlteracaoBanca[],
	orientadorCodigo: string,
	dataHoraDefesa: Date | string | null,
) {
	return {
		id_tcc: idTcc,
		fase: parseInt(String(fase)),
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
	idTcc: number,
	fase: string | number,
	data: string,
	hora: string,
	codigoOrientador: string,
	membrosBanca: string[],
) {
	return {
		id_tcc: idTcc,
		fase: parseInt(String(fase)),
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
	membrosNovos: string[],
	membrosExistentes: string[],
	convites: ConviteLegado[],
): AlteracaoBanca[] {
	const alteracoes: AlteracaoBanca[] = [];

	for (const membroExistente of membrosExistentes) {
		if (
			!membrosNovos.includes(membroExistente) &&
			membrosNovos.length > 0
		) {
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
export function validarSalvarComDataDefesa(
	dataHoraDefesa: Date | string | null | undefined,
	membroBanca1: string,
	membroBanca2: string,
): boolean {
	if (dataHoraDefesa) {
		return Boolean(membroBanca1 && membroBanca2);
	}
	return true;
}

/**
 * Prepara dados de edição para modal
 */
export function prepararDadosEdicao(
	tcc: TrabalhoLegado | null | undefined,
	orientador: OrientadorAtual | null | undefined,
	membrosBanca: MembrosBanca | null | undefined,
	isOrientadorView: boolean,
	usuarioCodigo: string | undefined,
): DadosEdicao {
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
export function obterEtapaMaxima(fase: string | number): number {
	return parseInt(String(fase)) === 2 ? 9 : 6;
}

/**
 * Verifica se edição da banca está habilitada
 */
export function isEdicaoBancaHabilitada(
	etapa: string | number,
	fase: string | number,
): boolean {
	const etapaNum = parseInt(String(etapa));
	const faseNum = parseInt(String(fase));
	return (
		(etapaNum === 5 && faseNum === 1) || (etapaNum === 8 && faseNum === 2)
	);
}

/**
 * Verifica se deve mostrar campos da banca
 */
export function deveMostrarCamposBanca(
	etapa: string | number,
	temHistoricoConvites: boolean,
	temHistoricoDefesas: boolean,
): boolean {
	const etapaNum = parseInt(String(etapa));
	return etapaNum >= 5 || temHistoricoConvites || temHistoricoDefesas;
}

/**
 * Obtém tipo de defesa baseado na etapa
 */
export function obterTipoDefesa(etapa: string | number): string {
	return parseInt(String(etapa)) === 8 ? "TCC" : "Projeto";
}

/**
 * Obtém mensagem de ajuda para banca
 */
export function obterMensagemAjudaBanca(
	etapa: string | number,
	fase: string | number,
	edicaoHabilitada: boolean,
): string {
	const tipoDefesa = obterTipoDefesa(etapa);

	if (edicaoHabilitada) {
		return `Selecione 2 docentes para compor a banca de defesa de ${tipoDefesa.toLowerCase()} (além do orientador) e defina a data/hora da defesa`;
	}

	return `Visualização do histórico da banca de defesa de ${tipoDefesa.toLowerCase()}. Campos de seleção disponíveis apenas na etapa ${parseInt(String(fase)) === 1 ? "5" : "8"}.`;
}

/**
 * Obtém helper text para data de defesa
 */
export function obterHelperTextDataDefesa(
	edicaoHabilitada: boolean,
	fase: string | number,
	dataHoraDefesa: Date | string | null | undefined,
	membroBanca1: string,
	membroBanca2: string,
): string {
	if (!edicaoHabilitada) {
		return `Edição disponível apenas na etapa ${parseInt(String(fase)) === 1 ? "5" : "8"}`;
	}

	if (dataHoraDefesa && (!membroBanca1 || !membroBanca2)) {
		return "⚠️ Selecione os 2 membros da banca para definir a data da defesa";
	}

	return "Selecione a data e horário para a defesa";
}

/**
 * Valida se arquivo é PDF
 */
export function validarArquivoPdf(file: File | null | undefined): boolean {
	return Boolean(file && file.type === "application/pdf");
}

/**
 * Valida campos obrigatórios para upload
 */
export function validarCamposUpload(
	ano: string | number,
	semestre: string | number,
	fase: string | number,
	curso: unknown,
): boolean {
	return !!(ano && semestre && fase && curso);
}

/**
 * Formata tamanho de arquivo
 */
export function formatarTamanhoArquivo(bytes: number): string {
	return (bytes / 1024 / 1024).toFixed(2);
}

/**
 * Obtém cor do chip de status de upload
 */
export function obterCorStatusUpload(status: string): string {
	const statusMap: Record<string, string> = {
		dicente_e_orientacao_inseridos: "success",
		dicente_e_orientacao_inseridos_com_usuario: "success",
		dicente_e_tcc_inseridos_com_usuario: "success",
		dicente_inserido_com_usuario: "success",
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
export function obterLabelStatusUpload(status: string): string {
	const labelMap: Record<string, string> = {
		dicente_e_orientacao_inseridos: "Novo dicente + orientação",
		dicente_e_orientacao_inseridos_com_usuario:
			"Novo dicente + usuário + orientação",
		dicente_e_tcc_inseridos_com_usuario: "Novo dicente + usuário + TCC",
		dicente_inserido_com_usuario: "Novo dicente + usuário criado",
		orientacao_inserida: "Orientação criada",
		dicente_inserido_orientacao_ja_existe:
			"Novo dicente (orientação já existe)",
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
	docentesBanca: DocenteBancaItem[],
	orientadorCodigo: string | undefined,
	outroMembroCodigo: string | undefined,
): DocenteBancaItem[] {
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
