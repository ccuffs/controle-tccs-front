import React from "react";
import {
	Stack,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from "@mui/material";
import { useFiltrosPesquisa } from "../../hooks/useFiltrosPesquisa.js";

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
	mostrarTodosCursos = false,
	habilitarFiltroTodasFases = true,
	habilitarFiltroOrientacao = true,
	habilitarFiltroProjeto = true,
	habilitarFiltroTcc = true,
	loading = false,
	anosDisponiveis = [],
	semestresDisponiveis = [],
	fasesDisponiveis = [],
}) {
	const {
		handleCursoChange,
		handleAnoChange,
		handleSemestreChange,
		handleFaseChange,
		semestreValue,
	} = useFiltrosPesquisa({
		cursoSelecionado,
		setCursoSelecionado,
		ano,
		setAno,
		semestre,
		setSemestre,
		fase,
		setFase,
		semestresDisponiveis,
	});

	return (
		<Stack direction="row" spacing={2} alignItems="center">
			{habilitarCurso && (
				<FormControl fullWidth size="small" disabled={loading}>
					<InputLabel>Curso</InputLabel>
					<Select
						value={cursoSelecionado || ""}
						label="Curso"
						onChange={handleCursoChange}
					>
						{mostrarTodosCursos && (
							<MenuItem value="">
								<em>Todos os cursos</em>
							</MenuItem>
						)}
						{cursos.map((curso) => (
							<MenuItem key={curso.id} value={curso.id}>
								{curso.nome} - {curso.codigo} ({curso.turno})
							</MenuItem>
						))}
					</Select>
				</FormControl>
			)}

			{habilitarAno && (
				<FormControl
					sx={{ minWidth: 100 }}
					size="small"
					disabled={loading}
				>
					<InputLabel>Ano</InputLabel>
					<Select
						value={ano || ""}
						label="Ano"
						onChange={handleAnoChange}
					>
						<MenuItem value="">
							<em>Todos</em>
						</MenuItem>
						{anosDisponiveis.length > 0
							? // Usar anos das ofertas TCC se disponíveis
								anosDisponiveis.map((a) => (
									<MenuItem key={a} value={a}>
										{a}
									</MenuItem>
								))
							: // Fallback para anos padrão se não houver ofertas
								[
									new Date().getFullYear() - 1,
									new Date().getFullYear(),
									new Date().getFullYear() + 1,
								].map((a) => (
									<MenuItem key={a} value={a}>
										{a}
									</MenuItem>
								))}
					</Select>
				</FormControl>
			)}

			{habilitarSemestre && (
				<FormControl
					sx={{ minWidth: 100 }}
					size="small"
					disabled={loading}
				>
					<InputLabel>Semestre</InputLabel>
					<Select
						value={semestreValue}
						label="Semestre"
						onChange={handleSemestreChange}
					>
						<MenuItem value="">
							<em>Todos</em>
						</MenuItem>
						{semestresDisponiveis.length > 0
							? // Usar semestres das ofertas TCC se disponíveis
								semestresDisponiveis.map((s) => (
									<MenuItem key={s} value={s}>
										{s}º Semestre
									</MenuItem>
								))
							: // Fallback para semestres padrão se não houver ofertas
								[1, 2].map((s) => (
									<MenuItem key={s} value={s}>
										{s}º Semestre
									</MenuItem>
								))}
					</Select>
				</FormControl>
			)}

			{habilitarFase && (
				<FormControl
					sx={{ minWidth: 100 }}
					size="small"
					disabled={loading}
				>
					<InputLabel>Fase</InputLabel>
					<Select
						value={fase || ""}
						label="Fase"
						onChange={handleFaseChange}
					>
						{habilitarFiltroTodasFases && (
							<MenuItem value="">
								<em>Todas</em>
							</MenuItem>
						)}
						{habilitarFiltroOrientacao && (
							<MenuItem key="0" value="0">
								Orientação
							</MenuItem>
						)}
						{habilitarFiltroProjeto && (
							<MenuItem key="1" value="1">
								Projeto
							</MenuItem>
						)}
						{habilitarFiltroTcc && (
							<MenuItem key="2" value="2">
								TCC
							</MenuItem>
						)}
						{fasesDisponiveis.length > 0 &&
							// Usar fases das ofertas TCC se disponíveis (apenas se não houver filtros específicos)
							!habilitarFiltroOrientacao &&
							!habilitarFiltroProjeto &&
							!habilitarFiltroTcc &&
							fasesDisponiveis.map((f) => (
								<MenuItem key={f} value={f}>
									Fase {f}
								</MenuItem>
							))}
					</Select>
				</FormControl>
			)}
		</Stack>
	);
}
