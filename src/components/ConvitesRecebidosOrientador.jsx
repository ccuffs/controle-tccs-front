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
    Typography,
    Chip,
} from "@mui/material";
import PermissionContext from "../contexts/PermissionContext";
import { Permissoes } from "../enums/permissoes";
import axiosInstance from "../auth/axios";
import { useAuth } from "../contexts/AuthContext";
import CustomDataGrid from "./CustomDataGrid";

export default function ConvitesRecebidosOrientador() {
    const { usuario } = useAuth();
    const [convites, setConvites] = useState([]);
    const [openMessage, setOpenMessage] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [messageSeverity, setMessageSeverity] = useState("success");
    const [conviteSelecionado, setConviteSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (usuario?.id) {
            getData();
        }
    }, [usuario]);

    async function getData() {
        try {
            setLoading(true);
            // Buscar convites do orientador logado
            if (usuario?.id) {
                const response = await axiosInstance.get(
                    `/convites/docente/${usuario.id}`
                );
                setConvites(response?.convites || []);
            } else {
                setConvites([]);
            }
        } catch (error) {
            console.log(
                "Não foi possível retornar a lista de convites: ",
                error
            );
            setConvites([]);
        } finally {
            setLoading(false);
        }
    }

    function handleResponderConvite(convite, aceito) {
        console.log("handleResponderConvite - Convite:", convite);
        console.log("handleResponderConvite - Aceito:", aceito);
        setConviteSelecionado({ ...convite, acao: aceito });
        setOpenDialog(true);
    }

    function handleCloseMessage(_, reason) {
        if (reason === "clickaway") {
            return;
        }
        setOpenMessage(false);
    }

    function handleClose() {
        setOpenDialog(false);
        setConviteSelecionado(null);
    }

    async function handleConfirmarResposta() {
        try {
            const { id_tcc, codigo_docente, acao } = conviteSelecionado;
            console.log("Frontend - Responder convite:", {
                id_tcc,
                codigo_docente,
                acao,
            });

            const response = await axiosInstance.put(
                `/convites/${id_tcc}/${codigo_docente}`,
                {
                    aceito: acao,
                }
            );

            console.log("Frontend - Resposta da API:", response);

            setMessageText(
                `Convite ${acao ? "aceito" : "rejeitado"} com sucesso!`
            );
            setMessageSeverity("success");
        } catch (error) {
            console.log("Não foi possível responder ao convite: ", error);
            console.log(
                "Erro completo:",
                error.response?.data || error.message
            );
            setMessageText("Falha ao responder ao convite!");
            setMessageSeverity("error");
        } finally {
            setOpenDialog(false);
            setConviteSelecionado(null);
            setOpenMessage(true);
            await getData();
        }
    }

    function handleCancelarResposta() {
        setOpenDialog(false);
        setConviteSelecionado(null);
    }

    // Preparar dados para o DataGrid seguindo o padrão do TemasDataGridDiscente
    const convitesParaGrid = convites
        .map((convite) => {
            return {
                ...convite,
                nomeDicente: convite?.TrabalhoConclusao?.Dicente?.nome || "N/A",
                matriculaDicente:
                    convite?.TrabalhoConclusao?.Dicente?.matricula || "N/A",
                tituloTcc: convite?.TrabalhoConclusao?.titulo || "N/A",
                nomeCurso: convite?.TrabalhoConclusao?.Curso?.nome || "N/A",
                mensagemEnvio: convite?.mensagem_envio || "Sem mensagem",
                dataEnvio: convite?.data_envio
                    ? new Date(convite.data_envio).toLocaleDateString("pt-BR")
                    : "N/A",
                dataFeedback: convite?.data_feedback
                    ? new Date(convite.data_feedback).toLocaleDateString(
                          "pt-BR"
                      )
                    : null,
                // Determinar se o convite foi respondido baseado na data_feedback
                foiRespondido: !!convite?.data_feedback,
            };
        })
        .sort((a, b) => {
            // Primeiro ordenar por status (não respondidos primeiro)
            const statusA = a.foiRespondido ? 1 : 0;
            const statusB = b.foiRespondido ? 1 : 0;
            if (statusA !== statusB) {
                return statusA - statusB;
            }

            // Se mesmo status, ordenar por nome do estudante
            const nomeA = a.nomeDicente || "";
            const nomeB = b.nomeDicente || "";
            if (nomeA !== nomeB) {
                return nomeA.localeCompare(nomeB);
            }

            // Se mesmo estudante, ordenar por data de envio
            return new Date(a.data_envio || 0) - new Date(b.data_envio || 0);
        });

    const columns = [
        {
            field: "nomeDicente",
            headerName: "Estudante",
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
            field: "matriculaDicente",
            headerName: "Matrícula",
            width: 120,
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
            field: "nomeCurso",
            headerName: "Curso",
            width: 150,
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
            field: "mensagemEnvio",
            headerName: "Mensagem",
            width: 500,
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
            field: "dataEnvio",
            headerName: "Data do Convite",
            width: 150,
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
            field: "status",
            headerName: "Status",
            width: 120,
            renderCell: (params) => {
                // Se não foi respondido (sem data_feedback), mostrar como pendente
                if (!params.row.foiRespondido) {
                    return (
                        <Chip label="Pendente" color="warning" size="small" />
                    );
                }

                // Se foi respondido, verificar se foi aceito ou rejeitado
                const status = params.row.aceito;
                if (status === true) {
                    return <Chip label="Aceito" color="success" size="small" />;
                } else {
                    return (
                        <Chip label="Rejeitado" color="error" size="small" />
                    );
                }
            },
        },
        {
            field: "actions",
            headerName: "Ações",
            sortable: false,
            width: 200,
            renderCell: (params) => {
                // Se foi respondido (tem data_feedback), mostrar mensagem
                if (params.row.foiRespondido) {
                    return (
                        <Typography variant="body2" color="text.secondary">
                            Já respondido
                        </Typography>
                    );
                }

                // Se não foi respondido, mostrar as ações
                return (
                    <PermissionContext
                        permissoes={[Permissoes.TRABALHO_CONCLUSAO.EDITAR]}
                        showError={false}
                    >
                        <Stack direction="row" spacing={1}>
                            <Button
                                color="primary"
                                variant="contained"
                                size="small"
                                onClick={() =>
                                    handleResponderConvite(params.row, true)
                                }
                            >
                                Aceitar
                            </Button>
                            <Button
                                color="error"
                                variant="outlined"
                                size="small"
                                onClick={() =>
                                    handleResponderConvite(params.row, false)
                                }
                            >
                                Rejeitar
                            </Button>
                        </Stack>
                    </PermissionContext>
                );
            },
        },
    ];

    return (
        <Box>
            <Typography variant="h6" component="h2" gutterBottom>
                Convites de Estudantes
            </Typography>

            <Stack spacing={2}>
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
                        {"Confirmar Resposta"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            {conviteSelecionado && (
                                <>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Estudante:</strong>{" "}
                                        {
                                            conviteSelecionado.TrabalhoConclusao
                                                ?.Dicente?.nome
                                        }
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Matrícula:</strong>{" "}
                                        {
                                            conviteSelecionado.TrabalhoConclusao
                                                ?.Dicente?.matricula
                                        }
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Título do TCC:</strong>{" "}
                                        {
                                            conviteSelecionado.TrabalhoConclusao
                                                ?.titulo
                                        }
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Curso:</strong>{" "}
                                        {
                                            conviteSelecionado.TrabalhoConclusao
                                                ?.Curso?.nome
                                        }
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Mensagem:</strong>{" "}
                                        {conviteSelecionado.mensagem_envio ||
                                            "Sem mensagem"}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        color="primary"
                                        sx={{ mt: 2 }}
                                    >
                                        Deseja realmente{" "}
                                        <strong>
                                            {conviteSelecionado.acao
                                                ? "aceitar"
                                                : "rejeitar"}
                                        </strong>{" "}
                                        este convite?
                                    </Typography>
                                </>
                            )}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancelarResposta}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmarResposta}
                            autoFocus
                            color={
                                conviteSelecionado?.acao ? "success" : "error"
                            }
                            variant="contained"
                        >
                            {conviteSelecionado?.acao ? "Aceitar" : "Rejeitar"}
                        </Button>
                    </DialogActions>
                </Dialog>

                <PermissionContext
                    permissoes={[
                        Permissoes.ORIENTACAO.VISUALIZAR,
                        Permissoes.ORIENTACAO.VISUALIZAR_TODOS,
                    ]}
                >
                    <Box style={{ height: "500px" }}>
                        {convitesParaGrid.length > 0 ? (
                            <>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    Total de convites: {convitesParaGrid.length}
                                </Typography>
                                <CustomDataGrid
                                    rows={convitesParaGrid}
                                    columns={columns}
                                    pageSize={5}
                                    checkboxSelection={false}
                                    disableSelectionOnClick
                                    rowSpanning
                                    getRowId={(row) => {
                                        return row.id_tcc;
                                    }}
                                    getRowHeight={() => "auto"}
                                    loading={loading}
                                    localeText={{
                                        noRowsLabel:
                                            "Nenhum convite encontrado",
                                        loadingOverlay:
                                            "Carregando convites...",
                                    }}
                                />
                            </>
                        ) : (
                            <Typography variant="body1" color="text.secondary">
                                Nenhum convite encontrado
                            </Typography>
                        )}
                    </Box>
                </PermissionContext>
            </Stack>
        </Box>
    );
}
