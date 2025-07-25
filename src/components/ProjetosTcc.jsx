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

export default function ProjetosTcc() {
    const [projetos, setProjetos] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [cursoSelecionado, setCursoSelecionado] = useState('');
    const [docentesOrientadores, setDocentesOrientadores] = useState([]);
    const [areasTcc, setAreasTcc] = useState([]);
    const [formData, setFormData] = useState({
        descricao: "",
        id_area_tcc: "",
        codigo_docente: "",
    });
    const [openMessage, setOpenMessage] = React.useState(false);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [openAreaModal, setOpenAreaModal] = React.useState(false);
    const [messageText, setMessageText] = React.useState("");
    const [messageSeverity, setMessageSeverity] = React.useState("success");
    const [projetoDelete, setProjetoDelete] = React.useState(null);
    const [novaAreaData, setNovaAreaData] = useState({
        descicao: "",
        codigo_docente: "",
    });

    useEffect(() => {
        getCursos();
    }, []);

    useEffect(() => {
        if (cursoSelecionado) {
            getDocentesOrientadoresPorCurso(cursoSelecionado);
            getProjetosPorCurso(cursoSelecionado);
        } else {
            setDocentesOrientadores([]);
            setProjetos([]);
        }
    }, [cursoSelecionado]);

    useEffect(() => {
        if (formData.codigo_docente) {
            getAreasTccPorDocente(formData.codigo_docente);
        } else {
            setAreasTcc([]);
        }
    }, [formData.codigo_docente]);

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

    async function getDocentesOrientadoresPorCurso(idCurso) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/orientadores/curso/${idCurso}`);
            const data = await response.json();
            setDocentesOrientadores(data.orientacoes || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de docentes orientadores: ", error);
            setDocentesOrientadores([]);
        }
    }

    async function getAreasTccPorDocente(codigoDocente) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/areas-tcc/docente/${codigoDocente}`);
            const data = await response.json();
            setAreasTcc(data.areas || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de áreas TCC: ", error);
            setAreasTcc([]);
        }
    }

    async function getProjetosPorCurso(idCurso) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/projetos-tcc/curso/${idCurso}`);
            const data = await response.json();
            setProjetos(data.projetos || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de projetos TCC: ", error);
            setProjetos([]);
        }
    }

    function handleDelete(row) {
        setProjetoDelete(row.id);
        setOpenDialog(true);
    }

    function handleInputChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handleCursoChange(e) {
        setCursoSelecionado(e.target.value);
        // Limpar seleções dependentes
        setFormData({
            descricao: "",
            id_area_tcc: "",
            codigo_docente: "",
        });
    }

    function handleNovaAreaChange(e) {
        setNovaAreaData({ ...novaAreaData, [e.target.name]: e.target.value });
    }

    function handleOpenAreaModal() {
        if (!formData.codigo_docente) {
            setMessageText("Por favor, selecione um docente primeiro!");
            setMessageSeverity("error");
            setOpenMessage(true);
            return;
        }
        setNovaAreaData({
            descicao: "",
            codigo_docente: formData.codigo_docente,
        });
        setOpenAreaModal(true);
    }

    function handleCloseAreaModal() {
        setOpenAreaModal(false);
        setNovaAreaData({
            descicao: "",
            codigo_docente: "",
        });
    }

    async function handleCreateArea() {
        try {
            if (!novaAreaData.descicao) {
                setMessageText("Por favor, preencha a descrição da área!");
                setMessageSeverity("error");
                setOpenMessage(true);
                return;
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/areas-tcc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    formData: novaAreaData,
                }),
            });

            if (response.ok) {
                setMessageText("Área TCC criada com sucesso!");
                setMessageSeverity("success");
                handleCloseAreaModal();
                // Atualiza a lista de áreas TCC
                await getAreasTccPorDocente(formData.codigo_docente);
            } else {
                throw new Error("Erro ao criar área TCC");
            }
        } catch (error) {
            console.log("Não foi possível criar a área TCC no banco de dados", error);
            setMessageText("Falha ao criar área TCC!");
            setMessageSeverity("error");
        } finally {
            setOpenMessage(true);
        }
    }

    async function handleAddProjeto() {
        try {
            if (!formData.descricao || !formData.id_area_tcc || !formData.codigo_docente) {
                setMessageText("Por favor, preencha todos os campos obrigatórios!");
                setMessageSeverity("error");
                setOpenMessage(true);
                return;
            }

            await fetch(`${process.env.REACT_APP_API_URL}/projetos-tcc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    formData: formData,
                }),
            });

            setMessageText("Projeto TCC adicionado com sucesso!");
            setMessageSeverity("success");
            setFormData({
                descricao: "",
                id_area_tcc: "",
                codigo_docente: "",
            });

            // Atualiza a lista
            await getProjetosPorCurso(cursoSelecionado);
        } catch (error) {
            console.log("Não foi possível inserir o projeto TCC no banco de dados");
            setMessageText("Falha ao gravar projeto TCC!");
            setMessageSeverity("error");
        } finally {
            setOpenMessage(true);
        }
    }

    function handleCancelClick() {
        setFormData({
            descricao: "",
            id_area_tcc: "",
            codigo_docente: "",
        });
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
            if (!projetoDelete) return;

            await fetch(`${process.env.REACT_APP_API_URL}/projetos-tcc/${projetoDelete}`, {
                method: "DELETE",
            });
            setMessageText("Projeto TCC removido com sucesso!");
            setMessageSeverity("success");

            // Atualiza a lista
            if (cursoSelecionado) {
                await getProjetosPorCurso(cursoSelecionado);
            }
        } catch (error) {
            console.log("Não foi possível remover o projeto TCC no banco de dados");
            setMessageText("Falha ao remover projeto TCC!");
            setMessageSeverity("error");
        } finally {
            setProjetoDelete(null);
            setOpenDialog(false);
            setOpenMessage(true);
        }
    }

    function handleNoDeleteClick() {
        setOpenDialog(false);
        setProjetoDelete(null);
    }

    const columns = [
        { field: "id", headerName: "ID", width: 70 },
        {
            field: "docente_nome",
            headerName: "Docente Responsável",
            width: 300,
            renderCell: (params) => {
                const docente = params?.row?.Docente;
                return docente?.nome || 'N/A';
            }
        },
        {
            field: "area_nome",
            headerName: "Área TCC",
            width: 250,
            renderCell: (params) => {
                const area = params?.row?.AreaTcc;
                return area?.descicao || 'N/A';
            }
        },
        { field: "descricao", headerName: "Descrição", width: 400 },
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
                    Projetos TCC por Curso
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
                            Adicionar Novo Projeto TCC
                        </Typography>

                        <Stack spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Docente Orientador</InputLabel>
                                <Select
                                    name="codigo_docente"
                                    value={formData.codigo_docente}
                                    label="Docente Orientador"
                                    onChange={handleInputChange}
                                >
                                    {docentesOrientadores.map((orientacao) => (
                                        <MenuItem key={orientacao.docente?.codigo} value={orientacao.docente?.codigo}>
                                            {orientacao.docente?.nome} ({orientacao.docente?.codigo})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {formData.codigo_docente && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Área TCC</InputLabel>
                                        <Select
                                            name="id_area_tcc"
                                            value={formData.id_area_tcc}
                                            label="Área TCC"
                                            onChange={handleInputChange}
                                        >
                                            {areasTcc.map((area) => (
                                                <MenuItem key={area.id} value={area.id}>
                                                    {area.descicao}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={handleOpenAreaModal}
                                        sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                                    >
                                        Nova Área
                                    </Button>
                                </Stack>
                            )}

                            <TextField
                                name="descricao"
                                label="Descrição do Projeto"
                                value={formData.descricao}
                                onChange={handleInputChange}
                                fullWidth
                                size="small"
                                multiline
                                rows={3}
                                placeholder="Descreva o projeto TCC..."
                            />

                            <Stack spacing={2} direction="row">
                                <Button
                                    color="primary"
                                    variant="contained"
                                    onClick={handleAddProjeto}
                                >
                                    Adicionar Projeto
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

                {/* Modal para criar nova área TCC */}
                <Dialog
                    open={openAreaModal}
                    onClose={handleCloseAreaModal}
                    aria-labelledby="criar-area-title"
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle id="criar-area-title">
                        Criar Nova Área TCC
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                name="descicao"
                                label="Descrição da Área"
                                value={novaAreaData.descicao}
                                onChange={handleNovaAreaChange}
                                fullWidth
                                size="small"
                                required
                                multiline
                                rows={2}
                                placeholder="Ex: Inteligência Artificial, Desenvolvimento Web, Banco de Dados..."
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAreaModal}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateArea}
                            variant="contained"
                            color="primary"
                        >
                            Criar Área
                        </Button>
                    </DialogActions>
                </Dialog>

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
                            Deseja realmente remover este projeto TCC?
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
                            rows={projetos}
                            columns={columns}
                            pageSize={5}
                            checkboxSelection={false}
                            disableSelectionOnClick
                            getRowId={(row) => row.id}
                        />
                    </Box>
                )}
            </Stack>
        </Box>
    );
}