import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { perfilDaUrl } from "../components/layout/navegacao";
import { Permissoes } from "../enums/permissoes";
import dashboardService from "../services/dashboard-service";
import trabalhoConclusaoService from "../services/trabalho-conclusao-service";
import type { AnoSemestre } from "../types/dashboard";
import { useAuth } from "./AuthContext";

/**
 * Primeiro período visível para docentes, coordenação e banca (sem grupo ADMIN): os anteriores
 * não aparecem no seletor e "Todos os períodos" significa "a partir deste".
 */
export const PRIMEIRO_PERIODO_EQUIPE: AnoSemestre = { ano: 2026, semestre: 1 };

/** Escolha do seletor do topo: um período específico ou todos. */
export type EscolhaPeriodo = AnoSemestre | "todos";

/**
 * Filtro de período para listagens. Com "Todos os períodos" fica vazio (admin e discente) ou
 * traz só o limite inferior desde_ano/desde_semestre (docentes, coordenação e banca).
 */
export interface FiltroPeriodo {
	ano?: number;
	semestre?: number;
	desde_ano?: number;
	desde_semestre?: number;
}

interface PeriodoContextValue {
	/** Períodos que o usuário pode escolher no perfil atual, do mais recente ao mais antigo. */
	periodos: AnoSemestre[];
	/** Período letivo atual segundo a API (/ano-semestre/atual). */
	atual: AnoSemestre | null;
	/** Escolha do seletor do topo (padrão: atual). */
	escolha: EscolhaPeriodo | null;
	/** "Todos os períodos" está selecionado. */
	todos: boolean;
	/** Para listagens: { ano, semestre } do período escolhido; com "todos", {} ou o limite "desde". */
	filtro: FiltroPeriodo;
	/**
	 * Para telas que mostram um único período (painéis, grade, vagas, importação):
	 * o período escolhido ou, com "todos", o atual.
	 */
	periodoEfetivo: AnoSemestre | null;
	selecionar: (escolha: EscolhaPeriodo) => void;
	carregando: boolean;
}

const PeriodoContext = createContext<PeriodoContextValue>({
	periodos: [],
	atual: null,
	escolha: null,
	todos: false,
	filtro: {},
	periodoEfetivo: null,
	selecionar: () => {},
	carregando: true,
});

/**
 * A escolha vale para a sessão (sobrevive a recarregar a página), mas cada sessão nova
 * começa no período atual, para ninguém ficar num período antigo sem perceber.
 */
const CHAVE_STORAGE = "periodo_selecionado";

function lerPreferencia(): EscolhaPeriodo | null {
	try {
		const bruto = sessionStorage.getItem(CHAVE_STORAGE);
		if (!bruto) return null;
		const valor = JSON.parse(bruto) as Partial<AnoSemestre> | string;
		if (valor === "todos") return "todos";
		return typeof valor === "object" && typeof valor.ano === "number" && typeof valor.semestre === "number"
			? { ano: valor.ano, semestre: valor.semestre }
			: null;
	} catch {
		return null;
	}
}

function salvarPreferencia(escolha: EscolhaPeriodo) {
	try {
		sessionStorage.setItem(CHAVE_STORAGE, JSON.stringify(escolha));
	} catch {
		// preferência apenas de conveniência; ignora falha de storage
	}
}

export const mesmoPeriodo = (a: AnoSemestre | null | undefined, b: AnoSemestre | null | undefined) =>
	Boolean(a && b && a.ano === b.ano && a.semestre === b.semestre);

const naoAnterior = (p: AnoSemestre, limite: AnoSemestre) =>
	p.ano > limite.ano || (p.ano === limite.ano && p.semestre >= limite.semestre);

const decrescente = (a: AnoSemestre, b: AnoSemestre) => b.ano - a.ano || b.semestre - a.semestre;

/**
 * Quem vê quais períodos:
 * - "livre": grupo ADMIN, todos os períodos;
 * - "discente": só os períodos em que o aluno tem TCC, mais o atual (onde a jornada acontece);
 * - "equipe": docentes, coordenação e banca, de PRIMEIRO_PERIODO_EQUIPE em diante.
 */
type Restricao = "livre" | "discente" | "equipe";

