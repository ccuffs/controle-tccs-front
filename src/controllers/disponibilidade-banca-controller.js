/**
 * Obtém o ano e semestre atual
 */
export function getAnoSemestreAtual() {
	const data = new Date();
	const ano = data.getFullYear();
	const semestre = data.getMonth() < 6 ? 1 : 2;
	return { ano, semestre };
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY
 */
export function formatarData(data) {
	const [ano, mes, dia] = data.split("-");
	return `${dia}/${mes}/${ano}`;
}

/**
 * Formata hora removendo os segundos
 */
export function formatarHora(hora) {
	return hora.substring(0, 5);
}

/**
 * Extrai cursos das orientações
 */
export function extrairCursos(orientacoes) {
	return orientacoes.map((orientacao) => orientacao.curso);
}

/**
 * Converte ISO date para chave de data/hora
 */
export function toDateKey(iso) {
	const toTwo = (n) => String(n).padStart(2, "0");
	const dt = new Date(iso);
	const y = dt.getFullYear();
	const m = toTwo(dt.getMonth() + 1);
	const d = toTwo(dt.getDate());
	const hh = toTwo(dt.getHours());
	const mm = toTwo(dt.getMinutes());
	const ss = toTwo(dt.getSeconds());
	return {
		data: `${y}-${m}-${d}`,
		hora: `${hh}:${mm}:${ss}`,
	};
}

/**
 * Adiciona minutos a um horário
 */
export function addMinutesToTime(timeStr, minutesToAdd) {
	const toTwo = (n) => String(n).padStart(2, "0");
	const [hh, mm, ss] = timeStr.split(":").map((v) => parseInt(v, 10));
	const base = new Date(2000, 0, 1, hh, mm, ss || 0);
	base.setMinutes(base.getMinutes() + minutesToAdd);
	const h2 = toTwo(base.getHours());
	const m2 = toTwo(base.getMinutes());
	const s2 = toTwo(base.getSeconds());
	return `${h2}:${m2}:${s2}`;
}

/**
 * Processa defesas e cria mapa de bloqueios
 */
export function processarDefesasParaBloqueios(defesas, codigoDocente) {
	const novosBloqueados = new Map();

	defesas.forEach((def) => {
		if (
			String(def.membro_banca) === String(codigoDocente) &&
			def.data_defesa
		) {
			const { data, hora } = toDateKey(def.data_defesa);
			const keyAtual = `${data}-${hora}`;
			const keySeguinte = `${data}-${addMinutesToTime(hora, 30)}`;
			const keyAnterior = `${data}-${addMinutesToTime(hora, -30)}`;

			// Defesa e imediatamente seguinte
			novosBloqueados.set(keyAtual, "banca");
			novosBloqueados.set(keySeguinte, "banca");
			// Imediatamente anterior
			novosBloqueados.set(keyAnterior, "indisp");
		}
	});

	return novosBloqueados;
}

/**
 * Converte disponibilidades do backend para formato de mapa
 */
export function converterDisponibilidadesParaMapa(disponibilidades) {
	const disponibilidadesMap = {};
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
	horarios,
	datas,
	disponibilidadesMap,
) {
	const todasDisponibilidades = {};
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
	disponibilidades,
	bloqueados,
) {
	return disponibilidades.filter((d) =>
		bloqueados.has(`${d.data_defesa}-${d.hora_defesa}`),
	);
}

/**
 * Gera linhas para o DataGrid
 */
export function gerarRowsDataGrid(grade, disponibilidades, bloqueados) {
	if (!grade || !grade.horarios || !grade.datas) {
		return [];
	}

	return grade.horarios.map((hora, index) => {
		const row = {
			id: index,
			horario: formatarHora(hora),
			...grade.datas.reduce((acc, data) => {
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
export function isSlotBloqueado(bloqueados, key) {
	if (!bloqueados) return false;
	if (typeof bloqueados.has === "function") return bloqueados.has(key);
	return false;
}

/**
 * Obtém tipo de bloqueio
 */
export function tipoBloqueio(bloqueados, key) {
	if (bloqueados instanceof Map) return bloqueados.get(key);
	return undefined;
}

/**
 * Calcula número de alterações entre disponibilidades atuais e originais
 */
export function calcularNumeroAlteracoes(
	disponibilidades,
	disponibilidadesOriginais,
) {
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
export function isDataCompleta(data, grade, disponibilidades, bloqueados) {
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
export function isDataParcial(data, grade, disponibilidades, bloqueados) {
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
export function alternarSelecaoData(data, grade, disponibilidades, bloqueados) {
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
	grade,
	disponibilidades,
	bloqueados,
	ano,
	semestre,
	cursoSelecionado,
	fase,
	codigoDocente,
) {
	const disponibilidadesParaEnviar = [];

	if (grade && grade.horarios && grade.datas) {
		grade.horarios.forEach((hora) => {
			grade.datas.forEach((data) => {
				const key = `${data}-${hora}`;
				const disponivel = isSlotBloqueado(bloqueados, key)
					? false
					: Boolean(disponibilidades[key]);

				disponibilidadesParaEnviar.push({
					ano: parseInt(ano),
					semestre: parseInt(semestre),
					id_curso: parseInt(cursoSelecionado),
					fase: parseInt(fase),
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
