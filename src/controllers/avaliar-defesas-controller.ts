import { formatarDataDefesaUTC } from "./disponibilidade-banca-controller";

interface CursoLegado {
	id?: number;
	nome?: string | null;
}

interface DicenteLegado {
	nome?: string | null;
	matricula?: string;
}

interface TrabalhoLegado {
	id: number;
	ano?: number;
	semestre?: number;
	id_curso?: number;
	titulo?: string | null;
	fase?: number;
	comentarios_tcc?: string | null;
	aprovado_tcc?: boolean;
	curso?: CursoLegado;
	dicente?: DicenteLegado;
}

interface OrientacaoLegado {
	id_tcc?: number;
	trabalhoConclusao?: TrabalhoLegado;
}

interface MembroBancaLegado {
	nome?: string | null;
	externo?: boolean;
	instituicao?: string | null;
}

interface DefesaLegado {
	id_tcc: number;
	membro_banca: string;
	fase: number | string;
	data_defesa?: string | null;
	avaliacao?: number | null;
	orientador?: boolean;
	membroBanca?: MembroBancaLegado;
	trabalhoConclusao?: TrabalhoLegado;
}

interface MembroBancaProcessado {
	chave: string;
	idTcc: number;
	membroBanca: string;
	nomeMembroBanca: string;
	valorAvaliacao: string;
	ehOrientador: boolean;
	ehExterno: boolean;
	instituicao: string | null;
	salvo: boolean;
}

interface CardDefesa {
	idTcc: number;
	chaveUnica: string;
	nomeDicente: string;
	matriculaDicente: string;
	tituloTcc: string;
	nomeCurso: string;
	fase: number | string | undefined;
	media: number | null;
	avaliacoesCompletas: boolean;
	aprovadoAutomatico: boolean;
	notas: number[];
	dataDefesa: string;
	membros: MembroBancaProcessado[];
}

type AvaliacoesEdicao = Record<string, string>;
type ComentariosTcc = Record<number, string>;

export interface JanelaPeriodoDefesa {
	ano: number | string;
	semestre: number | string;
	inicio?: string | Date | null;
	fim?: string | Date | null;
	fase?: number | string;
	id_curso?: number | string;
}

/**
 * Obtém o ano e semestre atual
 */
export function getAnoSemestreAtual(): { ano: number; semestre: number } {
	const data = new Date();
	const ano = data.getFullYear();
	const semestre = data.getMonth() < 6 ? 1 : 2;
	return { ano, semestre };
}

function filtroEstaAtivo(valor: string | number | null | undefined): boolean {
	return valor !== "" && valor !== null && valor !== undefined;
}

function toDateOnly(valor: string | Date | null | undefined): string | null {
	if (!valor) return null;
	if (typeof valor === "string") {
		const ymd = valor.match(/^(\d{4}-\d{2}-\d{2})/);
		if (ymd?.[1]) return ymd[1];
		const dt = new Date(valor);
		if (Number.isNaN(dt.getTime())) return null;
		const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
		const d = String(dt.getUTCDate()).padStart(2, "0");
		return `${dt.getUTCFullYear()}-${m}-${d}`;
	}
	const dt = new Date(valor);
	if (Number.isNaN(dt.getTime())) return null;
	const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
	const d = String(dt.getUTCDate()).padStart(2, "0");
	return `${dt.getUTCFullYear()}-${m}-${d}`;
}

function dataEstaNoIntervalo(
	data: string,
	inicio: string | Date | null | undefined,
	fim: string | Date | null | undefined,
): boolean {
	const d = toDateOnly(data);
	const i = toDateOnly(inicio);
	const f = toDateOnly(fim);
	if (!d || !i || !f) return false;
	return d >= i && d <= f;
}

/**
 * Ano/semestre da defesa pela janela cadastrada em datas de defesa
 * (ou no calendário acadêmico). Julho permanece no 1º semestre quando
 * a janela assim o define.
 */
