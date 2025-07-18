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
    Chip,
    Paper,
    LinearProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function Dicentes() {
    const [dicentes, setDicentes] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [cursoSelecionado, setCursoSelecionado] = useState('');
    const [formData, setFormData] = useState({
        matricula: "",
        nome: "",
        email: "",
    });
    const [openMessage, setOpenMessage] = React.useState(false);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [openDicenteModal, setOpenDicenteModal] = React.useState(false);
    const [openUploadModal, setOpenUploadModal] = React.useState(false);
    const [messageText, setMessageText] = React.useState("");
    const [messageSeverity, setMessageSeverity] = React.useState("success");
    const [dicenteDelete, setDicenteDelete] = React.useState(null);
    const [novoDicenteData, setNovoDicenteData] = useState({
        matricula: "",
        nome: "",
        email: "",
    });
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

    useEffect(() => {
        getCursos();
        getDicentes();
    }, []);

    useEffect(() => {
        if (cursoSelecionado) {
            // Para dicentes, vamos mostrar todos independente do curso
            // mas mantemos a seleção para futuras funcionalidades
            getDicentes();
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

    async function getDicentes() {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/dicentes`);
            const data = await response.json();
            setDicentes(data.dicentes || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de dicentes: ", error);
            setDicentes([]);
        }
    }

    function handleDelete(row) {
        setDicenteDelete(row.matricula);
        setOpenDialog(true);
    }

    function handleInputChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handleCursoChange(e) {
        setCursoSelecionado(e.target.value);
    }

    function handleNovoDicenteChange(e) {
        setNovoDicenteData({ ...novoDicenteData, [e.target.name]: e.target.value });
    }

    function handleOpenDicenteModal() {
        setOpenDicenteModal(true);
    }

    function handleCloseDicenteModal() {
        setOpenDicenteModal(false);
        setNovoDicenteData({
            matricula: "",
            nome: "",
            email: "",
        });
    }

    function handleOpenUploadModal() {
        setOpenUploadModal(true);
    }

    function handleCloseUploadModal() {
        setOpenUploadModal(false);
        setUploadFile(null);
        setUploadResults(null);
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setUploadFile(file);
        } else {
            setMessageText("Por favor, selecione um arquivo PDF válido!");
            setMessageSeverity("error");
            setOpenMessage(true);
        }
    }

    async function handleUploadPDF() {
        if (!uploadFile) {
            setMessageText("Por favor, selecione um arquivo PDF!");
            setMessageSeverity("error");
            setOpenMessage(true);
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('pdf', uploadFile);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/dicentes/processar-pdf`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setUploadResults(data);
                setMessageText(`PDF processado com sucesso! ${data.sucessos} dicentes inseridos, ${data.erros} erros.`);
                setMessageSeverity("success");
                // Atualiza a lista de dicentes
                await getDicentes();
            } else {
                throw new Error(data.message || "Erro ao processar PDF");
            }
        } catch (error) {
            console.log("Erro ao fazer upload do PDF:", error);
            setMessageText("Falha ao processar PDF!");
            setMessageSeverity("error");
        } finally {
            setUploading(false);
            setOpenMessage(true);
        }
    }

    async function handleCreateDicente() {
        try {
            if (!novoDicenteData.matricula || !novoDicenteData.nome || !novoDicenteData.email) {
                setMessageText("Por favor, preencha todos os campos obrigatórios!");
                setMessageSeverity("error");
                setOpenMessage(true);
                return;
            }

            // Converter matrícula para número
            const dicenteParaEnviar = {
                ...novoDicenteData,
                matricula: parseInt(novoDicenteData.matricula)
            };

            const response = await fetch(`${process.env.REACT_APP_API_URL}/dicentes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    formData: dicenteParaEnviar,
                }),
            });

            if (response.ok) {
                setMessageText("Dicente criado com sucesso!");
                setMessageSeverity("success");
                handleCloseDicenteModal();
                // Atualiza a lista de dicentes
                await getDicentes();
            } else {
                throw new Error("Erro ao criar dicente");
            }
        } catch (error) {
            console.log("Não foi possível criar o dicente no banco de dados", error);
            setMessageText("Falha ao criar dicente!");
            setMessageSeverity("error");
        } finally {
            setOpenMessage(true);
        }
    }

    function handleCancelClick() {
        setFormData({ matricula: "", nome: "", email: "" });
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
            if (!dicenteDelete) return;

            const response = await fetch(`${process.env.REACT_APP_API_URL}/dicentes/${dicenteDelete}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setMessageText("Dicente removido com sucesso!");
                setMessageSeverity("success");
                // Atualiza a lista
                await getDicentes();
            } else {
                throw new Error("Erro ao remover dicente");
            }
        } catch (error) {
            console.log("Não foi possível remover o dicente no banco de dados");
            setMessageText("Falha ao remover dicente!");
            setMessageSeverity("error");
        } finally {
            setDicenteDelete(null);
            setOpenDialog(false);
            setOpenMessage(true);
        }
    }

    function handleNoDeleteClick() {
        setOpenDialog(false);
        setDicenteDelete(null);
    }

    const columns = [
        { field: "matricula", headerName: "Matrícula", width: 150 },
        { field: "nome", headerName: "Nome", width: 350 },
        { field: "email", headerName: "Email", width: 300 },
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
                    Gerenciamento de Dicentes
                </Typography>

                <FormControl fullWidth size="small">
                    <InputLabel>Selecione um Curso</InputLabel>
                    <Select
                        value={cursoSelecionado}
                        label="Selecione um Curso"
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

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PersonAddIcon />}
                        onClick={handleOpenDicenteModal}
                    >
                        Adicionar Dicente
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CloudUploadIcon />}
                        onClick={handleOpenUploadModal}
                    >
                        Upload PDF Lista
                    </Button>
                </Stack>

                {/* Modal para criar novo dicente */}
                <Dialog
                    open={openDicenteModal}
                    onClose={handleCloseDicenteModal}
                    aria-labelledby="criar-dicente-title"
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle id="criar-dicente-title">
                        Criar Novo Dicente
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                name="matricula"
                                label="Matrícula"
                                value={novoDicenteData.matricula}
                                onChange={handleNovoDicenteChange}
                                fullWidth
                                size="small"
                                required
                            />
                            <TextField
                                name="nome"
                                label="Nome"
                                value={novoDicenteData.nome}
                                onChange={handleNovoDicenteChange}
                                fullWidth
                                size="small"
                                required
                            />
                            <TextField
                                name="email"
                                label="Email"
                                type="email"
                                value={novoDicenteData.email}
                                onChange={handleNovoDicenteChange}
                                fullWidth
                                size="small"
                                required
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDicenteModal}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateDicente}
                            variant="contained"
                            color="primary"
                        >
                            Criar Dicente
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal para upload de PDF */}
                <Dialog
                    open={openUploadModal}
                    onClose={handleCloseUploadModal}
                    aria-labelledby="upload-pdf-title"
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle id="upload-pdf-title">
                        Upload de Lista de Presença (PDF)
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Selecione um arquivo PDF de lista de presença para importar dicentes automaticamente.
                                O arquivo deve conter dados no formato: NOME seguido da MATRÍCULA.
                            </Typography>

                            <Box>
                                <input
                                    accept="application/pdf"
                                    style={{ display: 'none' }}
                                    id="raised-button-file"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="raised-button-file">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<CloudUploadIcon />}
                                        fullWidth
                                    >
                                        Selecionar Arquivo PDF
                                    </Button>
                                </label>
                            </Box>

                            {uploadFile && (
                                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Typography variant="body2">
                                        <strong>Arquivo selecionado:</strong> {uploadFile.name}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Tamanho:</strong> {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                    </Typography>
                                </Paper>
                            )}

                            {uploading && (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Processando PDF...
                                    </Typography>
                                    <LinearProgress />
                                </Box>
                            )}

                            {uploadResults && (
                                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                                    <Typography variant="h6" gutterBottom>
                                        Resultados do Processamento
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                        <Chip
                                            label={`Total: ${uploadResults.totalEncontrados}`}
                                            color="default"
                                            size="small"
                                        />
                                        <Chip
                                            label={`Sucessos: ${uploadResults.sucessos}`}
                                            color="success"
                                            size="small"
                                        />
                                        <Chip
                                            label={`Erros: ${uploadResults.erros}`}
                                            color="error"
                                            size="small"
                                        />
                                    </Stack>

                                    {uploadResults.detalhes && uploadResults.detalhes.length > 0 && (
                                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                            {uploadResults.detalhes.slice(0, 10).map((detalhe, index) => (
                                                <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                                                    <strong>{detalhe.matricula}</strong> - {detalhe.nome}:
                                                    <Chip
                                                        label={detalhe.status}
                                                        size="small"
                                                        color={
                                                            detalhe.status === 'inserido' ? 'success' :
                                                            detalhe.status === 'já_existe' ? 'warning' : 'error'
                                                        }
                                                        sx={{ ml: 1 }}
                                                    />
                                                </Typography>
                                            ))}
                                            {uploadResults.detalhes.length > 10 && (
                                                <Typography variant="body2" color="text.secondary">
                                                    ... e mais {uploadResults.detalhes.length - 10} registros
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseUploadModal}>
                            {uploadResults ? 'Fechar' : 'Cancelar'}
                        </Button>
                        {uploadFile && !uploading && !uploadResults && (
                            <Button
                                onClick={handleUploadPDF}
                                variant="contained"
                                color="primary"
                                startIcon={<CloudUploadIcon />}
                            >
                                Processar PDF
                            </Button>
                        )}
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
                            Deseja realmente remover este dicente?
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

                <Box style={{ height: "500px" }}>
                    <DataGrid
                        rows={dicentes}
                        columns={columns}
                        pageSize={10}
                        checkboxSelection={false}
                        disableSelectionOnClick
                        getRowId={(row) => row.matricula}
                    />
                </Box>
            </Stack>
        </Box>
    );
}