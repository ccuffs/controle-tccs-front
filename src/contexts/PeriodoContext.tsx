import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import dashboardService from "../services/dashboard-service";
import type { AnoSemestre } from "../types/dashboard";
import { useAuth } from "./AuthContext";

interface PeriodoContextValue {
	/** Todos os períodos cadastrados, do mais recente ao mais antigo. */
	periodos: AnoSemestre[];
	/** Período letivo atual segundo a API (/ano-semestre/atual). */
	atual: AnoSemestre | null;
	/** Período escolhido no seletor do topo (padrão: atual). */
	selecionado: AnoSemestre | null;
	selecionar: (periodo: AnoSemestre) => void;
	carregando: boolean;
}

const PeriodoContext = createContext<PeriodoContextValue>({
	periodos: [],
	atual: null,
	selecionado: null,
	selecionar: () => {},
	carregando: true,
});

const CHAVE_STORAGE = "periodo_selecionado";

function lerPreferencia(): AnoSemestre | null {
	try {
		const bruto = localStorage.getItem(CHAVE_STORAGE);
		if (!bruto) return null;
		const valor = JSON.parse(bruto) as Partial<AnoSemestre>;
		return typeof valor.ano === "number" && typeof valor.semestre === "number"
			? { ano: valor.ano, semestre: valor.semestre }
			: null;
	} catch {
		return null;
	}
}

function salvarPreferencia(periodo: AnoSemestre) {
	try {
		localStorage.setItem(CHAVE_STORAGE, JSON.stringify(periodo));
	} catch {
		// preferência apenas de conveniência; ignora falha de storage
	}
}

const mesmoPeriodo = (a: AnoSemestre | null, b: AnoSemestre | null) =>
	Boolean(a && b && a.ano === b.ano && a.semestre === b.semestre);

export function PeriodoProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated } = useAuth();
	const [periodos, setPeriodos] = useState<AnoSemestre[]>([]);
	const [atual, setAtual] = useState<AnoSemestre | null>(null);
	const [selecionado, setSelecionado] = useState<AnoSemestre | null>(null);
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
					.sort((a, b) => b.ano - a.ano || b.semestre - a.semestre);
				const atualNormalizado = { ano: Number(periodoAtual.ano), semestre: Number(periodoAtual.semestre) };
				const preferido = lerPreferencia();
				setPeriodos(ordenados);
				setAtual(atualNormalizado);
				setSelecionado(
					preferido && ordenados.some((p) => mesmoPeriodo(p, preferido)) ? preferido : atualNormalizado,
				);
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

	const selecionar = useCallback((periodo: AnoSemestre) => {
		setSelecionado(periodo);
		salvarPreferencia(periodo);
	}, []);

	const valor = useMemo(
		() => ({ periodos, atual, selecionado, selecionar, carregando }),
		[periodos, atual, selecionado, selecionar, carregando],
	);

	return <PeriodoContext.Provider value={valor}>{children}</PeriodoContext.Provider>;
}

export const usePeriodo = () => useContext(PeriodoContext);

export function rotuloPeriodo(periodo: AnoSemestre | null): string {
	return periodo ? `${periodo.ano}/${periodo.semestre}` : "—";
}