export function obterPeriodoPelaJanela(
	dataDefesa: string | null | undefined,
	fase: number | string,
	janelas: JanelaPeriodoDefesa[],
	cursoId?: number,
): { ano: number; semestre: number } | null {
	const data = toDateOnly(dataDefesa);
	if (!data || janelas.length === 0) return null;

	const doCurso = janelas.filter(
		(j) =>
			j.id_curso == null ||
			cursoId == null ||
			Number(j.id_curso) === Number(cursoId),
	);
	const daFase = doCurso.filter(
		(j) => j.fase != null && Number(j.fase) === Number(fase),
	);
	const semFase = doCurso.filter((j) => j.fase == null);

	for (const lista of [daFase, semFase]) {
		const match = lista.find((j) => dataEstaNoIntervalo(data, j.inicio, j.fim));
		if (match) {
			return { ano: Number(match.ano), semestre: Number(match.semestre) };
		}
	}
	return null;
}

/**
 * Período da defesa: janela de datas de defesa (ou calendário), senão o TCC.
 */
export function obterPeriodoDefesa(
	defesa: DefesaLegado,
	tcc?: TrabalhoLegado,
	janelas: JanelaPeriodoDefesa[] = [],
): { ano: number; semestre: number } | null {
	const cursoId = defesa.trabalhoConclusao?.curso?.id
		?? defesa.trabalhoConclusao?.id_curso
		?? tcc?.curso?.id
		?? tcc?.id_curso;

	const daJanela = obterPeriodoPelaJanela(
		defesa.data_defesa,
		defesa.fase,
		janelas,
		cursoId,
	);
	if (daJanela) return daJanela;

	const origem = defesa.trabalhoConclusao ?? tcc;
	if (origem?.ano != null && origem?.semestre != null) {
		return { ano: Number(origem.ano), semestre: Number(origem.semestre) };
	}
	return null;
}

function defesaAtendePeriodo(
	defesa: DefesaLegado,
	ano: string | number,
	semestre: string | number,
	tcc?: TrabalhoLegado,
	janelas: JanelaPeriodoDefesa[] = [],
): boolean {
	const periodo = obterPeriodoDefesa(defesa, tcc, janelas);
	if (!periodo) {
		return !filtroEstaAtivo(ano) && !filtroEstaAtivo(semestre);
	}
	if (filtroEstaAtivo(ano) && Number(periodo.ano) !== Number(ano)) {
		return false;
	}
	if (
		filtroEstaAtivo(semestre) &&
		Number(periodo.semestre) !== Number(semestre)
	) {
		return false;
	}
	return true;
}

/**
 * Filtra orientações do curso selecionado.
 * Não restringe por ano/semestre do TCC: a defesa pode ser de um semestre
 * anterior ao período atual do trabalho (ex.: projeto em 2026/1 e TCC em 2026/2).
 */
export function filtrarOrientacoes(
	orientacoes: OrientacaoLegado[],
	cursoSelecionado: string | number,
): TrabalhoLegado[] {
	return orientacoes
		.filter((o) => {
			const tcc = o.trabalhoConclusao;
			if (!tcc) return false;
			if (!filtroEstaAtivo(cursoSelecionado)) return true;
			const cursoId = tcc.curso?.id ?? tcc.id_curso;
			return Number(cursoId) === Number(cursoSelecionado);
		})
		.map((o) => o.trabalhoConclusao as TrabalhoLegado);
}

/**
 * Filtra defesas por TCCs do orientador, fase e período (curso/ano/semestre da tela).
 */
export function filtrarDefesas(
	defesas: DefesaLegado[],
	idsTcc: Set<number>,
	fase: string | number,
	ano: string | number = "",
	semestre: string | number = "",
	mapaTcc?: Map<number, TrabalhoLegado>,
	janelas: JanelaPeriodoDefesa[] = [],
): DefesaLegado[] {
	return defesas
		.filter((d) => idsTcc.has(d.id_tcc))
		.filter(
			(d) =>
				!filtroEstaAtivo(fase) || Number(d.fase) === Number(fase),
		)
		.filter((d) =>
			defesaAtendePeriodo(
				d,
				ano,
				semestre,
				mapaTcc?.get(d.id_tcc),
				janelas,
			),
		);
}

/**
 * Cria mapa de TCCs para acesso rápido
 */
export function criarMapaTcc(
	orientacoes: TrabalhoLegado[],
): Map<number, TrabalhoLegado> {
	const map = new Map<number, TrabalhoLegado>();
	orientacoes.forEach((t) => map.set(t.id, t));
	return map;
}