export function PeriodoProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated, gruposUsuario } = useAuth();
	const { pathname } = useLocation();
	const perfil = perfilDaUrl(pathname);
	const ehAdmin = gruposUsuario.some((g) => g.id === Permissoes.GRUPOS.ADMIN);
	const restricao: Restricao = ehAdmin ? "livre" : perfil === "discente" ? "discente" : "equipe";

	const [todosPeriodos, setTodosPeriodos] = useState<AnoSemestre[]>([]);
	const [periodosDoAluno, setPeriodosDoAluno] = useState<AnoSemestre[]>([]);
	const [atual, setAtual] = useState<AnoSemestre | null>(null);
	const [escolha, setEscolha] = useState<EscolhaPeriodo | null>(null);
	const [carregando, setCarregando] = useState(true);

	useEffect(() => {
		if (!isAuthenticated) return;
		let cancelado = false;
		(async () => {
			setCarregando(true);
			try {
				const [lista, periodoAtual] = await Promise.all([
					dashboardService.getAnoSemestres(),
					dashboardService.getAnoSemestreAtual(),
				]);
				if (cancelado) return;
				const ordenados = [...lista]
					.map((p) => ({ ano: Number(p.ano), semestre: Number(p.semestre) }))
					.sort(decrescente);
				const atualNormalizado = { ano: Number(periodoAtual.ano), semestre: Number(periodoAtual.semestre) };
				const preferido = lerPreferencia();
				setTodosPeriodos(ordenados);
				setAtual(atualNormalizado);
				// Validada contra os períodos do perfil em `escolhaValida` (abaixo).
				setEscolha(preferido ?? atualNormalizado);
			} catch (error) {
				console.error("Erro ao carregar períodos letivos:", error);
			} finally {
				if (!cancelado) setCarregando(false);
			}
		})();
		return () => {
			cancelado = true;
		};
	}, [isAuthenticated]);

	// Discente: períodos dos próprios TCCs (a API restringe a listagem à matrícula de quem pede).
	useEffect(() => {
		if (!isAuthenticated || restricao !== "discente") return;
		let cancelado = false;
		trabalhoConclusaoService
			.getMeusTrabalhos()
			.then((lista) => {
				if (cancelado) return;
				const unicos = new Map(lista.map((t) => [`${t.ano}/${t.semestre}`, { ano: Number(t.ano), semestre: Number(t.semestre) }]));
				setPeriodosDoAluno([...unicos.values()]);
			})
			.catch(() => !cancelado && setPeriodosDoAluno([]));
		return () => {
			cancelado = true;
		};
	}, [isAuthenticated, restricao]);

	const periodos = useMemo(() => {
		if (restricao === "livre") return todosPeriodos;
		if (restricao === "equipe") return todosPeriodos.filter((p) => naoAnterior(p, PRIMEIRO_PERIODO_EQUIPE));
		const lista = [...periodosDoAluno];
		if (atual && !lista.some((p) => mesmoPeriodo(p, atual))) lista.push(atual);
		return lista.sort(decrescente);
	}, [restricao, todosPeriodos, periodosDoAluno, atual]);

	// Escolha fora dos períodos do perfil (ex.: preferência de outro perfil) volta ao atual.
	const escolhaValida = useMemo<EscolhaPeriodo | null>(() => {
		if (!escolha || escolha === "todos") return escolha;
		if (periodos.some((p) => mesmoPeriodo(p, escolha))) return escolha;
		if (atual && periodos.some((p) => mesmoPeriodo(p, atual))) return atual;
		return periodos[0] ?? atual;
	}, [escolha, periodos, atual]);

	const selecionar = useCallback((nova: EscolhaPeriodo) => {
		setEscolha(nova);
		salvarPreferencia(nova);
	}, []);

	const todos = escolhaValida === "todos";
	const especifico = escolhaValida && escolhaValida !== "todos" ? escolhaValida : null;
	// Objeto estável enquanto os valores não mudam (telas usam o filtro como dependência de efeitos).
	const filtro = useMemo<FiltroPeriodo>(
		() =>
			especifico
				? { ano: especifico.ano, semestre: especifico.semestre }
				: restricao === "equipe"
					? { desde_ano: PRIMEIRO_PERIODO_EQUIPE.ano, desde_semestre: PRIMEIRO_PERIODO_EQUIPE.semestre }
					: {},
		[especifico?.ano, especifico?.semestre, restricao], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const valor = useMemo<PeriodoContextValue>(() => {
		return {
			periodos,
			atual,
			escolha: escolhaValida,
			todos,
			filtro,
			periodoEfetivo: todos ? atual : especifico,
			selecionar,
			carregando,
		};
	}, [periodos, atual, escolhaValida, todos, especifico, filtro, selecionar, carregando]);

	return <PeriodoContext.Provider value={valor}>{children}</PeriodoContext.Provider>;
}

export const usePeriodo = () => useContext(PeriodoContext);

export function rotuloPeriodo(periodo: EscolhaPeriodo | null | undefined): string {
	if (periodo === "todos") return "Todos";
	return periodo ? `${periodo.ano}/${periodo.semestre}` : "—";
}

/** O filtro como texto (para serviços que recebem strings); campos ausentes viram "". */
export function filtroComoTexto(filtro: FiltroPeriodo): {
	ano: string;
	semestre: string;
	desde_ano: string;
	desde_semestre: string;
} {
	const texto = (v?: number) => (v ? String(v) : "");
	return {
		ano: texto(filtro.ano),
		semestre: texto(filtro.semestre),
		desde_ano: texto(filtro.desde_ano),
		desde_semestre: texto(filtro.desde_semestre),
	};
}
