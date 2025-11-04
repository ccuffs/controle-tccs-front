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
 * Filtra orientações por curso, ano e semestre
 */
export function filtrarOrientacoes(orientacoes, cursoSelecionado, ano, semestre) {
	return orientacoes
		.filter(
			(o) =>
				o.TrabalhoConclusao &&
				o.TrabalhoConclusao.Curso?.id === parseInt(cursoSelecionado) &&
				o.TrabalhoConclusao.ano === parseInt(ano) &&
				o.TrabalhoConclusao.semestre === parseInt(semestre),
		)
		.map((o) => o.TrabalhoConclusao);
}

/**
 * Filtra defesas por TCCs do orientador e fase
 */
export function filtrarDefesas(defesas, idsTcc, fase) {
	return defesas
		.filter((d) => idsTcc.has(d.id_tcc))
		.filter((d) => !fase || parseInt(d.fase) === parseInt(fase));
}

/**
 * Cria mapa de TCCs para acesso rápido
 */
export function criarMapaTcc(orientacoes) {
	const map = new Map();
	orientacoes.forEach((t) => map.set(t.id, t));
	return map;
}

/**
 * Inicializa estados de avaliações a partir das defesas
 */
export function inicializarAvaliacoesEdicao(defesas) {
	const novoAvals = {};
	defesas.forEach((d) => {
		novoAvals[`${d.id_tcc}|${d.membro_banca}|${d.fase}`] =
			d.avaliacao !== null && d.avaliacao !== undefined
				? String(d.avaliacao)
				: "";
	});
	return novoAvals;
}

/**
 * Inicializa comentários de TCC para fase 2
 */
export function inicializarComentariosTcc(orientacoes) {
	const novoComentarios = {};
	orientacoes.forEach((tcc) => {
		if (tcc.fase === 2) {
			novoComentarios[tcc.id] = tcc.comentarios_tcc || "";
		}
	});
	return novoComentarios;
}

/**
 * Calcula média das notas
 */
export function calcularMedia(notas) {
	if (notas.length === 0) return null;
	return notas.reduce((s, n) => s + n, 0) / notas.length;
}

/**
 * Extrai notas válidas das avaliações
 */
export function extrairNotas(defesasTcc, avaliacoesEdicao) {
	return defesasTcc
		.map((d) => {
			const key = `${d.id_tcc}|${d.membro_banca}|${d.fase}`;
			const v = avaliacoesEdicao[key];
			const num =
				v === "" || v === undefined || v === null ? null : Number(v);
			return Number.isFinite(num) ? num : null;
		})
		.filter((n) => n !== null);
}

/**
 * Verifica se todas as avaliações estão completas
 */
export function verificarAvaliacoesCompletas(notas, totalDefesas) {
	return notas.length === totalDefesas && totalDefesas > 0;
}

/**
 * Verifica se está aprovado automaticamente (fase 1 com média >= 6)
 */
export function verificarAprovadoAutomatico(
	avaliacoesCompletas,
	media,
	fase,
) {
	return avaliacoesCompletas && media >= 6 && parseInt(fase) === 1;
}

/**
 * Formata data de defesa
 */
export function formatarDataDefesa(dataDefesa) {
	return dataDefesa
		? new Date(dataDefesa).toLocaleString("pt-BR")
		: "N/A";
}

/**
 * Processa membros da banca para exibição
 */