/**
 * Inicializa estados de avaliações a partir das defesas
 */
export function inicializarAvaliacoesEdicao(
	defesas: DefesaLegado[],
): AvaliacoesEdicao {
	const novoAvals: AvaliacoesEdicao = {};
	defesas.forEach((d) => {
		novoAvals[`${d.id_tcc}|${d.membro_banca}|${d.fase}`] =
			d.avaliacao !== null && d.avaliacao !== undefined
				? String(d.avaliacao)
				: "";
	});
	return novoAvals;
}

/**
 * Inicializa parecer (comentarios_tcc) para todas as fases
 */
export function inicializarComentariosTcc(
	orientacoes: TrabalhoLegado[],
): ComentariosTcc {
	const novoComentarios: ComentariosTcc = {};
	orientacoes.forEach((tcc) => {
		novoComentarios[tcc.id] = tcc.comentarios_tcc || "";
	});
	return novoComentarios;
}

/**
 * Calcula média das notas
 */
export function calcularMedia(notas: number[]): number | null {
	if (notas.length === 0) return null;
	return notas.reduce((s, n) => s + n, 0) / notas.length;
}

/**
 * Extrai notas válidas das avaliações
 */
export function extrairNotas(
	defesasTcc: DefesaLegado[],
	avaliacoesEdicao: AvaliacoesEdicao,
): number[] {
	return defesasTcc
		.map((d) => {
			const key = `${d.id_tcc}|${d.membro_banca}|${d.fase}`;
			const v = avaliacoesEdicao[key];
			const num =
				v === "" || v === undefined || v === null ? null : Number(v);
			return num !== null && Number.isFinite(num) ? num : null;
		})
		.filter((n): n is number => n !== null);
}

/**
 * Verifica se todas as avaliações estão completas
 */
export function verificarAvaliacoesCompletas(
	notas: number[],
	totalDefesas: number,
): boolean {
	return notas.length === totalDefesas && totalDefesas > 0;
}

/**
 * Verifica se está aprovado automaticamente (fase 1 com média >= 6)
 */
export function verificarAprovadoAutomatico(
	avaliacoesCompletas: boolean,
	media: number | null,
	fase: string | number,
): boolean {
	return (
		avaliacoesCompletas &&
		media !== null &&
		media >= 6 &&
		parseInt(String(fase)) === 1
	);
}

/**
 * Formata data de defesa
 */
export function formatarDataDefesa(dataDefesa: string | null | undefined): string {
	if (!dataDefesa) return "N/A";
	const { dataStr, horaStr } = formatarDataDefesaUTC(dataDefesa);
	return `${dataStr} ${horaStr}`;
}

/**
 * Processa membros da banca para exibição
 */
export function processarMembrosBanca(
	defesasTcc: DefesaLegado[],
	avaliacoesEdicao: AvaliacoesEdicao,
): MembroBancaProcessado[] {
	return defesasTcc
		.map((d) => {
			const chave = `${d.id_tcc}|${d.membro_banca}|${d.fase}`;
			return {
				chave,
				idTcc: d.id_tcc,
				membroBanca: d.membro_banca,
				nomeMembroBanca: d.membroBanca?.nome || d.membro_banca,
				valorAvaliacao: avaliacoesEdicao[chave] ?? "",
				ehOrientador: d.orientador || false,
				ehExterno: d.membroBanca?.externo || false,
				instituicao: d.membroBanca?.instituicao || null,
				salvo: d.avaliacao !== null && d.avaliacao !== undefined,
			};
		})
		.sort((a, b) => {
			if (a.ehOrientador !== b.ehOrientador) {
				return a.ehOrientador ? -1 : 1;
			}
			return (a.nomeMembroBanca || "").localeCompare(
				b.nomeMembroBanca || "",
			);
		});
}

/**
 * Gera dados para cards quando "Todas" as fases estão selecionadas
 */
