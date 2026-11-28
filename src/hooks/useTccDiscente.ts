import { useCallback, useEffect, useState } from "react";
import { usePeriodo } from "../contexts/PeriodoContext";
import { getMeuPerfil } from "../services/perfil-dicente-service";
import trabalhoConclusaoService from "../services/trabalho-conclusao-service";
import type { AnoSemestre } from "../types/dashboard";
import type { Dicente } from "../types/dicente";
import type { TrabalhoConclusao } from "../types/trabalho-conclusao";

const anterior = (a: AnoSemestre, b: AnoSemestre) => a.ano < b.ano || (a.ano === b.ano && a.semestre < b.semestre);

/**
 * Período que o discente está apenas consultando: um período anterior ao atual escolhido no topo.
 * No período atual (padrão), em períodos futuros ou em "Todos", vale a jornada da oferta atual.
 */
export function useConsultaDiscente(): AnoSemestre | null {
	const { escolha, atual } = usePeriodo();
	if (!escolha || escolha === "todos" || !atual) return null;
	return anterior(escolha, atual) ? escolha : null;
}

/**
 * Discente logado e seu TCC: o do período consultado (somente leitura) ou, fora dele, o da oferta
 * atual (ou o mais recente, se não houver na oferta atual).
 */
export function useTccDiscente() {
	const consulta = useConsultaDiscente();
	const [dicente, setDicente] = useState<Dicente | null>(null);
	const [tcc, setTcc] = useState<TrabalhoConclusao | null>(null);
	const [carregando, setCarregando] = useState(true);
	const [versao, setVersao] = useState(0);

	useEffect(() => {
		let ativo = true;
		(async () => {
			setCarregando(true);
			try {
				const d = await getMeuPerfil();
				if (!ativo) return;
				setDicente(d);
				let trabalho: TrabalhoConclusao | null;
				if (consulta) {
					// Mais de um TCC no período (projeto e TCC): mostra o da fase mais adiantada.
					const lista = await trabalhoConclusaoService.getMeusTrabalhosNoPeriodo(consulta);
					trabalho = [...lista].sort((a, b) => b.fase - a.fase || b.id - a.id)[0] ?? null;
				} else {
					const atual = await trabalhoConclusaoService.getTrabalhoConclusaoByDiscenteOfertaAtual(d.matricula);
					trabalho = atual ?? (await trabalhoConclusaoService.getTrabalhoConclusaoByDiscente(d.matricula).catch(() => null));
				}
				if (ativo) setTcc(trabalho);
			} catch {
				if (ativo) setTcc(null);
			} finally {
				if (ativo) setCarregando(false);
			}
		})();
		return () => {
			ativo = false;
		};
	}, [versao, consulta?.ano, consulta?.semestre]); // eslint-disable-line react-hooks/exhaustive-deps

	const recarregar = useCallback(() => setVersao((v) => v + 1), []);
	return { dicente, tcc, carregando, recarregar, consulta };
}
