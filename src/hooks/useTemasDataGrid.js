import { useMemo } from "react";

export function useTemasDataGrid({ temas, isOrientadorView = false }) {
	// Preparar e ordenar dados para o DataGrid
	const temasParaGrid = useMemo(() => {
		return temas
			.map((tema) => ({
				...tema,
				docenteNome: tema?.Docente?.nome || "N/A",
				areaNome: tema?.AreaTcc?.descricao || "N/A",
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

				// Se mesma área, ordenar por descrição do tema
				return (a.descricao || "").localeCompare(b.descricao || "");
			});
	}, [temas, isOrientadorView]);

	// Função para determinar se uma linha deve ter borda inferior
	const getRowClassName = useMemo(() => {
		return (params) => {
			// No modo orientador, não criar bordas baseadas no docente
			if (isOrientadorView) {
				return "";
			}

			const currentDocente = params.row.docenteNome;

			// Encontrar o índice da linha atual no array temasParaGrid
			const currentIndex = temasParaGrid.findIndex(
				(tema) => tema.id === params.row.id,
			);

			// Verificar se a próxima linha tem um docente diferente
			const nextRow = temasParaGrid[currentIndex + 1];
			if (nextRow && nextRow.docenteNome !== currentDocente) {
				return "row-with-bottom-border";
			}

			return "";
		};
	}, [temasParaGrid, isOrientadorView]);

	return {
		temasParaGrid,
		getRowClassName,
	};
}