export function gerarCardsTodasFases(
	defesas: DefesaLegado[],
	mapaTcc: Map<number, TrabalhoLegado>,
	avaliacoesEdicao: AvaliacoesEdicao,
): CardDefesa[] {
	const resultado: CardDefesa[] = [];
	const defesasPorTccEFase = new Map<string, DefesaLegado[]>();

	defesas.forEach((defesa) => {
		const chave = `${defesa.id_tcc}_${defesa.fase}`;
		if (!defesasPorTccEFase.has(chave)) {
			defesasPorTccEFase.set(chave, []);
		}
		defesasPorTccEFase.get(chave)?.push(defesa);
	});

	defesasPorTccEFase.forEach((defesasTccFase, chave) => {
		const [idTccStr, faseAtual] = chave.split("_");
		const tcc = mapaTcc.get(parseInt(idTccStr ?? ""));
		if (!tcc) return;

		const notas = extrairNotas(defesasTccFase, avaliacoesEdicao);
		const media = calcularMedia(notas);
		const avaliacoesCompletas = verificarAvaliacoesCompletas(
			notas,
			defesasTccFase.length,
		);
		const aprovadoAutomatico = verificarAprovadoAutomatico(
			avaliacoesCompletas,
			media,
			faseAtual ?? "",
		);

		const membros = processarMembrosBanca(defesasTccFase, avaliacoesEdicao);

		resultado.push({
			idTcc: parseInt(idTccStr ?? ""),
			chaveUnica: chave,
			nomeDicente: tcc.dicente?.nome || "N/A",
			matriculaDicente: tcc.dicente?.matricula || "N/A",
			tituloTcc: tcc.titulo || "N/A",
			nomeCurso: tcc.curso?.nome || "N/A",
			fase: parseInt(faseAtual ?? ""),
			media,
			avaliacoesCompletas,
			aprovadoAutomatico,
			notas,
			dataDefesa: formatarDataDefesa(defesasTccFase[0]?.data_defesa),
			membros,
		});
	});

	return resultado;
}

/**
 * Gera dados para cards quando uma fase específica está selecionada
 */
export function gerarCardsFaseEspecifica(
	defesas: DefesaLegado[],
	mapaTcc: Map<number, TrabalhoLegado>,
	avaliacoesEdicao: AvaliacoesEdicao,
	_fase: string | number,
): CardDefesa[] {
	const resultado: CardDefesa[] = [];
	const defesasPorTcc = new Map<number, DefesaLegado[]>();

	defesas.forEach((defesa) => {
		if (!defesasPorTcc.has(defesa.id_tcc)) {
			defesasPorTcc.set(defesa.id_tcc, []);
		}
		defesasPorTcc.get(defesa.id_tcc)?.push(defesa);
	});

	defesasPorTcc.forEach((defesasTcc, idTcc) => {
		const tcc = mapaTcc.get(idTcc);
		if (!tcc) return;

		const notas = extrairNotas(defesasTcc, avaliacoesEdicao);
		const media = calcularMedia(notas);
		const avaliacoesCompletas = verificarAvaliacoesCompletas(
			notas,
			defesasTcc.length,
		);
		const aprovadoAutomatico = verificarAprovadoAutomatico(
			avaliacoesCompletas,
			media,
			defesasTcc[0]?.fase ?? "",
		);

		const membros = processarMembrosBanca(defesasTcc, avaliacoesEdicao);

		resultado.push({
			idTcc,
			chaveUnica: `${idTcc}`,
			nomeDicente: tcc.dicente?.nome || "N/A",
			matriculaDicente: tcc.dicente?.matricula || "N/A",
			tituloTcc: tcc.titulo || "N/A",
			nomeCurso: tcc.curso?.nome || "N/A",
			fase: defesasTcc[0]?.fase,
			media,
			avaliacoesCompletas,
			aprovadoAutomatico,
			notas,
			dataDefesa: formatarDataDefesa(defesasTcc[0]?.data_defesa),
			membros,
		});
	});

	return resultado;
}

/**
 * Ordena cards por nome do dicente e depois por fase
 */
export function ordenarCards(cards: CardDefesa[]): CardDefesa[] {
	return cards.sort((a, b) => {
		const nomeComparison = (a.nomeDicente || "").localeCompare(
			b.nomeDicente || "",
		);
		if (nomeComparison !== 0) return nomeComparison;
		return Number(a.fase || 0) - Number(b.fase || 0);
	});
}

/**
 * Extrai ID do TCC da chave única
 */
