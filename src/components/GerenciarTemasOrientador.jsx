import React, { useState, useEffect } from "react";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";

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
import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import CustomDataGrid from "./CustomDataGrid";
import { usePermissions } from "../hooks/usePermissions";

export default function GerenciarTemasOrientador() {
    const { usuario } = useAuth();
    const [temas, setTemas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [cursoSelecionado, setCursoSelecionado] = useState("");
    const [areasTcc, setAreasTcc] = useState([]);
    const [formData, setFormData] = useState({
        descricao: "",
        id_area_tcc: "",
    });
    const [openMessage, setOpenMessage] = React.useState(false);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [openAreaModal, setOpenAreaModal] = React.useState(false);
    const [openVagasModal, setOpenVagasModal] = React.useState(false);
    const [messageText, setMessageText] = React.useState("");
    const [messageSeverity, setMessageSeverity] = React.useState("success");
    const [temaDelete, setTemaDelete] = React.useState(null);
    const [temaVagas, setTemaVagas] = React.useState({
        id: null,
        vagas: 0,
        codigoDocente: null,
        docenteNome: null,
    });
    const [novaAreaData, setNovaAreaData] = useState({
        descricao: "",
    });

    useEffect(() => {
        getCursosOrientador();
    }, []);

    useEffect(() => {
        if (cursoSelecionado) {
            getTemasPorCurso(cursoSelecionado);
            getAreasTccOrientador();
        } else {
            setTemas([]);
            setAreasTcc([]);
        }
    }, [cursoSelecionado]);

    async function getCursosOrientador() {
        try {
            const codigoDocente = usuario.codigo || usuario.id;
            // Buscar cursos do orientador logado
            const response = await axiosInstance.get(
                `/orientadores/docente/${codigoDocente}`
            );
            const cursosOrientador = response.orientacoes || [];
            setCursos(cursosOrientador.map((orientacao) => orientacao.curso));

            // Se o orientador possui apenas 1 curso, pré-selecionar
            if (cursosOrientador.length === 1) {
                setCursoSelecionado(cursosOrientador[0].curso.id);
            }
        } catch (error) {
            console.log(
                "Não foi possível retornar a lista de cursos do orientador: ",
                error
            );
            setCursos([]);
        }
    }

    async function getAreasTccOrientador() {
        try {
            const codigoDocente = usuario.codigo || usuario.id;
            const response = await axiosInstance.get(
                `/areas-tcc/docente/${codigoDocente}`
            );
            setAreasTcc(response.areas || []);
        } catch (error) {
            console.log(
                "Não foi possível retornar a lista de áreas TCC do orientador: ",
                error
            );
            setAreasTcc([]);
        }
    }

    async function getTemasPorCurso(idCurso) {
        try {
            const codigoDocente = usuario.codigo || usuario.id;
            // Buscar apenas os temas do orientador logado no curso selecionado
            const response = await axiosInstance.get(
                `/temas-tcc/docente/${codigoDocente}/curso/${idCurso}`
            );
            setTemas(response || []);
        } catch (error) {
            console.log(
                "Não foi possível retornar a lista de temas TCC do orientador: ",
                error
            );
            setTemas([]);
        }
    }

    function handleDelete(row) {
        setTemaDelete(row.id);
        setOpenDialog(true);
    }

    function handleOpenVagasModal(tema) {
        const codigoDocente = usuario.codigo || usuario.id;
        setTemaVagas({
            id: tema.id,
            vagas: tema.vagasOferta || tema.vagas || 0,
            codigoDocente: codigoDocente,
            docenteNome: usuario.nome,
        });
        setOpenVagasModal(true);
    }

    function handleCloseVagasModal() {
        setOpenVagasModal(false);
        setTemaVagas({
            id: null,
            vagas: 0,
            codigoDocente: null,
            docenteNome: null,
        });
    }

    async function handleUpdateVagas() {
        try {
            console.log(temaVagas);
            console.log("Usuario:", usuario);

            // Verificar se temos o código do docente
            const codigoDocente = usuario.codigo || usuario.id;
            if (!codigoDocente) {
                setMessageText("Erro: Código do docente não encontrado!");
                setMessageSeverity("error");
                setOpenMessage(true);
                return;
            }

            // Usar o endpoint específico para vagas da oferta do docente
            await axiosInstance.patch(
                `/temas-tcc/docente/${codigoDocente}/curso/${cursoSelecionado}/vagas`,
                {
                    vagas: temaVagas.vagas,
                }
            );

            setMessageText(`Vagas da sua oferta atualizadas com sucesso!`);
            setMessageSeverity("success");
            setOpenMessage(true);

            // Atualiza a lista
            if (cursoSelecionado) {
                await getTemasPorCurso(cursoSelecionado);
            }

            handleCloseVagasModal();
        } catch (error) {
            console.log("Não foi possível atualizar as vagas da oferta", error);
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
        });
    }

    function handleNovaAreaChange(e) {
        setNovaAreaData({ ...novaAreaData, [e.target.name]: e.target.value });
    }

    function handleOpenAreaModal() {
        setNovaAreaData({
            descricao: "",
        });
        setOpenAreaModal(true);
    }

    function handleCloseAreaModal() {
        setOpenAreaModal(false);
        setNovaAreaData({
            descricao: "",
        });
    }

    async function handleCreateArea() {
        try {
            if (!novaAreaData.descricao) {
                setMessageText("Por favor, preencha a descrição da área!");
                setMessageSeverity("error");
                setOpenMessage(true);
                return;
            }

            const codigoDocente = usuario.codigo || usuario.id;
            await axiosInstance.post("/areas-tcc", {
                formData: {
                    ...novaAreaData,
                    codigo_docente: codigoDocente,
                },
            });

            setMessageText("Área TCC criada com sucesso!");
            setMessageSeverity("success");
            handleCloseAreaModal();
            // Atualiza a lista de áreas TCC
            await getAreasTccOrientador();
        } catch (error) {
            console.log(
                "Não foi possível criar a área TCC no banco de dados",
                error
            );
            setMessageText("Falha ao criar área TCC!");
            setMessageSeverity("error");
        } finally {
            setOpenMessage(true);
        }
    }

    async function handleAddTema() {
        try {
            if (!formData.descricao || !formData.id_area_tcc) {
                setMessageText(
                    "Por favor, preencha todos os campos obrigatórios!"
                );
                setMessageSeverity("error");
                setOpenMessage(true);
                return;
            }

            const codigoDocente = usuario.codigo || usuario.id;
            const temaData = {
                ...formData,
                codigo_docente: codigoDocente,
            };

            await axiosInstance.post("/temas-tcc", temaData);

            setMessageText("Tema TCC adicionado com sucesso!");
            setMessageSeverity("success");
            setFormData({
                descricao: "",
                id_area_tcc: "",
            });

            // Atualiza a lista
            await getTemasPorCurso(cursoSelecionado);
        } catch (error) {
            console.log(
                "Não foi possível inserir o tema TCC no banco de dados"
            );
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

            await axiosInstance.delete(`/temas-tcc/${temaDelete}`);
            setMessageText("Tema TCC removido com sucesso!");
            setMessageSeverity("success");

            // Atualiza a lista
            if (cursoSelecionado) {
                await getTemasPorCurso(cursoSelecionado);
            }
        } catch (error) {
            console.log(
                "Não foi possível remover o tema TCC no banco de dados"
            );
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

    async function handleToggleAtivo(tema) {
        try {
            const novoStatus = !tema.ativo;

            await axiosInstance.put("/temas-tcc", {
                id: tema.id,
                ativo: novoStatus,
            });

            setMessageText(
                `Tema ${novoStatus ? "ativado" : "desativado"} com sucesso!`
            );
            setMessageSeverity("success");

            // Atualiza a lista
            if (cursoSelecionado) {
                await getTemasPorCurso(cursoSelecionado);
            }
        } catch (error) {
            console.log("Não foi possível alterar o status do tema");
            setMessageText("Falha ao alterar status do tema!");
            setMessageSeverity("error");
        } finally {
            setOpenMessage(true);
        }
    }

    // Preparar dados para o DataGrid
    const temasParaGrid = temas
        .map((tema) => ({
            ...tema,
            areaNome: tema?.AreaTcc?.descricao || "N/A",
            vagasOferta: tema?.vagasOferta || tema?.vagas || 0,
        }))
        .sort((a, b) => {
            // Ordenar por área TCC
            const areaA = a.areaNome || "";
            const areaB = b.areaNome || "";
            if (areaA !== areaB) {
                return areaA.localeCompare(areaB);
            }

            // Se mesma área, ordenar por descrição do tema
            return (a.descricao || "").localeCompare(b.descricao || "");
        });

    const { hasPermission } = usePermissions();

    const columns = [
        {
            field: "areaNome",
            headerName: "Área TCC",
            width: 200,
            renderCell: (params) => (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        lineHeight: "1.2",
                        width: "100%",
                        padding: "4px 0",
                    }}
                >
                    {params.value}
                </div>
            ),
        },
        {
            field: "descricao",
            headerName: "Descrição",
            width: 400,
            renderCell: (params) => (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        lineHeight: "1.2",
                        width: "100%",
                        padding: "4px 0",
                    }}
                >
                    {params.value}
                </div>
            ),
        },
        {
            field: "ativo",
            headerName: "Status",
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.row.ativo ? "Ativo" : "Inativo"}
                    color={params.row.ativo ? "success" : "default"}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            field: "vagasOferta",
            headerName: "Vagas",
            width: 200,
            renderCell: (params) => {
                const vagas = params.row.vagasOferta || 0;

                if (vagas === 0) {
                    return (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                fontSize: "0.75rem",
                                fontStyle: "italic",
                                textAlign: "center",
                                maxWidth: "180px",
                            }}
                        >
                            Converse com o coordenador sobre disponibilidade
                        </Typography>
                    );
                }

                return (
                    <Chip
                        label={vagas}
                        color="success"
                        size="small"
                        sx={{
                            fontWeight: "bold",
                            "& .MuiChip-label": {
                                fontSize: "0.875rem",
                            },
                        }}
                    />
                );
            },
        },
        {
            field: "actions",
            headerName: "Ações",
            sortable: false,
            width: 280,
            renderCell: (params) => (
                <PermissionContext
                    grupos={[Permissoes.GRUPOS.ORIENTADOR]}
                    showError={false}
                >
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
                            variant={
                                params.row.ativo ? "outlined" : "contained"
                            }
                            color={params.row.ativo ? "success" : "warning"}
                            onClick={() => handleToggleAtivo(params.row)}
                        >
                            {params.row.ativo ? "Ativo" : "Inativo"}
                        </Button>
                        <Button
                            size="small"
                            color="secondary"
                            onClick={() => handleDelete(params.row)}
                        >
                            Remover
                        </Button>
                    </Stack>
                </PermissionContext>
            ),
        },
    ];

    // Criar modelo de visibilidade das colunas baseado nas permissões
    const columnVisibilityModel = {
        actions: hasPermission([Permissoes.GRUPOS.ORIENTADOR]),
    };

    return (
        <Box>
            <Stack spacing={2}>
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
                    <PermissionContext
                        grupos={[Permissoes.GRUPOS.ORIENTADOR]}
                        showError={false}
                    >
                        <Typography variant="h6" component="h3">
                            Adicionar Novo Tema TCC
                        </Typography>

                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                            >
                                <FormControl fullWidth size="small">
                                    <InputLabel>Área TCC</InputLabel>
                                    <Select
                                        name="id_area_tcc"
                                        value={formData.id_area_tcc}
                                        label="Área TCC"
                                        onChange={handleInputChange}
                                    >
                                        {areasTcc.map((area) => (
                                            <MenuItem
                                                key={area.id}
                                                value={area.id}
                                            >
                                                {area.descricao}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={handleOpenAreaModal}
                                    sx={{
                                        minWidth: "auto",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Nova Área
                                </Button>
                            </Stack>

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
                    </PermissionContext>
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
                                name="descricao"
                                label="Descrição da Área"
                                value={novaAreaData.descricao}
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
                        <Button onClick={handleCloseAreaModal}>Cancelar</Button>
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
                                Editando vagas da sua oferta no curso
                                selecionado.
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Nota: As vagas são por oferta do docente, não
                                por tema individual. Alterar aqui afetará todos
                                os seus temas neste curso.
                            </Typography>
                            <TextField
                                label="Número de Vagas da Oferta"
                                type="number"
                                value={temaVagas.vagas}
                                onChange={(e) =>
                                    setTemaVagas({
                                        ...temaVagas,
                                        vagas: parseInt(e.target.value) || 0,
                                    })
                                }
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
                        <Button onClick={handleNoDeleteClick}>Cancelar</Button>
                        <Button onClick={handleDeleteClick} autoFocus>
                            Confirmar
                        </Button>
                    </DialogActions>
                </Dialog>

                {cursoSelecionado && (
                    <>
                        <Typography variant="body2" color="text.secondary">
                            Total: {temas.length} tema(s) •{" "}
                            {
                                Object.keys(
                                    temas.reduce((acc, tema) => {
                                        const idArea =
                                            tema.AreaTcc?.id || "sem-area";
                                        acc[idArea] = true;
                                        return acc;
                                    }, {})
                                ).length
                            }{" "}
                            área(s)
                        </Typography>

                        <CustomDataGrid
                            rows={temasParaGrid}
                            columns={columns}
                            pageSize={10}
                            checkboxSelection={false}
                            disableSelectionOnClick
                            getRowId={(row) => row.id}
                            getRowHeight={() => "auto"}
                            columnVisibilityModel={columnVisibilityModel}
                        />
                    </>
                )}
            </Stack>
        </Box>
    );
}