export function processarMembrosBanca(defesasTcc, avaliacoesEdicao) {
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
				salvo:
					d.avaliacao !== null && d.avaliacao !== undefined,
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
export function gerarCardsTodasFases(defesas, mapaTcc, avaliacoesEdicao) {
	const resultado = [];
	const defesasPorTccEFase = new Map();

	defesas.forEach((defesa) => {
		const chave = `${defesa.id_tcc}_${defesa.fase}`;
		if (!defesasPorTccEFase.has(chave)) {
			defesasPorTccEFase.set(chave, []);
		}
		defesasPorTccEFase.get(chave).push(defesa);
	});

	defesasPorTccEFase.forEach((defesasTccFase, chave) => {
		const [idTcc, faseAtual] = chave.split("_");
		const tcc = mapaTcc.get(parseInt(idTcc));
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
			faseAtual,
		);

		const membros = processarMembrosBanca(defesasTccFase, avaliacoesEdicao);

		resultado.push({
			idTcc: parseInt(idTcc),
			chaveUnica: chave,
			nomeDicente: tcc.Dicente?.nome || "N/A",
			matriculaDicente: tcc.Dicente?.matricula || "N/A",
			tituloTcc: tcc.titulo || "N/A",
			nomeCurso: tcc.Curso?.nome || "N/A",
			fase: parseInt(faseAtual),
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
	defesas,
	mapaTcc,
	avaliacoesEdicao,
	fase,
) {
	const resultado = [];
	const defesasPorTcc = new Map();

	defesas.forEach((defesa) => {
		if (!defesasPorTcc.has(defesa.id_tcc)) {
			defesasPorTcc.set(defesa.id_tcc, []);
		}
		defesasPorTcc.get(defesa.id_tcc).push(defesa);
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
			defesasTcc[0]?.fase,
		);

		const membros = processarMembrosBanca(defesasTcc, avaliacoesEdicao);

		resultado.push({
			idTcc,
			chaveUnica: `${idTcc}`,
			nomeDicente: tcc.Dicente?.nome || "N/A",
			matriculaDicente: tcc.Dicente?.matricula || "N/A",
			tituloTcc: tcc.titulo || "N/A",
			nomeCurso: tcc.Curso?.nome || "N/A",
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
export function ordenarCards(cards) {
	return cards.sort((a, b) => {
		const nomeComparison = (a.nomeDicente || "").localeCompare(
			b.nomeDicente || "",
		);
		if (nomeComparison !== 0) return nomeComparison;
		return (a.fase || 0) - (b.fase || 0);
	});
}

/**
 * Extrai ID do TCC da chave única
 */
export function extrairIdTcc(chaveUnica) {
	return chaveUnica.includes("_")
		? chaveUnica.split("_")[0]
		: chaveUnica;
}

/**
 * Extrai fase da chave única (se existir)
 */
export function extrairFase(chaveUnica) {
	return chaveUnica.includes("_") ? chaveUnica.split("_")[1] : null;
}

/**
 * Cria snapshot de avaliações para backup
 */
export function criarSnapshotAvaliacoes(avaliacoesEdicao, prefix, fase, faseCard) {
	const snapshot = {};
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
export function temNotasRegistradas(avaliacoesEdicao, prefix, fase, faseCard) {
	return Object.keys(avaliacoesEdicao).some((k) => {
		if (k.startsWith(prefix)) {
			if (fase === "" || fase === null || fase === undefined) {
				const [, , faseKey] = k.split("|");
				return faseCard && faseKey === faseCard;
			}
			return true;
		}
		return false;
	});
}

/**
 * Restaura avaliações do backup
 */
export function restaurarAvaliacoes(avaliacoesEdicao, snapshot, prefix, fase, faseCard) {
	const novo = { ...avaliacoesEdicao };
	Object.keys(novo).forEach((k) => {
		if (k.startsWith(prefix)) {
			if (fase === "" || fase === null || fase === undefined) {
				const [, , faseKey] = k.split("|");
				if (
					faseCard &&
					faseKey === faseCard &&
					snapshot.hasOwnProperty(k)
				) {
					novo[k] = snapshot[k];
				}
			} else if (snapshot.hasOwnProperty(k)) {
				novo[k] = snapshot[k];
			}
		}
	});
	return novo;
}

/**
 * Limpa avaliações de um TCC
 */
export function limparAvaliacoes(avaliacoesEdicao, prefix, fase, faseCard) {
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

