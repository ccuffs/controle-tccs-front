import React, { useState, useEffect } from "react";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";
import {
    Box,
    Stack,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
} from "@mui/material";
import CustomDataGrid from "./CustomDataGrid";

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
    }, [cursoSelecionado, ano, semestre]);

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
            // Filtrar por curso, ano e semestre
            const trabalhosFiltrados = (response.orientacoes || [])
                .filter(
                    (o) =>
                        o.TrabalhoConclusao &&
                        o.TrabalhoConclusao.Curso?.id ===
                            parseInt(cursoSelecionado) &&
                        o.TrabalhoConclusao.ano === parseInt(ano) &&
                        o.TrabalhoConclusao.semestre === parseInt(semestre)
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

    function handleCursoChange(e) {
        setCursoSelecionado(e.target.value);
    }
    function handleAnoChange(e) {
        setAno(e.target.value);
    }
    function handleSemestreChange(e) {
        setSemestre(e.target.value);
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
                <Stack direction="row" spacing={2} alignItems="center">
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
                                    {curso.nome} - {curso.codigo} ({curso.turno}
                                    )
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
                </Stack>
                <CustomDataGrid
                    rows={trabalhos}
                    columns={columns}
                    pageSize={10}
                    checkboxSelection={false}
                    rowSpanning={false}
                    disableSelectionOnClick
                    getRowId={(row) => row.id}
                    getRowHeight={() => "auto"}
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