export function extrairIdTcc(chaveUnica: string): string {
	return chaveUnica.includes("_") ? (chaveUnica.split("_")[0] ?? "") : chaveUnica;
}

/**
 * Extrai fase da chave única (se existir)
 */
export function extrairFase(chaveUnica: string): string | null {
	return chaveUnica.includes("_") ? (chaveUnica.split("_")[1] ?? null) : null;
}

/**
 * Cria snapshot de avaliações para backup
 */
export function criarSnapshotAvaliacoes(
	avaliacoesEdicao: AvaliacoesEdicao,
	prefix: string,
	fase: string | number | null | undefined,
	faseCard: string | undefined,
): AvaliacoesEdicao {
	const snapshot: AvaliacoesEdicao = {};
	Object.entries(avaliacoesEdicao).forEach(([k, v]) => {
		if (k.startsWith(prefix)) {
			if (fase === "" || fase === null || fase === undefined) {
				const [, , faseKey] = k.split("|");
				if (faseCard && faseKey === faseCard) {
					snapshot[k] = v;
				}
			} else {
				snapshot[k] = v;
			}
		}
	});
	return snapshot;
}

/**
 * Verifica se há notas registradas para um TCC
 */
export function temNotasRegistradas(
	avaliacoesEdicao: AvaliacoesEdicao,
	prefix: string,
	fase: string | number | null | undefined,
	faseCard: string | undefined,
): boolean {
	return Object.keys(avaliacoesEdicao).some((k) => {
		if (k.startsWith(prefix)) {
			if (fase === "" || fase === null || fase === undefined) {
				const [, , faseKey] = k.split("|");
				return Boolean(faseCard) && faseKey === faseCard;
			}
			return true;
		}
		return false;
	});
}

/**
 * Restaura avaliações do backup
 */
export function restaurarAvaliacoes(
	avaliacoesEdicao: AvaliacoesEdicao,
	snapshot: AvaliacoesEdicao,
	prefix: string,
	fase: string | number | null | undefined,
	faseCard: string | undefined,
): AvaliacoesEdicao {
	const novo = { ...avaliacoesEdicao };
	Object.keys(novo).forEach((k) => {
		if (k.startsWith(prefix)) {
			if (fase === "" || fase === null || fase === undefined) {
				const [, , faseKey] = k.split("|");
				if (
					faseCard &&
					faseKey === faseCard &&
					Object.prototype.hasOwnProperty.call(snapshot, k)
				) {
					novo[k] = snapshot[k] as string;
				}
			} else if (Object.prototype.hasOwnProperty.call(snapshot, k)) {
				novo[k] = snapshot[k] as string;
			}
		}
	});
	return novo;
}

/**
 * Limpa avaliações de um TCC
 */
export function limparAvaliacoes(
	avaliacoesEdicao: AvaliacoesEdicao,
	prefix: string,
	fase: string | number | null | undefined,
	faseCard: string | undefined,
): AvaliacoesEdicao {
	const novo = { ...avaliacoesEdicao };
	Object.keys(novo).forEach((k) => {
		if (k.startsWith(prefix)) {
			if (fase === "" || fase === null || fase === undefined) {
				const [, , faseKey] = k.split("|");
				if (faseCard && faseKey === faseCard) {
					novo[k] = "";
				}
			} else {
				novo[k] = "";
			}
		}
	});
	return novo;
}

// Exportação padrão
const avaliarDefesasController = {
	getAnoSemestreAtual,
	obterPeriodoPelaJanela,
	obterPeriodoDefesa,
	filtrarOrientacoes,
	filtrarDefesas,
	criarMapaTcc,
	inicializarAvaliacoesEdicao,
	inicializarComentariosTcc,
	calcularMedia,
	extrairNotas,
	verificarAvaliacoesCompletas,
	verificarAprovadoAutomatico,
	formatarDataDefesa,
	processarMembrosBanca,
	gerarCardsTodasFases,
	gerarCardsFaseEspecifica,
	ordenarCards,
	extrairIdTcc,
	extrairFase,
	criarSnapshotAvaliacoes,
	temNotasRegistradas,
	restaurarAvaliacoes,
	limparAvaliacoes,
};

export default avaliarDefesasController;
