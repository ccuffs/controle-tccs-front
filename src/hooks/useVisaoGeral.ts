import { useEffect, useState } from "react";
import visaoGeralService, { type FiltrosPainel } from "../services/visao-geral-service";
import type {
	ConvitesMesPonto,
	ConvitesStatusDetalhe,
	DefesaAgenda,
	DocenteSemDisponibilidade,
	EstudantePendenteBanca,
	EtapaFaseItem,
	OrientadoresDefinidosDetalhe,
	PorDocenteItem,
} from "../types/dashboard";

export interface DadosVisaoGeral {
	orientadores: OrientadoresDefinidosDetalhe | null;
	convitesOrientacao: ConvitesStatusDetalhe | null;
	convitesBanca: ConvitesStatusDetalhe | null;
	etapas: EtapaFaseItem[];
	orientandosPorDocente: PorDocenteItem[];
	bancasPorDocente: PorDocenteItem[];
	defesas: DefesaAgenda[];
	estudantesPendentes: EstudantePendenteBanca[];
	docentesSemDisponibilidade: DocenteSemDisponibilidade[];
}

const VAZIO: DadosVisaoGeral = {
	orientadores: null,
	convitesOrientacao: null,
	convitesBanca: null,
	etapas: [],
	orientandosPorDocente: [],
	bancasPorDocente: [],
	defesas: [],
	estudantesPendentes: [],
	docentesSemDisponibilidade: [],
};

/** Carrega os dados da Visão geral; cada bloco falha de forma independente. */
export function useVisaoGeral(filtros: FiltrosPainel | null, onErro: (mensagem: string) => void) {
	const [dados, setDados] = useState<DadosVisaoGeral>(VAZIO);
	const [carregando, setCarregando] = useState(true);
	const chave = JSON.stringify(filtros);

	useEffect(() => {
		if (!filtros) return;
		let ativo = true;
		setCarregando(true);
		const s = visaoGeralService;
		Promise.allSettled([
			s.orientadoresDefinidos(filtros),
			s.convitesStatus("orientacao", filtros),
			s.convitesStatus("banca", filtros),
			s.distribuicaoEtapas(filtros),
			s.orientandosPorDocente(filtros),
			s.bancasPorDocente(filtros),
			s.defesas(filtros, { dias: 30 }),
			s.estudantesPendentesBanca(filtros),
			s.docentesSemDisponibilidade(filtros),
		]).then((r) => {
			if (!ativo) return;
			const ok = <T,>(res: PromiseSettledResult<T>): T | null => (res.status === "fulfilled" ? res.value : null);
			const [orient, convO, convB, etapas, orientandos, bancas, defesas, estudantes, docentes] = r;
			setDados({
				orientadores: ok(orient),
				convitesOrientacao: ok(convO),
				convitesBanca: ok(convB),
				etapas: ok(etapas)?.distribuicao ?? [],
				orientandosPorDocente: ok(orientandos)?.itens ?? [],
				bancasPorDocente: ok(bancas)?.itens ?? [],
				defesas: ok(defesas)?.itens ?? [],
				estudantesPendentes: ok(estudantes)?.itens ?? [],
				docentesSemDisponibilidade: ok(docentes)?.itens ?? [],
			});
			const falha = r.find((x): x is PromiseRejectedResult => x.status === "rejected");
			if (falha) onErro(falha.reason instanceof Error ? falha.reason.message : "Erro ao carregar a visão geral");
			setCarregando(false);
		});
		return () => {
			ativo = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chave]);

	return { dados, carregando };
}

/** Convites por mês (independe do período: janela móvel). */
export function useConvitesPorMes(filtros: FiltrosPainel | null, meses: number) {
	const [pontos, setPontos] = useState<ConvitesMesPonto[]>([]);
	const chave = JSON.stringify([filtros?.id_curso, filtros?.fase, filtros?.codigo_docente, meses]);

	useEffect(() => {
		if (!filtros) return;
		let ativo = true;
		visaoGeralService
			.convitesPorMes(filtros, meses)
			.then((r) => ativo && setPontos(r.pontos))
			.catch(() => ativo && setPontos([]));
		return () => {
			ativo = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chave]);

	return pontos;
}
