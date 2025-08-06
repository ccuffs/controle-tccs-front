import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Checkbox,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Button,
	Alert,
	CircularProgress,
	Stack,
} from "@mui/material";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";

const GerenciarDisponibilidadeBanca = () => {
	const { usuario } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [cursos, setCursos] = useState([]);
	const [cursoSelecionado, setCursoSelecionado] = useState("");
	const [ano, setAno] = useState(getAnoSemestreAtual().ano);
	const [semestre, setSemestre] = useState(getAnoSemestreAtual().semestre);
	const [fase, setFase] = useState(1);
	const [grade, setGrade] = useState(null);
	const [disponibilidades, setDisponibilidades] = useState({});

	function getAnoSemestreAtual() {
		const data = new Date();
		const ano = data.getFullYear();
		const semestre = data.getMonth() < 6 ? 1 : 2;
		return { ano, semestre };
	}

	// Buscar cursos do orientador
	useEffect(() => {
		getCursosOrientador();
	}, []);

	// Buscar grade de disponibilidade quando curso, ano, semestre ou fase mudam
	useEffect(() => {
		if (cursoSelecionado) {
			buscarGradeDisponibilidade();
		} else {
			setGrade(null);
		}
	}, [cursoSelecionado, ano, semestre, fase]);

	async function getCursosOrientador() {
		try {
			const codigoDocente = usuario.codigo || usuario.id;
			const response = await axiosInstance.get(
				`/orientadores/docente/${codigoDocente}`
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

	const buscarGradeDisponibilidade = async () => {
		if (!cursoSelecionado) return;

		try {
			setLoading(true);
			setError("");

			// Obter código do docente do contexto
			const codigoDocente = usuario.codigo || usuario.id;

			// Buscar ofertas para o curso, ano, semestre e fase selecionados
			const responseOfertas = await axiosInstance.get("/ofertas-tcc", {
				params: {
					ano: ano,
					semestre: semestre,
					id_curso: cursoSelecionado,
					fase: fase,
				},
			});

			if (responseOfertas.ofertas && responseOfertas.ofertas.length > 0) {
				const oferta = responseOfertas.ofertas[0];

				const response = await axiosInstance.get(
					`/disponibilidade-banca/grade/${codigoDocente}/${oferta.ano}/${oferta.semestre}/${oferta.id_curso}/${oferta.fase}`
				);

				if (response.grade) {
					setGrade(response.grade);

					// Converter disponibilidades existentes para formato de checkbox
					const disponibilidadesMap = {};
					response.grade.disponibilidades.forEach(disp => {
						const key = `${disp.data_defesa}-${disp.hora_defesa}`;
						disponibilidadesMap[key] = disp.disponivel;
					});
					setDisponibilidades(disponibilidadesMap);
				}
			} else {
				setGrade(null);
				setError("Nenhuma oferta encontrada para os critérios selecionados");
			}
		} catch (error) {
			console.error("Erro ao buscar grade de disponibilidade:", error);
			setError("Erro ao carregar grade de disponibilidade");
			setGrade(null);
		} finally {
			setLoading(false);
		}
	};

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

	const handleCheckboxChange = async (data, hora, checked) => {
		if (!cursoSelecionado) return;

		// Atualizar estado local imediatamente para feedback visual
		const key = `${data}-${hora}`;
		setDisponibilidades(prev => ({
			...prev,
			[key]: checked,
		}));
	};

	const handleHeaderClick = (data) => {
		if (!cursoSelecionado || !grade) return;

		// Verificar se todos os horários da data estão selecionados
		const todosHorarios = grade.horarios.map(hora => `${data}-${hora}`);
		const horariosSelecionados = todosHorarios.filter(key => disponibilidades[key]);

		// Se todos estão selecionados, desselecionar todos; senão, selecionar todos
		const todosSelecionados = horariosSelecionados.length === todosHorarios.length;
		const novoValor = !todosSelecionados;

		// Atualizar todos os horários da data
		const novasDisponibilidades = { ...disponibilidades };
		todosHorarios.forEach(key => {
			novasDisponibilidades[key] = novoValor;
		});

		setDisponibilidades(novasDisponibilidades);
	};

	const sincronizarDisponibilidades = async () => {
		if (!cursoSelecionado || !ano || !semestre) {
			setError("Selecione curso, ano, semestre e fase antes de sincronizar");
			return;
		}

		try {
			setLoading(true);
			setError("");

			const codigoDocente = usuario.codigo || usuario.id;

			// Buscar oferta para obter a fase
			const responseOfertas = await axiosInstance.get("/ofertas-tcc", {
				params: {
					ano: ano,
					semestre: semestre,
					id_curso: cursoSelecionado,
					fase: fase,
				},
			});

			if (responseOfertas.ofertas && responseOfertas.ofertas.length > 0) {
				const oferta = responseOfertas.ofertas[0];

				// Preparar todas as disponibilidades para envio
				const disponibilidadesParaEnviar = [];

				if (grade && grade.horarios && grade.datas) {
					grade.horarios.forEach(hora => {
						grade.datas.forEach(data => {
							const key = `${data}-${hora}`;
							const disponivel = disponibilidades[key] || false;

							disponibilidadesParaEnviar.push({
								ano: parseInt(ano),
								semestre: parseInt(semestre),
								id_curso: parseInt(cursoSelecionado),
								fase: parseInt(fase),
								codigo_docente: codigoDocente,
								data_defesa: data,
								hora_defesa: hora,
								disponivel: disponivel,
							});
						});
					});
				}

				// Enviar todas as disponibilidades de uma vez usando a rota de sincronização
				await axiosInstance.post("/disponibilidade-banca/sincronizar", {
					disponibilidades: disponibilidadesParaEnviar
				});

				setSuccess("Disponibilidades sincronizadas com sucesso!");
				setTimeout(() => setSuccess(""), 3000);
			} else {
				setError("Nenhuma oferta encontrada para os critérios selecionados");
			}
		} catch (error) {
			console.error("Erro ao sincronizar disponibilidades:", error);
			setError("Erro ao sincronizar disponibilidades");
		} finally {
			setLoading(false);
		}
	};

	function handleCursoChange(e) {
		setCursoSelecionado(e.target.value);
	}

	function handleAnoChange(e) {
		setAno(e.target.value);
	}

	function handleSemestreChange(e) {
		setSemestre(e.target.value);
	}

	const formatarData = (data) => {
		const [ano, mes, dia] = data.split("-");
		return `${dia}/${mes}/${ano}`;
	};

	const formatarHora = (hora) => {
		return hora.substring(0, 5); // Remove os segundos
	};

	const isDisponivel = (data, hora) => {
		const key = `${data}-${hora}`;
		return disponibilidades[key] || false;
	};

	const isDataCompleta = (data) => {
		if (!grade || !grade.horarios) return false;

		const todosHorarios = grade.horarios.map(hora => `${data}-${hora}`);
		const horariosSelecionados = todosHorarios.filter(key => disponibilidades[key]);

		return horariosSelecionados.length === todosHorarios.length;
	};

	const isDataParcial = (data) => {
		if (!grade || !grade.horarios) return false;

		const todosHorarios = grade.horarios.map(hora => `${data}-${hora}`);
		const horariosSelecionados = todosHorarios.filter(key => disponibilidades[key]);

		return horariosSelecionados.length > 0 && horariosSelecionados.length < todosHorarios.length;
	};

	if (loading && !grade) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant="h5" component="h2" gutterBottom>
				Gerenciar Disponibilidade para Bancas
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 2 }}>
					{success}
				</Alert>
			)}

			<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
				<FormControl fullWidth size="small">
					<InputLabel>Curso</InputLabel>
					<Select
						value={cursoSelecionado}
						label="Curso"
						onChange={handleCursoChange}
					>
						<MenuItem value="">
							<em>Selecione um curso</em>
						</MenuItem>
						{cursos.map((curso) => (
							<MenuItem key={curso.id} value={curso.id}>
								{curso.nome} - {curso.codigo} ({curso.turno})
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl sx={{ minWidth: 100 }} size="small">
					<InputLabel>Ano</InputLabel>
					<Select
						value={ano}
						label="Ano"
						onChange={handleAnoChange}
					>
						{[ano - 1, ano, ano + 1].map((a) => (
							<MenuItem key={a} value={a}>
								{a}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl sx={{ minWidth: 80 }} size="small">
					<InputLabel>Semestre</InputLabel>
					<Select
						value={semestre}
						label="Semestre"
						onChange={handleSemestreChange}
					>
						{[1, 2].map((s) => (
							<MenuItem key={s} value={s}>
								{s}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl sx={{ minWidth: 80 }} size="small">
					<InputLabel>TCC</InputLabel>
					<Select
						value={fase}
						label="TCC"
						onChange={handleFaseChange}
					>
						{[1, 2].map((f) => (
							<MenuItem key={f} value={f}>
								{f}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<Button
					variant="contained"
					color="primary"
					onClick={sincronizarDisponibilidades}
					disabled={!cursoSelecionado || !ano || !semestre || !fase || loading}
					sx={{ minWidth: 120 }}
				>
					{loading ? "Sincronizando..." : "Sincronizar"}
				</Button>
			</Stack>

			{grade && (
				<Paper sx={{ width: "100%", overflow: "hidden" }}>
					<TableContainer sx={{ maxHeight: 600 }}>
						<Table stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell
										sx={{
											backgroundColor: "primary.main",
											color: "primary.contrastText",
											fontWeight: "bold",
											minWidth: 120,
										}}
									>
										Horário
									</TableCell>
									{grade.datas.map((data) => (
										<TableCell
											key={data}
											align="center"
											onClick={() => handleHeaderClick(data)}
											sx={{
												backgroundColor: isDataCompleta(data)
													? "success.main"
													: isDataParcial(data)
														? "warning.main"
														: "primary.main",
												color: "primary.contrastText",
												fontWeight: "bold",
												minWidth: 120,
												cursor: "pointer",
												"&:hover": {
													backgroundColor: isDataCompleta(data)
														? "success.dark"
														: isDataParcial(data)
															? "warning.dark"
															: "primary.dark",
												},
												position: "relative",
											}}
										>
											{formatarData(data)}
											{isDataCompleta(data) && (
												<Box
													sx={{
														position: "absolute",
														top: 2,
														right: 2,
														width: 8,
														height: 8,
														borderRadius: "50%",
														backgroundColor: "white",
													}}
												/>
											)}
											{isDataParcial(data) && (
												<Box
													sx={{
														position: "absolute",
														top: 2,
														right: 2,
														width: 8,
														height: 8,
														borderRadius: "50%",
														backgroundColor: "orange",
													}}
												/>
											)}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{grade.horarios.map((hora) => (
									<TableRow key={hora}>
										<TableCell
											sx={{
												backgroundColor: "grey.100",
												fontWeight: "bold",
												borderRight: "1px solid #e0e0e0",
											}}
										>
											{formatarHora(hora)}
										</TableCell>
										{grade.datas.map((data) => (
											<TableCell key={`${data}-${hora}`} align="center">
												<Checkbox
													checked={isDisponivel(data, hora)}
													onChange={(e) =>
														handleCheckboxChange(data, hora, e.target.checked)
													}
													disabled={loading}
													color="primary"
												/>
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Paper>
			)}

			{cursoSelecionado && !grade && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Nenhuma data de defesa configurada para esta oferta.
				</Alert>
			)}

			{!cursoSelecionado && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Selecione um curso para gerenciar a disponibilidade.
				</Alert>
			)}

			{cursoSelecionado && ano && semestre && fase && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					Marque os horários disponíveis na grade abaixo e clique em "Sincronizar" para salvar suas disponibilidades.
					<br />
					<strong>Dica:</strong> Clique no título de uma data para selecionar/desselecionar todos os horários daquele dia.
				</Alert>
			)}
		</Box>
	);
};

export default GerenciarDisponibilidadeBanca;