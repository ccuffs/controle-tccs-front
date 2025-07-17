import React, { useState, useEffect } from "react";

import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Snackbar,
    Stack,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

export default function Orientadores() {
    const [orientadores, setOrientadores] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [cursoSelecionado, setCursoSelecionado] = useState('');
    const [formData, setFormData] = useState({
        id_curso: "",
        codigo_docente: "",
    });
    const [docentes, setDocentes] = useState([]);
    const [openMessage, setOpenMessage] = React.useState(false);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [messageText, setMessageText] = React.useState("");
    const [messageSeverity, setMessageSeverity] = React.useState("success");
    const [orientacaoDelete, setOrientacaoDelete] = React.useState(null);

    useEffect(() => {
        getCursos();
        getDocentes();
    }, []);

    useEffect(() => {
        if (cursoSelecionado) {
            getOrientadoresPorCurso(cursoSelecionado);
        } else {
            setOrientadores([]);
        }
    }, [cursoSelecionado]);

    async function getCursos() {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/cursos`);
            const data = await response.json();
            setCursos(data.cursos || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de cursos: ", error);
            setCursos([]);
        }
    }

    async function getDocentes() {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/docentes`);
            const data = await response.json();
            setDocentes(data.docentes || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de docentes: ", error);
            setDocentes([]);
        }
    }

    async function getOrientadoresPorCurso(idCurso) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/orientadores/curso/${idCurso}`);
            const data = await response.json();
            setOrientadores(data.orientacoes || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de orientadores: ", error);
            setOrientadores([]);
        }
    }

    function handleDelete(row) {
        setOrientacaoDelete({ id_curso: row.id_curso, codigo_docente: row.codigo_docente });
        setOpenDialog(true);
    }

    function handleInputChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handleCursoChange(e) {
        setCursoSelecionado(e.target.value);
    }

    async function handleAddOrientacao() {
        try {
            if (!formData.id_curso || !formData.codigo_docente) {
                setMessageText("Por favor, selecione o curso e o docente!");
                setMessageSeverity("error");
                setOpenMessage(true);
                return;
            }

            await fetch(`${process.env.REACT_APP_API_URL}/orientadores`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    formData: formData,
                }),
            });

            setMessageText("Orientação adicionada com sucesso!");
            setMessageSeverity("success");
            setFormData({ id_curso: "", codigo_docente: "" });

            // Atualiza a lista se o curso selecionado for o mesmo que foi adicionado
            if (cursoSelecionado && formData.id_curso === cursoSelecionado) {
                await getOrientadoresPorCurso(cursoSelecionado);
            }
        } catch (error) {
            console.log("Não foi possível inserir a orientação no banco de dados");
            setMessageText("Falha ao gravar orientação!");
            setMessageSeverity("error");
        } finally {
            setOpenMessage(true);
        }
    }

    function handleCancelClick() {
        setFormData({ id_curso: "", codigo_docente: "" });
    }

    function handleCloseMessage(_, reason) {
        if (reason === "clickaway") {
            return;
        }
        setOpenMessage(false);
    }

    function handleClose() {
        setOpenDialog(false);
    }

    async function handleDeleteClick() {
        try {
            if (!orientacaoDelete) return;

            await fetch(`${process.env.REACT_APP_API_URL}/orientadores/${orientacaoDelete.id_curso}/${orientacaoDelete.codigo_docente}`, {
                method: "DELETE",
            });
            setMessageText("Orientação removida com sucesso!");
            setMessageSeverity("success");

            // Atualiza a lista
            if (cursoSelecionado) {
                await getOrientadoresPorCurso(cursoSelecionado);
            }
        } catch (error) {
            console.log("Não foi possível remover a orientação no banco de dados");
            setMessageText("Falha ao remover orientação!");
            setMessageSeverity("error");
        } finally {
            setOrientacaoDelete(null);
            setOpenDialog(false);
            setOpenMessage(true);
        }
    }

    function handleNoDeleteClick() {
        setOpenDialog(false);
        setOrientacaoDelete(null);
    }

    const columns = [
        { field: "codigo_docente", headerName: "Código Docente", width: 150 },
        {
            field: "docente_nome",
            headerName: "Nome do Orientador",
            width: 350,
            renderCell: (params) => {
                const docente = params?.row?.docente;
                return docente?.nome || 'N/A';
            }
        },
        {
            field: "docente_email",
            headerName: "Email",
            width: 300,
            renderCell: (params) => {
                const docente = params?.row?.docente;
                return docente?.email || 'N/A';
            }
        },
        {
            field: "actions",
            headerName: "Ações",
            sortable: false,
            width: 150,
            renderCell: (params) => (
                <Button
                    color="secondary"
                    onClick={() => handleDelete(params.row)}
                >
                    Remover
                </Button>
            ),
        },
    ];

    return (
        <Box>
            <Stack spacing={2}>
                <Typography variant="h5" component="h2">
                    Orientadores por Curso
                </Typography>

                <FormControl fullWidth size="small">
                    <InputLabel>Selecione um Curso</InputLabel>
                    <Select
                        value={cursoSelecionado}
                        label="Selecione um Curso"
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

                {cursoSelecionado && (
                    <>
                        <Typography variant="h6" component="h3">
                            Adicionar Novo Orientador
                        </Typography>

                        <Stack spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Curso</InputLabel>
                                <Select
                                    name="id_curso"
                                    value={formData.id_curso}
                                    label="Curso"
                                    onChange={handleInputChange}
                                >
                                    {cursos.map((curso) => (
                                        <MenuItem key={curso.id} value={curso.id}>
                                            {curso.nome} - {curso.codigo} ({curso.turno})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Docente</InputLabel>
                                <Select
                                    name="codigo_docente"
                                    value={formData.codigo_docente}
                                    label="Docente"
                                    onChange={handleInputChange}
                                >
                                    {docentes.map((docente) => (
                                        <MenuItem key={docente.codigo} value={docente.codigo}>
                                            {docente.nome} ({docente.codigo})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Stack spacing={2} direction="row">
                                <Button
                                    color="primary"
                                    variant="contained"
                                    onClick={handleAddOrientacao}
                                >
                                    Adicionar Orientação
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancelClick}
                                    color="error"
                                >
                                    Cancelar
                                </Button>
                            </Stack>
                        </Stack>
                    </>
                )}

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

                <Dialog
                    open={openDialog}
                    onClose={handleClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                        {"Atenção!"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Deseja realmente remover esta orientação?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleNoDeleteClick}>
                            Cancelar
                        </Button>
                        <Button onClick={handleDeleteClick} autoFocus>
                            Confirmar
                        </Button>
                    </DialogActions>
                </Dialog>

                {cursoSelecionado && (
                    <Box style={{ height: "500px" }}>
                        <DataGrid
                            rows={orientadores}
                            columns={columns}
                            pageSize={5}
                            checkboxSelection={false}
                            disableSelectionOnClick
                            getRowId={(row) => `${row.id_curso}_${row.codigo_docente}`}
                        />
                    </Box>
                )}
            </Stack>
        </Box>
    );
}

