import React, { useState, useEffect } from "react";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";
import { Box, Stack, Typography, Snackbar, Alert } from "@mui/material";
import CustomDataGrid from "./CustomDataGrid";
import FiltrosPesquisa from "./FiltrosPesquisa";

function getAnoSemestreAtual() {
	const data = new Date();
	const ano = data.getFullYear();
	const semestre = data.getMonth() < 6 ? 1 : 2;
	return { ano, semestre };
}

export default function TrabalhosOrientador() {
	const { usuario } = useAuth();
	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(getAnoSemestreAtual().ano);
	const [semestre, setSemestre] = useState(getAnoSemestreAtual().semestre);
	const [fase, setFase] = useState("");
	const [trabalhos, setTrabalhos] = useState([]);
	const [openMessage, setOpenMessage] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageSeverity, setMessageSeverity] = useState("success");

	useEffect(() => {
		getCursosOrientador();
	}, []);

	useEffect(() => {
		if (cursoSelecionado) {
			getTrabalhos();
		} else {
			setTrabalhos([]);
		}
	}, [cursoSelecionado, ano, semestre, fase]);

	async function getCursosOrientador() {
		try {
			const codigoDocente = usuario.codigo || usuario.id;
			const response = await axiosInstance.get(
				`/orientadores/docente/${codigoDocente}`,
			);
			const cursosOrientador = response.orientacoes || [];
			setCursos(cursosOrientador.map((orientacao) => orientacao.curso));
			if (cursosOrientador.length === 1) {
				setCursoSelecionado(cursosOrientador[0].curso.id);
			}
		} catch (error) {
			setCursos([]);
		}
	}

	async function getTrabalhos() {
		try {
			const codigoDocente = usuario.codigo || usuario.id;
			const params = {
				codigo_docente: codigoDocente,
				orientador: true,
			};
			const response = await axiosInstance.get("/orientacoes", {
				params,
			});
			// Filtrar por curso, ano, semestre e fase
			const trabalhosFiltrados = (response.orientacoes || [])
				.filter(
					(o) =>
						o.TrabalhoConclusao &&
						o.TrabalhoConclusao.Curso?.id ===
							parseInt(cursoSelecionado) &&
						o.TrabalhoConclusao.ano === parseInt(ano) &&
						o.TrabalhoConclusao.semestre === parseInt(semestre) &&
						(fase === "" ||
							o.TrabalhoConclusao.fase === parseInt(fase)),
				)
				.map((o) => ({
					...o.TrabalhoConclusao,
					nomeDiscente: o.TrabalhoConclusao.Dicente?.nome || "",
					nomeCurso: o.TrabalhoConclusao.Curso?.nome || "",
				}));
			setTrabalhos(trabalhosFiltrados);
		} catch (error) {
			setTrabalhos([]);
			setMessageText("Erro ao buscar trabalhos do orientador!");
			setMessageSeverity("error");
			setOpenMessage(true);
		}
	}

	function handleCloseMessage(_, reason) {
		if (reason === "clickaway") return;
		setOpenMessage(false);
	}

	const columns = [
		{ field: "nomeDiscente", headerName: "Discente", width: 200 },
		{ field: "nomeCurso", headerName: "Curso", width: 180 },
		{ field: "ano", headerName: "Ano", width: 80 },
		{ field: "semestre", headerName: "Semestre", width: 100 },
		{ field: "fase", headerName: "TCC", width: 80 },
		{ field: "tema", headerName: "Tema", width: 200 },
		{ field: "titulo", headerName: "Título", width: 250 },
		{ field: "resumo", headerName: "Resumo", width: 300 },
	];

	return (
		<Box>
			<Stack spacing={2}>
				<Typography variant="h6" component="h3">
					Trabalhos de Conclusão Orientados
				</Typography>
				<FiltrosPesquisa
					cursoSelecionado={cursoSelecionado}
					setCursoSelecionado={setCursoSelecionado}
					ano={ano}
					setAno={setAno}
					semestre={semestre}
					setSemestre={setSemestre}
					fase={fase}
					setFase={setFase}
					cursos={cursos}
					habilitarCurso
					habilitarAno
					habilitarSemestre
					habilitarFase
					mostrarTodosCursos={false}
					loading={false}
				/>
				<CustomDataGrid
					rows={trabalhos}
					columns={columns}
					pageSize={10}
					checkboxSelection={false}
					rowSpanning={false}
					disableSelectionOnClick
					getRowId={(row) => row.id}
					rowHeight={56}
				/>
				<Snackbar
					open={openMessage}
					autoHideDuration={6000}
					onClose={handleCloseMessage}
				>
					<Alert
						severity={messageSeverity}
						onClose={handleCloseMessage}
					>
						{messageText}
					</Alert>
				</Snackbar>
			</Stack>
		</Box>
	);
}
