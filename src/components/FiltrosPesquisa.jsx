import React from "react";
import {
	Stack,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from "@mui/material";

export default function FiltrosPesquisa({
	cursoSelecionado,
	setCursoSelecionado,
	ano,
	setAno,
	semestre,
	setSemestre,
	fase,
	setFase,
	cursos,
	habilitarCurso = true,
	habilitarAno = true,
	habilitarSemestre = true,
	habilitarFase = true,
}) {
	function handleCursoChange(e) {
		setCursoSelecionado(e.target.value);
	}

	function handleAnoChange(e) {
		setAno(e.target.value);
	}

	function handleSemestreChange(e) {
		setSemestre(e.target.value);
	}

	function handleFaseChange(e) {
		setFase(e.target.value);
	}

	return (
				<Stack direction="row" spacing={2} alignItems="center">
			{habilitarCurso && (
				<FormControl fullWidth size="small">
					<InputLabel>Curso</InputLabel>
					<Select
						value={cursoSelecionado}
						label="Curso"
						onChange={handleCursoChange}
					>
						<MenuItem value="">
							<em>Todos os cursos</em>
						</MenuItem>
						{cursos.map((curso) => (
							<MenuItem key={curso.id} value={curso.id}>
								{curso.nome} - {curso.codigo} ({curso.turno})
							</MenuItem>
						))}
					</Select>
				</FormControl>
			)}

			{habilitarAno && (
				<FormControl sx={{ minWidth: 100 }} size="small">
					<InputLabel>Ano</InputLabel>
					<Select
						value={ano}
						label="Ano"
						onChange={handleAnoChange}
					>
						<MenuItem value="">
							<em>Todos</em>
						</MenuItem>
						{[ano - 1, ano, ano + 1].map((a) => (
							<MenuItem key={a} value={a}>
								{a}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			)}

			{habilitarSemestre && (
				<FormControl sx={{ minWidth: 100 }} size="small">
					<InputLabel>Semestre</InputLabel>
					<Select
						value={semestre}
						label="Semestre"
						onChange={handleSemestreChange}
					>
						<MenuItem value="">
							<em>Todos</em>
						</MenuItem>
						{[1, 2].map((s) => (
							<MenuItem key={s} value={s}>
								{s}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			)}

			{habilitarFase && (
				<FormControl sx={{ minWidth: 100 }} size="small">
					<InputLabel>Fase</InputLabel>
					<Select
						value={fase}
						label="Fase"
						onChange={handleFaseChange}
					>
						<MenuItem value="">
							<em>Todas</em>
						</MenuItem>
						<MenuItem value="0">Orientação</MenuItem>
						<MenuItem value="1">Projeto</MenuItem>
						<MenuItem value="2">TCC</MenuItem>
					</Select>
				</FormControl>
			)}
		</Stack>
	);
}
