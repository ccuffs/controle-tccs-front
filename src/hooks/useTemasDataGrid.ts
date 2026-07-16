import { useMemo } from "react";
import type { TemaTcc } from "../types/tema-tcc";

export interface TemaComVagas extends TemaTcc {
	vagas?: number;
}

export interface TemaGridRow extends TemaComVagas {
	docenteNome: string;
	areaNome: string;
	vagasOferta: number;
}

interface UseTemasDataGridParams {
	temas: TemaComVagas[];
	isOrientadorView?: boolean;
}

export function useTemasDataGrid({
	temas,
	isOrientadorView = false,
}: UseTemasDataGridParams) {
	// Preparar e ordenar dados para o DataGrid
	const temasParaGrid = useMemo<TemaGridRow[]>(() => {
		return temas
			.map((tema) => ({
				...tema,
				docenteNome: tema?.docente?.nome || "N/A",
				areaNome: tema?.areaTcc?.descricao || "N/A",
				vagasOferta: tema?.vagasOferta || tema?.vagas || 0,
			}))
			.sort((a, b) => {
				// No modo orientador, não ordenar por docente já que só há um
				if (!isOrientadorView) {
					// Primeiro ordenar por nome do docente
					const nomeA = a.docenteNome || "";
					const nomeB = b.docenteNome || "";
					if (nomeA !== nomeB) {
						return nomeA.localeCompare(nomeB);
					}
				}

				// Ordenar por área TCC
				const areaA = a.areaNome || "";
				const areaB = b.areaNome || "";
				if (areaA !== areaB) {
					return areaA.localeCompare(areaB);
				}

				// Por fim, ordenar por descrição
				return (a.descricao || "").localeCompare(b.descricao || "");
			});
	}, [temas, isOrientadorView]);

	const getRowClassName = (params: { row: TemaGridRow }) => {
		return params.row.ativo ? "" : "row-inativo";
	};

	return {
		temasParaGrid,
		getRowClassName,
	};
}
