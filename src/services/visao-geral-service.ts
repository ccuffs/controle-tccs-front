import axiosInstance from "../auth/axios";
import { getErrorMessage } from "../utils/apiError";
import type {
	ConvitesMesPonto,
	ConvitesStatusDetalhe,
	DefesaAgenda,
	DocenteSemDisponibilidade,
	EstudantePendenteBanca,
	EtapaFaseItem,
	ListaComTotal,
	OrientadoresDefinidosDetalhe,
	PorDocenteItem,
} from "../types/dashboard";

/** Filtros comuns aos endpoints /dashboard/* (valores vazios são omitidos). */
export interface FiltrosPainel {
	ano?: number;
	semestre?: number;
	/** "A partir de" (só com incluir_historico): opção "Todos os períodos" restrita. */
	desde_ano?: number;
	desde_semestre?: number;
	id_curso?: string;
	fase?: string;
	codigo_docente?: string;
}

function montarQuery(filtros: FiltrosPainel, extras: Record<string, string | number | boolean | undefined> = {}): string {
	const params = new URLSearchParams();
	for (const [chave, valor] of Object.entries({ ...filtros, ...extras })) {
		if (valor !== undefined && valor !== null && valor !== "") params.set(chave, String(valor));
	}
	return params.toString();
}

async function get<T>(caminho: string, mensagem: string): Promise<T> {
	try {
		return await axiosInstance.get<T>(caminho);
	} catch (error) {
		console.error(mensagem, error);
		throw new Error(getErrorMessage(error, mensagem));
	}
}

export const visaoGeralService = {
	orientadoresDefinidos: (f: FiltrosPainel) =>
		get<OrientadoresDefinidosDetalhe>(`/dashboard/orientadores-definidos?${montarQuery(f)}`, "Erro ao buscar orientadores definidos"),
	convitesStatus: (tipo: "orientacao" | "banca", f: FiltrosPainel) =>
		get<ConvitesStatusDetalhe>(`/dashboard/convites-${tipo}-status?${montarQuery(f)}`, "Erro ao buscar convites"),
	distribuicaoEtapas: (f: FiltrosPainel) =>
		get<{ distribuicao: EtapaFaseItem[] }>(`/dashboard/tcc-por-etapa?${montarQuery(f)}`, "Erro ao buscar etapas"),
	convitesPorMes: (f: FiltrosPainel, meses: number) =>
		get<{ pontos: ConvitesMesPonto[] }>(
			`/dashboard/convites-por-periodo?${montarQuery({ id_curso: f.id_curso, fase: f.fase, codigo_docente: f.codigo_docente }, { meses })}`,
			"Erro ao buscar convites por mês",
		),
	orientandosPorDocente: (f: FiltrosPainel) =>
		get<{ itens: PorDocenteItem[] }>(`/dashboard/orientandos-por-docente?${montarQuery(f)}`, "Erro ao buscar orientandos"),
	bancasPorDocente: (f: FiltrosPainel) =>
		get<{ itens: PorDocenteItem[] }>(`/dashboard/defesas-aceitas-por-docente?${montarQuery(f)}`, "Erro ao buscar bancas"),
	defesas: (f: FiltrosPainel, extras: { dias?: number; status?: string; incluir_historico?: boolean } = {}) =>
		get<ListaComTotal<DefesaAgenda>>(`/dashboard/defesas-agendadas?${montarQuery(f, extras)}`, "Erro ao buscar defesas"),
	estudantesPendentesBanca: (f: FiltrosPainel) =>
		get<ListaComTotal<EstudantePendenteBanca>>(
			`/dashboard/estudantes-sem-convite-banca?${montarQuery(f)}`,
			"Erro ao buscar discentes sem convite de banca",
		),
	docentesSemDisponibilidade: (f: FiltrosPainel) =>
		get<ListaComTotal<DocenteSemDisponibilidade>>(
			`/dashboard/docentes-sem-disponibilidade-banca?${montarQuery(f)}`,
			"Erro ao buscar docentes sem disponibilidade",
		),
};

export default visaoGeralService;
