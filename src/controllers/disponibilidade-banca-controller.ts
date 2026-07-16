import type { GradeDisponibilidade } from "../types/defesa";

interface DefesaLegado {
	membro_banca: string;
	data_defesa?: string | null;
	fase?: number | string;
	trabalhoConclusao?: { dicente?: { nome?: string } };
}

interface OrientacaoComCurso {
	curso?: unknown;
}

type Bloqueio = { tipo: "banca" | "indisp"; nomeDiscente: string | null };
type MapaBloqueios = Map<string, Bloqueio>;
type MapaDisponibilidades = Record<string, boolean>;

interface CelulaGrid {
	data: string;
	hora: string;
	disponivel: boolean;
}

interface RowDataGrid {
	id: number;
	horario: string;
	[key: `data_${string}`]: CelulaGrid;
}

interface DisponibilidadeParaEnvio {
	ano: number;
	semestre: number;
	id_curso: number;
	fase: number;
	codigo_docente: string;
	data_defesa: string;
	hora_defesa: string;
	disponivel: boolean;
}

interface DisponibilidadeComFlag {
	data_defesa: string;
	hora_defesa: string;
	disponivel: boolean;
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

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY
 */
export function formatarData(data: string): string {
	const [ano, mes, dia] = data.split("-");
	return `${dia}/${mes}/${ano}`;
}

/**
 * Retorna o nome abreviado do dia da semana para uma data YYYY-MM-DD
 */
export function formatarDiaSemana(data: string): string {
	const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
	const [ano, mes, dia] = data.split("-").map(Number);
	const dt = new Date(ano ?? 0, (mes ?? 1) - 1, dia ?? 1);
	return dias[dt.getDay()] ?? "";
}

/**
 * Formata hora removendo os segundos
 */
export function formatarHora(hora: string): string {
	return hora.substring(0, 5);
}

/**
 * Extrai cursos das orientações
 */
export function extrairCursos(orientacoes: OrientacaoComCurso[]): unknown[] {
	return orientacoes.map((orientacao) => orientacao.curso);
}

/**
 * Converte ISO date para chave de data/hora
 */
export function toDateKey(iso: string): { data: string; hora: string } {
	const toTwo = (n: number) => String(n).padStart(2, "0");
	const dt = new Date(iso);
	// Usar métodos UTC para coincidir com o armazenamento em UTC no backend
	const y = dt.getUTCFullYear();
	const m = toTwo(dt.getUTCMonth() + 1);
	const d = toTwo(dt.getUTCDate());
	const hh = toTwo(dt.getUTCHours());
	const mm = toTwo(dt.getUTCMinutes());
	const ss = toTwo(dt.getUTCSeconds());
	return {
		data: `${y}-${m}-${d}`,
		hora: `${hh}:${mm}:${ss}`,
	};
}

/**
 * Formata ISO date armazenado como UTC-wall-clock para exibição em pt-BR.
 * Usa getters UTC para evitar conversão de fuso horário no navegador.
 */
export function formatarDataDefesaUTC(
	iso: string | null | undefined,
): { dataStr: string; horaStr: string } {
	if (!iso) return { dataStr: "N/A", horaStr: "N/A" };
	const toTwo = (n: number) => String(n).padStart(2, "0");
	const dt = new Date(iso);
	const dia = toTwo(dt.getUTCDate());
	const mes = toTwo(dt.getUTCMonth() + 1);
	const ano = dt.getUTCFullYear();
	const hh = toTwo(dt.getUTCHours());
	const mm = toTwo(dt.getUTCMinutes());
	return {
		dataStr: `${dia}/${mes}/${ano}`,
		horaStr: `${hh}:${mm}`,
	};
}

/**
 * Adiciona minutos a um horário
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
	const toTwo = (n: number) => String(n).padStart(2, "0");
	const [hh, mm, ss] = timeStr.split(":").map((v) => parseInt(v, 10));
	const base = new Date(2000, 0, 1, hh ?? 0, mm ?? 0, ss || 0);
	base.setMinutes(base.getMinutes() + minutesToAdd);
	const h2 = toTwo(base.getHours());
	const m2 = toTwo(base.getMinutes());
	const s2 = toTwo(base.getSeconds());
	return `${h2}:${m2}:${s2}`;
}

/**
 * Processa defesas e cria mapa de bloqueios
 */
export function processarDefesasParaBloqueios(
	defesas: DefesaLegado[],
	codigoDocente: string,
): MapaBloqueios {
	const novosBloqueados: MapaBloqueios = new Map();

	defesas.forEach((def) => {
		if (
			String(def.membro_banca) === String(codigoDocente) &&
			def.data_defesa
		) {
			const { data, hora } = toDateKey(def.data_defesa);
			const keyAtual = `${data}-${hora}`;
			const keySeguinte = `${data}-${addMinutesToTime(hora, 30)}`;
			const keyAnterior = `${data}-${addMinutesToTime(hora, -30)}`;

			const nomeDiscente =
				def.trabalhoConclusao?.dicente?.nome || null;

			// Horário exato e seguinte (+30min): exibem o nome (slot de 1 hora)
			novosBloqueados.set(keyAtual, { tipo: "banca", nomeDiscente });
			novosBloqueados.set(keySeguinte, { tipo: "banca", nomeDiscente });
			// Horário anterior (-30min): apenas bloqueado, sem nome
			novosBloqueados.set(keyAnterior, { tipo: "indisp", nomeDiscente: null });
		}
	});

	return novosBloqueados;
}

/**
 * Converte disponibilidades do backend para formato de mapa
 */
export function converterDisponibilidadesParaMapa(
	disponibilidades: DisponibilidadeComFlag[],
): MapaDisponibilidades {
	const disponibilidadesMap: MapaDisponibilidades = {};
	disponibilidades.forEach((disp) => {
		const key = `${disp.data_defesa}-${disp.hora_defesa}`;
		disponibilidadesMap[key] = disp.disponivel;
	});
	return disponibilidadesMap;
}

/**
 * Inicializa todas as disponibilidades da grade
 */
export function inicializarTodasDisponibilidades(
	horarios: string[],
	datas: string[],
	disponibilidadesMap: MapaDisponibilidades,
): MapaDisponibilidades {
	const todasDisponibilidades: MapaDisponibilidades = {};
	horarios.forEach((hora) => {
		datas.forEach((data) => {
			const key = `${data}-${hora}`;
			// Se já existe no banco, usa o valor; senão, assume false
			todasDisponibilidades[key] = disponibilidadesMap[key] || false;
		});
	});
	return todasDisponibilidades;
}

/**
 * Filtra disponibilidades bloqueadas
 */
export function filtrarDisponibilidadesBloqueadas(
	disponibilidades: DisponibilidadeComFlag[],
	bloqueados: MapaBloqueios,
): DisponibilidadeComFlag[] {
	return disponibilidades.filter((d) =>
		bloqueados.has(`${d.data_defesa}-${d.hora_defesa}`),
	);
}

/**
 * Gera linhas para o DataGrid
 */
export function gerarRowsDataGrid(
	grade: GradeDisponibilidade | null | undefined,
	disponibilidades: MapaDisponibilidades,
	bloqueados: MapaBloqueios,
): RowDataGrid[] {
	if (!grade || !grade.horarios || !grade.datas) {
		return [];
	}

	return grade.horarios.map((hora, index) => {
		const row: RowDataGrid = {
			id: index,
			horario: formatarHora(hora),
			...grade.datas.reduce<Record<string, CelulaGrid>>((acc, data) => {
				const key = `${data}-${hora}`;
				const isBlocked =
					bloqueados instanceof Map && bloqueados.has(key);
				acc[`data_${data}`] = {
					data: data,
					hora: hora,
					disponivel: isBlocked
						? false
						: disponibilidades[key] || false,
				};
				return acc;
			}, {}),
		};
		return row;
	});
}

/**
 * Verifica se um slot está bloqueado
 */
export function isSlotBloqueado(
	bloqueados: MapaBloqueios | null | undefined,
	key: string,
): boolean {
	if (!bloqueados) return false;
	if (typeof bloqueados.has === "function") return bloqueados.has(key);
	return false;
}

/**
 * Obtém tipo de bloqueio
 */
export function tipoBloqueio(
	bloqueados: MapaBloqueios | null | undefined,
	key: string,
): Bloqueio | undefined {
	if (bloqueados instanceof Map) return bloqueados.get(key);
	return undefined;
}

/**
 * Calcula número de alterações entre disponibilidades atuais e originais
 */
export function calcularNumeroAlteracoes(
	disponibilidades: MapaDisponibilidades,
	disponibilidadesOriginais: MapaDisponibilidades,
): number {
	let alteracoes = 0;

	// Verificar alterações nas disponibilidades
	Object.keys(disponibilidades).forEach((key) => {
		const valorAtual = disponibilidades[key];
		const valorOriginal = disponibilidadesOriginais[key];

		if (valorAtual !== valorOriginal) {
			alteracoes++;
		}
	});

	// Verificar se há chaves no original que não estão no atual
	Object.keys(disponibilidadesOriginais).forEach((key) => {
		if (!(key in disponibilidades)) {
			alteracoes++;
		}
	});

	return alteracoes;
}

/**
 * Verifica se todos os horários de uma data estão selecionados
 */
export function isDataCompleta(
	data: string,
	grade: GradeDisponibilidade | null | undefined,
	disponibilidades: MapaDisponibilidades,
	bloqueados: MapaBloqueios | null | undefined,
): boolean {
	if (!grade || !grade.horarios) return false;

	const todosHorarios = grade.horarios.map((hora) => `${data}-${hora}`);
	const elegiveis = todosHorarios.filter(
		(k) => !isSlotBloqueado(bloqueados, k),
	);
	const horariosSelecionados = elegiveis.filter(
		(key) => disponibilidades[key],
	);

	return (
		horariosSelecionados.length === elegiveis.length && elegiveis.length > 0
	);
}

/**
 * Verifica se alguns (mas não todos) horários de uma data estão selecionados
 */
export function isDataParcial(
	data: string,
	grade: GradeDisponibilidade | null | undefined,
	disponibilidades: MapaDisponibilidades,
	bloqueados: MapaBloqueios | null | undefined,
): boolean {
	if (!grade || !grade.horarios) return false;

	const todosHorarios = grade.horarios.map((hora) => `${data}-${hora}`);
	const elegiveis = todosHorarios.filter(
		(k) => !isSlotBloqueado(bloqueados, k),
	);
	const horariosSelecionados = elegiveis.filter(
		(key) => disponibilidades[key],
	);

	return (
		horariosSelecionados.length > 0 &&
		horariosSelecionados.length < elegiveis.length
	);
}

/**
 * Alterna seleção de todos os horários de uma data
 */
export function alternarSelecaoData(
	data: string,
	grade: GradeDisponibilidade | null | undefined,
	disponibilidades: MapaDisponibilidades,
	bloqueados: MapaBloqueios | null | undefined,
): MapaDisponibilidades {
	if (!grade) return disponibilidades;

	const todosHorarios = grade.horarios.map((hora) => `${data}-${hora}`);
	const horariosSelecionados = todosHorarios
		.filter((key) => !isSlotBloqueado(bloqueados, key))
		.filter((key) => disponibilidades[key]);

	const todosSelecionados =
		horariosSelecionados.length ===
		todosHorarios.filter((k) => !isSlotBloqueado(bloqueados, k)).length;
	const novoValor = !todosSelecionados;

	const novasDisponibilidades = { ...disponibilidades };
	todosHorarios.forEach((key) => {
		if (!isSlotBloqueado(bloqueados, key)) {
			novasDisponibilidades[key] = novoValor;
		}
	});

	return novasDisponibilidades;
}

/**
 * Prepara disponibilidades para envio à API
 */
export function prepararDisponibilidadesParaEnvio(
	grade: GradeDisponibilidade | null | undefined,
	disponibilidades: MapaDisponibilidades,
	bloqueados: MapaBloqueios | null | undefined,
	ano: string | number,
	semestre: string | number,
	cursoSelecionado: string | number,
	fase: string | number,
	codigoDocente: string,
): DisponibilidadeParaEnvio[] {
	const disponibilidadesParaEnviar: DisponibilidadeParaEnvio[] = [];

	if (grade && grade.horarios && grade.datas) {
		grade.horarios.forEach((hora) => {
			grade.datas.forEach((data) => {
				const key = `${data}-${hora}`;
				const disponivel = isSlotBloqueado(bloqueados, key)
					? false
					: Boolean(disponibilidades[key]);

				disponibilidadesParaEnviar.push({
					ano: parseInt(String(ano)),
					semestre: parseInt(String(semestre)),
					id_curso: parseInt(String(cursoSelecionado)),
					fase: parseInt(String(fase)),
					codigo_docente: codigoDocente,
					data_defesa: data,
					hora_defesa: hora,
					disponivel: disponivel,
				});
			});
		});
	}

	return disponibilidadesParaEnviar;
}

// Exportação padrão
const disponibilidadeBancaController = {
	getAnoSemestreAtual,
	formatarData,
	formatarDiaSemana,
	formatarHora,
	extrairCursos,
	toDateKey,
	addMinutesToTime,
	processarDefesasParaBloqueios,
	converterDisponibilidadesParaMapa,
	inicializarTodasDisponibilidades,
	filtrarDisponibilidadesBloqueadas,
	gerarRowsDataGrid,
	isSlotBloqueado,
	tipoBloqueio,
	calcularNumeroAlteracoes,
	isDataCompleta,
	isDataParcial,
	alternarSelecaoData,
	prepararDisponibilidadesParaEnvio,
};

export default disponibilidadeBancaController;
