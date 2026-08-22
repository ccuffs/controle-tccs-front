import { useCallback } from "react";

type FiltroChangeEvent = { target: { value: string | number } };
type FiltroSetter = (value: string | number) => void;

interface UseFiltrosPesquisaParams {
	cursoSelecionado: string | number;
	setCursoSelecionado: FiltroSetter;
	ano: string | number;
	setAno: FiltroSetter;
	semestre: string | number;
	setSemestre: FiltroSetter;
	fase: string | number;
	setFase: FiltroSetter;
	semestresDisponiveis?: (string | number)[];
}

export function useFiltrosPesquisa({
	setCursoSelecionado,
	setAno,
	semestre,
	setSemestre,
	setFase,
	semestresDisponiveis = [],
}: UseFiltrosPesquisaParams) {
	// Função para validar se um valor existe nas opções disponíveis
	const isValidValue = useCallback(
		(value: string | number, options: (string | number)[]) => {
			if (value === "" || value === null || value === undefined) return true;
			return options.some((option) => String(option) === String(value));
		},
		[],
	);

	const handleCursoChange = useCallback(
		(e: FiltroChangeEvent) => {
			setCursoSelecionado(e.target.value);
		},
		[setCursoSelecionado],
	);

	const handleAnoChange = useCallback(
		(e: FiltroChangeEvent) => {
			setAno(e.target.value);
		},
		[setAno],
	);

	const handleSemestreChange = useCallback(
		(e: FiltroChangeEvent) => {
			setSemestre(e.target.value);
		},
		[setSemestre],
	);

	const handleFaseChange = useCallback(
		(e: FiltroChangeEvent) => {
			setFase(e.target.value);
		},
		[setFase],
	);

	// Validar valor de semestre
	const semestreValue = isValidValue(semestre, [
		...semestresDisponiveis,
		1,
		2,
	])
		? semestre
		: "";

	return {
		handleCursoChange,
		handleAnoChange,
		handleSemestreChange,
		handleFaseChange,
		semestreValue,
	};
}
