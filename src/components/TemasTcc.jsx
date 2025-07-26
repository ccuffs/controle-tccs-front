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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

export default function TemasTcc() {
    const [temas, setTemas] = useState([]);
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
    const [openVagasModal, setOpenVagasModal] = React.useState(false);
    const [messageText, setMessageText] = React.useState("");
    const [messageSeverity, setMessageSeverity] = React.useState("success");
    const [temaDelete, setTemaDelete] = React.useState(null);
    const [temaVagas, setTemaVagas] = React.useState({ id: null, vagas: 0, codigoDocente: null, docenteNome: null });
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
            getTemasPorCurso(cursoSelecionado);
        } else {
            setDocentesOrientadores([]);
            setTemas([]);
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

    async function getTemasPorCurso(idCurso) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/temas-tcc/curso/${idCurso}`);
            const data = await response.json();
            setTemas(data || []);
        } catch (error) {
            console.log("Não foi possível retornar a lista de temas TCC: ", error);
            setTemas([]);
        }
    }

    function handleDelete(row) {
        setTemaDelete(row.id);
        setOpenDialog(true);
    }

    function handleOpenVagasModal(tema) {
        setTemaVagas({
            id: tema.id,
            vagas: tema.vagasOferta || tema.vagas || 0,
            codigoDocente: tema.codigo_docente,
            docenteNome: tema.docenteNome
        });
        setOpenVagasModal(true);
    }

    function handleCloseVagasModal() {
        setOpenVagasModal(false);
        setTemaVagas({ id: null, vagas: 0, codigoDocente: null, docenteNome: null });
    }

    async function handleUpdateVagas() {
        try {
            // Usar o novo endpoint específico para vagas da oferta do docente
            await fetch(`${process.env.REACT_APP_API_URL}/temas-tcc/docente/${temaVagas.codigoDocente}/curso/${cursoSelecionado}/vagas`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ vagas: temaVagas.vagas }),
            });

            setMessageText(`Vagas da oferta do ${temaVagas.docenteNome} atualizadas com sucesso!`);
            setMessageSeverity("success");
            setOpenMessage(true);

            // Atualiza a lista
            if (cursoSelecionado) {
                await getTemasPorCurso(cursoSelecionado);
            }

            handleCloseVagasModal();
        } catch (error) {
            console.log("Não foi possível atualizar as vagas da oferta");
            setMessageText("Falha ao atualizar vagas da oferta!");
            setMessageSeverity("error");
            setOpenMessage(true);
        }
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

    async function handleAddTema() {
        try {
            if (!formData.descricao || !formData.id_area_tcc || !formData.codigo_docente) {
                setMessageText("Por favor, preencha todos os campos obrigatórios!");
                setMessageSeverity("error");
                setOpenMessage(true);
                return;
            }

            await fetch(`${process.env.REACT_APP_API_URL}/temas-tcc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            setMessageText("Tema TCC adicionado com sucesso!");
            setMessageSeverity("success");
            setFormData({
                descricao: "",
                id_area_tcc: "",
                codigo_docente: "",
            });

            // Atualiza a lista
            await getTemasPorCurso(cursoSelecionado);
        } catch (error) {
            console.log("Não foi possível inserir o tema TCC no banco de dados");
            setMessageText("Falha ao gravar tema TCC!");
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
            if (!temaDelete) return;

            await fetch(`${process.env.REACT_APP_API_URL}/temas-tcc/${temaDelete}`, {
                method: "DELETE",
            });
            setMessageText("Tema TCC removido com sucesso!");
            setMessageSeverity("success");

            // Atualiza a lista
            if (cursoSelecionado) {
                await getTemasPorCurso(cursoSelecionado);
            }
        } catch (error) {
            console.log("Não foi possível remover o tema TCC no banco de dados");
            setMessageText("Falha ao remover tema TCC!");
            setMessageSeverity("error");
        } finally {
            setTemaDelete(null);
            setOpenDialog(false);
            setOpenMessage(true);
        }
    }

    function handleNoDeleteClick() {
        setOpenDialog(false);
        setTemaDelete(null);
    }

        // Função para agrupar temas por docente e área TCC
    const agruparTemasPorDocente = (temas) => {
        const grupos = {};

        temas.forEach(tema => {
            const codigoDocente = tema.Docente?.codigo || 'sem-docente';
            const nomeDocente = tema.Docente?.nome || 'N/A';
            const idAreaTcc = tema.AreaTcc?.id || 'sem-area';
            const nomeAreaTcc = tema.AreaTcc?.descicao || 'N/A';

            if (!grupos[codigoDocente]) {
                grupos[codigoDocente] = {
                    docente: nomeDocente,
                    areas: {}
                };
            }

            if (!grupos[codigoDocente].areas[idAreaTcc]) {
                grupos[codigoDocente].areas[idAreaTcc] = {
                    area: nomeAreaTcc,
                    temas: []
                };
            }

            grupos[codigoDocente].areas[idAreaTcc].temas.push(tema);
        });

        // Converte para array e prepara dados para o DataGrid
        const dadosGrid = [];
        Object.keys(grupos).forEach(codigoDocente => {
            const grupoDocente = grupos[codigoDocente];
            let isFirstDocenteGroup = true;

            Object.keys(grupoDocente.areas).forEach(idArea => {
                const grupoArea = grupoDocente.areas[idArea];
                let isFirstAreaGroup = true;

                                 grupoArea.temas.forEach((tema) => {
                     const vagasOferta = tema.vagasOferta || tema.vagas || 0;
                     dadosGrid.push({
                         ...tema,
                         isFirstDocenteGroup: isFirstDocenteGroup,
                         isFirstAreaGroup: isFirstAreaGroup,
                         docenteNome: grupoDocente.docente,
                         areaNome: grupoArea.area,
                         vagasOferta: vagasOferta // Usa vagas da oferta ou fallback para vagas do tema
                     });
                     isFirstDocenteGroup = false;
                     isFirstAreaGroup = false;
                 });
            });
        });

        return dadosGrid;
    };

    const temasAgrupados = agruparTemasPorDocente(temas);

    const columns = [
        { field: "id", headerName: "ID", width: 70 },
                {
            field: "docente_nome",
            headerName: "Docente Responsável",
            width: 250,
            renderCell: (params) => {
                // Só mostra o nome na primeira linha do grupo do docente
                if (params.row.isFirstDocenteGroup) {
                    return (
                        <Box sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                            borderLeft: '3px solid',
                            borderColor: 'primary.main',
                            paddingLeft: 1
                        }}>
                            {params.row.docenteNome}
                        </Box>
                    );
                }
                return '';
            }
        },
        {
            field: "area_nome",
            headerName: "Área TCC",
            width: 200,
            renderCell: (params) => {
                // Só mostra o nome na primeira linha do grupo da área
                if (params.row.isFirstAreaGroup) {
                    return (
                        <Box sx={{
                            fontWeight: 'bold',
                            color: 'secondary.main',
                            borderLeft: '3px solid',
                            borderColor: 'secondary.main',
                            paddingLeft: 1
                        }}>
                            {params.row.areaNome}
                        </Box>
                    );
                }
                return '';
            }
        },
        { field: "descricao", headerName: "Descrição", width: 350 },
        {
            field: "vagas",
            headerName: "Vagas",
            width: 200,
            renderCell: (params) => {
                // Só mostra as vagas na primeira linha do grupo do docente (pois vagas são por oferta do docente, não por tema)
                if (params.row.isFirstDocenteGroup) {
                    const vagas = params.row.vagasOferta || 0;

                    if (vagas === 0) {
                        return (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontSize: '0.75rem',
                                    fontStyle: 'italic',
                                    textAlign: 'center',
                                    maxWidth: '180px'
                                }}
                            >
                                Converse com o orientador sobre disponibilidade
                            </Typography>
                        );
                    }

                    return (
                        <Chip
                            label={vagas}
                            color="success"
                            size="small"
                            sx={{
                                fontWeight: 'bold',
                                '& .MuiChip-label': {
                                    fontSize: '0.875rem'
                                }
                            }}
                        />
                    );
                }
                return '';
            },
        },
        {
            field: "actions",
            headerName: "Ações",
            sortable: false,
            width: 200,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleOpenVagasModal(params.row)}
                    >
                        Vagas
                    </Button>
                    <Button
                        size="small"
                        color="secondary"
                        onClick={() => handleDelete(params.row)}
                    >
                        Remover
                    </Button>
                </Stack>
            ),
        },
    ];

    return (
        <Box>
            <Stack spacing={2}>
                <Typography variant="h5" component="h2">
                    Temas TCC por Curso
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
                            Adicionar Novo Tema TCC
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
                                label="Descrição do Tema"
                                value={formData.descricao}
                                onChange={handleInputChange}
                                fullWidth
                                size="small"
                                multiline
                                rows={3}
                                placeholder="Descreva o tema TCC..."
                            />

                            <Stack spacing={2} direction="row">
                                <Button
                                    color="primary"
                                    variant="contained"
                                    onClick={handleAddTema}
                                >
                                    Adicionar Tema
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

                {/* Modal para atualizar vagas */}
                <Dialog
                    open={openVagasModal}
                    onClose={handleCloseVagasModal}
                    aria-labelledby="atualizar-vagas-title"
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle id="atualizar-vagas-title">
                        Atualizar Vagas da Oferta
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Editando vagas da oferta do docente: <strong>{temaVagas.docenteNome}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Nota: As vagas são por oferta do docente, não por tema individual.
                                Alterar aqui afetará todos os temas deste docente.
                            </Typography>
                            <TextField
                                label="Número de Vagas da Oferta"
                                type="number"
                                value={temaVagas.vagas}
                                onChange={(e) => setTemaVagas({...temaVagas, vagas: parseInt(e.target.value) || 0})}
                                fullWidth
                                size="small"
                                inputProps={{ min: 0 }}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseVagasModal}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdateVagas}
                            variant="contained"
                            color="primary"
                        >
                            Atualizar Vagas
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
                            Deseja realmente remover este tema TCC?
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
                    <>
                        <Typography variant="body2" color="text.secondary">
                            Total: {temas.length} tema(s) • {Object.keys(temas.reduce((acc, tema) => {
                                const codigo = tema.Docente?.codigo || 'sem-docente';
                                acc[codigo] = true;
                                return acc;
                            }, {})).length} docente(s) • {Object.keys(temas.reduce((acc, tema) => {
                                const idArea = tema.AreaTcc?.id || 'sem-area';
                                acc[idArea] = true;
                                return acc;
                            }, {})).length} área(s)
                        </Typography>

                        <Box style={{ height: "500px" }}>
                            <DataGrid
                                rows={temasAgrupados}
                                columns={columns}
                                pageSize={10}
                                checkboxSelection={false}
                                disableSelectionOnClick
                                getRowId={(row) => row.id}
                                sx={{
                                    '& .MuiDataGrid-row': {
                                        '&:not(:first-of-type)': {
                                            '& .MuiDataGrid-cell:first-of-type': {
                                                borderTop: 'none',
                                            }
                                        }
                                    },

                                }}
                                // getRowClassName removido para manter aparência padrão
                            />
                        </Box>
                    </>
                )}
            </Stack>
        </Box>
    );
}