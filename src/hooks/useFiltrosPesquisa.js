import { useCallback } from "react";

export function useFiltrosPesquisa({
	cursoSelecionado,
	setCursoSelecionado,
	ano,
	setAno,
	semestre,
	setSemestre,
	fase,
	setFase,
	semestresDisponiveis = [],
}) {
	// Função para validar se um valor existe nas opções disponíveis
	const isValidValue = useCallback((value, options) => {
		if (!value) return true; // Valor vazio é sempre válido
		return options.includes(value);
	}, []);

	const handleCursoChange = useCallback(
		(e) => {
			setCursoSelecionado(e.target.value);
		},
		[setCursoSelecionado],
	);

	const handleAnoChange = useCallback(
		(e) => {
			setAno(e.target.value);
		},
		[setAno],
	);

	const handleSemestreChange = useCallback(
		(e) => {
			setSemestre(e.target.value);
		},
		[setSemestre],
	);

	const handleFaseChange = useCallback(
		(e) => {
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
