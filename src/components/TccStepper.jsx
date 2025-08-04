import React, { useState, useEffect, useContext } from "react";
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    TextField,
    Paper,
    Alert,
    Snackbar,
    CircularProgress,
    LinearProgress,
} from "@mui/material";
import axiosInstance from "../auth/axios";
import { AuthContext } from "../contexts/AuthContext";
import VisualizarTemasTCC from "./VisualizarTemasTCC";
import ConviteOrientadorModal from "./ConviteOrientadorModal";

const steps = ["1", "2", "3", "4"];

export default function TccStepper({ etapaInicial = 0, onEtapaChange }) {
    const { usuario } = useContext(AuthContext);
    const [activeStep, setActiveStep] = useState(etapaInicial);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [trabalhoConclusao, setTrabalhoConclusao] = useState(null);
    const [ofertaAtual, setOfertaAtual] = useState(null);
    const [formData, setFormData] = useState({
        tema: "",
        titulo: "",
        resumo: "",
    });
    const [openMessage, setOpenMessage] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [messageSeverity, setMessageSeverity] = useState("success");
    const [openConviteModal, setOpenConviteModal] = useState(false);
    const [conviteExistente, setConviteExistente] = useState(null);

    useEffect(() => {
        if (usuario) {
            carregarTrabalhoConclusao();
        }
    }, [usuario]);

    useEffect(() => {
        setActiveStep(etapaInicial);
    }, [etapaInicial]);

    const carregarTrabalhoConclusao = async () => {
        try {
            setLoading(true);

            // Primeiro, buscar a última oferta TCC
            const responseOferta = await axiosInstance.get(
                "/ofertas-tcc/ultima"
            );
            setOfertaAtual(responseOferta);

            // Buscar o discente pelo id_usuario
            const responseDiscente = await axiosInstance.get(
                `/dicentes/usuario/${usuario.id}`
            );

            if (responseDiscente && responseDiscente.matricula) {
                // Buscar o trabalho de conclusão do discente
                const responseTcc = await axiosInstance.get(
                    `/trabalho-conclusao/discente/${responseDiscente.matricula}`
                );

                if (responseTcc) {
                    setTrabalhoConclusao(responseTcc);
                    setFormData({
                        tema: responseTcc.tema || "",
                        titulo: responseTcc.titulo || "",
                        resumo: responseTcc.resumo || "",
                    });
                    // Usar a etapa do banco de dados
                    const etapaBanco = responseTcc.etapa || 0;
                    setActiveStep(etapaBanco);
                    if (onEtapaChange) {
                        onEtapaChange(etapaBanco);
                    }

                    // Carregar convite existente se houver
                    await carregarConviteExistente(responseTcc.id);
                } else {
                    // Criar novo trabalho de conclusão se não existir
                    await criarNovoTrabalhoConclusao(
                        responseDiscente.matricula
                    );
                }
            } else {
                setMessageText(
                    "Usuário não possui matrícula de discente associada!"
                );
                setMessageSeverity("error");
                setOpenMessage(true);
            }
        } catch (error) {
            console.error("Erro ao carregar trabalho de conclusão:", error);
            setMessageText("Erro ao carregar dados do TCC!");
            setMessageSeverity("error");
            setOpenMessage(true);
        } finally {
            setLoading(false);
        }
    };

    const carregarConviteExistente = async (idTcc) => {
        try {
            const params = new URLSearchParams();
            params.append('id_tcc', idTcc);
            const response = await axiosInstance.get(`/convites?${params.toString()}`);
            const convites = response.data?.convites || response.convites || [];
            if (convites.length > 0) {
                setConviteExistente(convites[0]);
            }
            console.log("Convite existente:", convites);
        } catch (error) {
            console.error("Erro ao carregar convite existente:", error);
        }
    };

    const criarNovoTrabalhoConclusao = async (matricula) => {
        try {
            const novoTcc = {
                matricula: matricula,
                tema: "",
                titulo: "",
                resumo: "",
                etapa: 0, // Começar na etapa 0 (visualização de temas)
                // ano, semestre, id_curso e fase serão obtidos automaticamente da última oferta TCC
            };

            const response = await axiosInstance.post(
                "/trabalho-conclusao",
                novoTcc
            );
            setTrabalhoConclusao(response);
            setActiveStep(0);
            if (onEtapaChange) {
                onEtapaChange(0);
            }

            // Carregar convites após criar o TCC
            await carregarConviteExistente(response.id);
        } catch (error) {
            console.error("Erro ao criar trabalho de conclusão:", error);
            setMessageText("Erro ao criar novo TCC!");
            setMessageSeverity("error");
            setOpenMessage(true);
        }
    };

    const validarEtapaAtual = () => {
        switch (activeStep) {
            case 0:
                // Na etapa 0, só pode avançar se tiver um convite aceito
                return conviteExistente && conviteExistente.aceito === true;
            case 1:
                return formData.tema && formData.tema.trim().length > 0;
            case 2:
                return formData.titulo && formData.titulo.trim().length > 0;
            case 3:
                return formData.resumo && formData.resumo.trim().length > 0;
            default:
                return true;
        }
    };

    const handleNext = async () => {
        // Validar se os campos da etapa atual estão preenchidos
        if (!validarEtapaAtual()) {
            setMessageText(
                "Por favor, preencha todos os campos obrigatórios antes de continuar."
            );
            setMessageSeverity("warning");
            setOpenMessage(true);
            return;
        }

        try {
            if (activeStep === 0) {
                // Etapa 0: apenas avançar, não salvar
                const novaEtapa = activeStep + 1;
                setActiveStep(novaEtapa);
                if (onEtapaChange) {
                    onEtapaChange(novaEtapa);
                }
            } else if (activeStep === steps.length - 1) {
                // Última etapa - salvar tudo
                const sucesso = await salvarTrabalhoConclusao();
                if (sucesso) {
                    const novaEtapa = activeStep + 1;
                    setActiveStep(novaEtapa);
                    if (onEtapaChange) {
                        onEtapaChange(novaEtapa);
                    }
                }
            } else {
                // Avançar para próxima etapa
                const sucesso = await salvarEtapaAtual();
                if (sucesso) {
                    const novaEtapa = activeStep + 1;
                    setActiveStep(novaEtapa);
                    if (onEtapaChange) {
                        onEtapaChange(novaEtapa);
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao avançar etapa:", error);
            setMessageText(
                "Erro ao salvar dados. Verifique sua conexão e tente novamente."
            );
            setMessageSeverity("error");
            setOpenMessage(true);
        }
    };

    const handleBack = async () => {
        const novaEtapa = activeStep - 1;
        setActiveStep(novaEtapa);

        // Atualizar etapa no banco de dados (exceto se voltando para etapa 0)
        if (trabalhoConclusao && trabalhoConclusao.id && novaEtapa > 0) {
            try {
                const dadosAtualizados = {
                    ...trabalhoConclusao,
                    ...formData,
                    etapa: novaEtapa,
                };

                await axiosInstance.put(
                    `/trabalho-conclusao/${trabalhoConclusao.id}`,
                    dadosAtualizados
                );
                setTrabalhoConclusao(dadosAtualizados);

                // Notificar componente pai sobre mudança de etapa
                if (onEtapaChange) {
                    onEtapaChange(novaEtapa);
                }
            } catch (error) {
                console.error("Erro ao atualizar etapa ao voltar:", error);
                // Em caso de erro, não impede o usuário de voltar
            }
        } else {
            // Se voltando para etapa 0, apenas notificar
            if (onEtapaChange) {
                onEtapaChange(novaEtapa);
            }
        }
    };

    const salvarEtapaAtual = async () => {
        if (!trabalhoConclusao || !trabalhoConclusao.id) {
            setMessageText(
                "Erro: Trabalho de conclusão não encontrado. Recarregue a página."
            );
            setMessageSeverity("error");
            setOpenMessage(true);
            return false;
        }

        try {
            setSaving(true);
            const dadosAtualizados = {
                ...trabalhoConclusao,
                ...formData,
                etapa: activeStep,
            };

            await axiosInstance.put(
                `/trabalho-conclusao/${trabalhoConclusao.id}`,
                dadosAtualizados
            );
            setTrabalhoConclusao(dadosAtualizados);

            // Notificar componente pai sobre mudança de etapa
            if (onEtapaChange) {
                onEtapaChange(activeStep);
            }

            setMessageText("Etapa salva com sucesso!");
            setMessageSeverity("success");
            setOpenMessage(true);

            return true;
        } catch (error) {
            console.error("Erro ao salvar etapa:", error);
            setMessageText("Erro ao salvar etapa atual!");
            setMessageSeverity("error");
            setOpenMessage(true);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const salvarTrabalhoConclusao = async () => {
        if (!trabalhoConclusao || !trabalhoConclusao.id) {
            setMessageText(
                "Erro: Trabalho de conclusão não encontrado. Recarregue a página."
            );
            setMessageSeverity("error");
            setOpenMessage(true);
            return false;
        }

        try {
            setSaving(true);
            const dadosAtualizados = {
                ...trabalhoConclusao,
                ...formData,
                etapa: steps.length,
            };

            await axiosInstance.put(
                `/trabalho-conclusao/${trabalhoConclusao.id}`,
                dadosAtualizados
            );
            setTrabalhoConclusao(dadosAtualizados);

            // Notificar componente pai sobre mudança de etapa
            if (onEtapaChange) {
                onEtapaChange(steps.length);
            }

            setMessageText("TCC salvo com sucesso!");
            setMessageSeverity("success");
            setOpenMessage(true);

            return true;
        } catch (error) {
            console.error("Erro ao salvar TCC:", error);
            setMessageText("Erro ao salvar TCC!");
            setMessageSeverity("error");
            setOpenMessage(true);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleOpenConviteModal = () => {
        setOpenConviteModal(true);
    };

    const handleCloseConviteModal = () => {
        setOpenConviteModal(false);
    };

    const handleConviteEnviado = async () => {
        if (trabalhoConclusao) {
            await carregarConviteExistente(trabalhoConclusao.id);
        }
        setMessageText("Convite enviado com sucesso!");
        setMessageSeverity("success");
        setOpenMessage(true);
    };

    const handleCloseMessage = (_, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setOpenMessage(false);
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ mt: 2 }}>
                        {/* Seção de Convite para Orientador - Posicionada acima do VisualizarTemasTCC */}
                        {trabalhoConclusao && (
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Convite para Orientador
                                </Typography>

                                {conviteExistente ? (
                                    <Box>
                                        <Alert
                                            severity={conviteExistente.aceito ? "success" : "warning"}
                                            sx={{ mb: 2 }}
                                        >
                                            <Typography variant="body2">
                                                <strong>Status do Convite:</strong> {conviteExistente.aceito ? "Aceito" : "Pendente"}
                                            </Typography>
                                            {conviteExistente.data_envio && (
                                                <Typography variant="body2">
                                                    <strong>Enviado em:</strong> {new Date(conviteExistente.data_envio).toLocaleDateString('pt-BR')}
                                                </Typography>
                                            )}
                                            {conviteExistente.Docente && (
                                                <Typography variant="body2">
                                                    <strong>Orientador:</strong> {conviteExistente.Docente.nome}
                                                </Typography>
                                            )}
                                        </Alert>

                                        <Button
                                            variant="outlined"
                                            onClick={handleOpenConviteModal}
                                            disabled={conviteExistente.aceito}
                                        >
                                            {conviteExistente.aceito ? "Convite Aceito" : "Ver Detalhes do Convite"}
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box>
                                        {conviteExistente && !conviteExistente.aceito ? (
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                <Typography variant="body2">
                                                    Você já possui um convite pendente para um orientador.
                                                    Aguarde a resposta antes de prosseguir com o TCC.
                                                </Typography>
                                            </Alert>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                Para prosseguir com o TCC, você precisa enviar um convite para um orientador.
                                            </Typography>
                                        )}

                                        <Button
                                            variant="contained"
                                            onClick={handleOpenConviteModal}
                                            disabled={conviteExistente && !conviteExistente.aceito}
                                        >
                                            {conviteExistente && !conviteExistente.aceito
                                                ? "Convite Pendente"
                                                : "Enviar Convite para Orientador"
                                            }
                                        </Button>
                                    </Box>
                                )}
                            </Paper>
                        )}

                        <VisualizarTemasTCC />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Etapa 2: Tema do TCC
                        </Typography>
                        <TextField
                            fullWidth
                            label="Tema do TCC *"
                            value={formData.tema}
                            onChange={(e) =>
                                handleInputChange("tema", e.target.value)
                            }
                            multiline
                            rows={3}
                            placeholder="Descreva o tema do seu trabalho de conclusão de curso..."
                            helperText="Descreva de forma clara e objetiva o tema que será abordado no seu TCC"
                        />
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Etapa 3: Título do TCC
                        </Typography>
                        <TextField
                            fullWidth
                            label="Título do TCC *"
                            value={formData.titulo}
                            onChange={(e) =>
                                handleInputChange("titulo", e.target.value)
                            }
                            placeholder="Digite o título do seu trabalho de conclusão de curso..."
                            helperText="O título deve ser claro, conciso e representativo do conteúdo do trabalho"
                        />
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Etapa 4: Resumo do TCC
                        </Typography>
                        <TextField
                            fullWidth
                            label="Resumo do TCC *"
                            value={formData.resumo}
                            onChange={(e) =>
                                handleInputChange("resumo", e.target.value)
                            }
                            multiline
                            rows={6}
                            placeholder="Escreva um resumo do seu trabalho de conclusão de curso..."
                            helperText="O resumo deve apresentar os objetivos, metodologia, resultados e conclusões principais do trabalho"
                        />
                    </Box>
                );
            default:
                return "Etapa desconhecida";
        }
    };

    if (loading) {
        return (
            <Box sx={{ width: "100%" }}>
                <LinearProgress />
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (!trabalhoConclusao && activeStep === 0) {
        return (
            <Box sx={{ width: "100%" }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Processo do TCC
                </Typography>

                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label, index) => {
                            const stepProps = {};
                            const labelProps = {};

                            return (
                                <Step key={label} {...stepProps}>
                                    <StepLabel {...labelProps}>
                                        {label}
                                    </StepLabel>
                                </Step>
                            );
                        })}
                    </Stepper>

                    <Box>
                        {renderStepContent(activeStep)}

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                pt: 2,
                            }}
                        >
                            <Box sx={{ flex: "1 1 auto" }} />
                            <Button
                                onClick={() => {
                                    const novaEtapa = activeStep + 1;
                                    setActiveStep(novaEtapa);
                                    if (onEtapaChange) {
                                        onEtapaChange(novaEtapa);
                                    }
                                }}
                                variant="contained"
                                color="primary"
                            >
                                Próximo
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%" }}>
            <Typography variant="h5" component="h2" gutterBottom>
                Processo do TCC
            </Typography>

            {ofertaAtual && (
                <Paper
                    sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: "primary.light",
                        color: "primary.contrastText",
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Oferta TCC Atual
                    </Typography>
                    <Typography variant="body2">
                        Ano: {ofertaAtual.ano} • Semestre:{" "}
                        {ofertaAtual.semestre} • Curso:{" "}
                        {ofertaAtual.Curso?.nome} • Fase: {ofertaAtual.fase}
                    </Typography>
                </Paper>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label, index) => {
                        const stepProps = {};
                        const labelProps = {};

                        // Verificar se a etapa está completa
                        const isStepComplete = (() => {
                            switch (index) {
                                case 0:
                                    return true; // Etapa 0 sempre completa (visualização)
                                case 1:
                                    return (
                                        formData.tema &&
                                        formData.tema.trim().length > 0
                                    );
                                case 2:
                                    return (
                                        formData.titulo &&
                                        formData.titulo.trim().length > 0
                                    );
                                case 3:
                                    return (
                                        formData.resumo &&
                                        formData.resumo.trim().length > 0
                                    );
                                default:
                                    return false;
                            }
                        })();

                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel
                                    {...labelProps}
                                    error={
                                        activeStep === index && !isStepComplete
                                    }
                                >
                                    {label}
                                </StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>

                {/* Botões de navegação na parte superior */}
                {activeStep !== steps.length && (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            mb: 3,
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Box sx={{ display: "flex", gap: 1 }}>
                            {activeStep > 0 && (
                                <Button
                                    color="inherit"
                                    onClick={() => {
                                        if (onEtapaChange) {
                                            onEtapaChange(0);
                                        }
                                    }}
                                    variant="outlined"
                                    size="small"
                                >
                                    Voltar para Temas
                                </Button>
                            )}
                            <Button
                                color="inherit"
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                variant="outlined"
                                size="small"
                            >
                                Voltar
                            </Button>
                        </Box>
                        <Button
                            onClick={handleNext}
                            disabled={saving || !validarEtapaAtual()}
                            variant="contained"
                            color="primary"
                            size="small"
                        >
                            {saving ? (
                                <>
                                    <CircularProgress
                                        size={16}
                                        sx={{ mr: 1 }}
                                    />
                                    Salvando...
                                </>
                            ) : activeStep === steps.length - 1 ? (
                                "Finalizar"
                            ) : (
                                "Próximo"
                            )}
                        </Button>
                    </Box>
                )}

                {activeStep === steps.length ? (
                    <Box>
                        <Typography sx={{ mt: 2, mb: 1 }}>
                            Todas as etapas foram concluídas!
                        </Typography>
                        <Button onClick={() => setActiveStep(0)}>
                            Reiniciar
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        {saving && (
                            <Box sx={{ mb: 2 }}>
                                <LinearProgress />
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    Salvando dados...
                                </Typography>
                            </Box>
                        )}

                        {renderStepContent(activeStep)}

                        {/* Mensagem de ajuda para etapa 0 */}
                        {activeStep === 0 && !validarEtapaAtual() && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    Para prosseguir, você precisa ter um convite aceito por um orientador.
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                )}
            </Paper>

            <Snackbar
                open={openMessage}
                autoHideDuration={6000}
                onClose={handleCloseMessage}
            >
                <Alert severity={messageSeverity} onClose={handleCloseMessage}>
                    {messageText}
                </Alert>
            </Snackbar>

            {/* Modal de Convite para Orientador */}
            {trabalhoConclusao && (
                <ConviteOrientadorModal
                    open={openConviteModal}
                    onClose={handleCloseConviteModal}
                    idTcc={trabalhoConclusao.id}
                    idCurso={trabalhoConclusao.id_curso}
                    onConviteEnviado={handleConviteEnviado}
                    conviteExistente={conviteExistente}
                />
            )}
        </Box>
    );
}
