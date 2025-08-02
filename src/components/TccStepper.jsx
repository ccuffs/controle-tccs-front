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

const steps = [
    "Preenchimento do Tema do TCC",
    "Preenchimento do Título do TCC",
    "Preenchimento do Resumo"
];

export default function TccStepper() {
    const { usuario } = useContext(AuthContext);
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [trabalhoConclusao, setTrabalhoConclusao] = useState(null);
    const [ofertaAtual, setOfertaAtual] = useState(null);
    const [formData, setFormData] = useState({
        tema: "",
        titulo: "",
        resumo: ""
    });
    const [openMessage, setOpenMessage] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [messageSeverity, setMessageSeverity] = useState("success");

    useEffect(() => {
        if (usuario) {
            carregarTrabalhoConclusao();
        }
    }, [usuario]);

        const carregarTrabalhoConclusao = async () => {
        try {
            setLoading(true);

            // Primeiro, buscar a última oferta TCC
            const responseOferta = await axiosInstance.get("/ofertas-tcc/ultima");
            setOfertaAtual(responseOferta);

            // Buscar o discente pelo id_usuario
            const responseDiscente = await axiosInstance.get(`/dicentes/usuario/${usuario.id}`);

            if (responseDiscente && responseDiscente.matricula) {
                // Buscar o trabalho de conclusão do discente
                const responseTcc = await axiosInstance.get(`/trabalho-conclusao/discente/${responseDiscente.matricula}`);

                if (responseTcc) {
                    setTrabalhoConclusao(responseTcc);
                    setFormData({
                        tema: responseTcc.tema || "",
                        titulo: responseTcc.titulo || "",
                        resumo: responseTcc.resumo || ""
                    });
                    setActiveStep(responseTcc.etapa || 0);
                } else {
                    // Criar novo trabalho de conclusão se não existir
                    await criarNovoTrabalhoConclusao(responseDiscente.matricula);
                }
            } else {
                setMessageText("Usuário não possui matrícula de discente associada!");
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

    const criarNovoTrabalhoConclusao = async (matricula) => {
        try {
            const novoTcc = {
                matricula: matricula,
                tema: "",
                titulo: "",
                resumo: "",
                etapa: 0
                // ano, semestre, id_curso e fase serão obtidos automaticamente da última oferta TCC
            };

            const response = await axiosInstance.post("/trabalho-conclusao", novoTcc);
            setTrabalhoConclusao(response);
        } catch (error) {
            console.error("Erro ao criar trabalho de conclusão:", error);
            setMessageText("Erro ao criar novo TCC!");
            setMessageSeverity("error");
            setOpenMessage(true);
        }
    };

    const handleNext = async () => {
        if (activeStep === steps.length - 1) {
            // Última etapa - salvar tudo
            await salvarTrabalhoConclusao();
        } else {
            // Avançar para próxima etapa
            await salvarEtapaAtual();
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const salvarEtapaAtual = async () => {
        console.log("salvando etapa atual");
        console.log(formData);
        console.log(trabalhoConclusao);
        console.log(activeStep);
        try {
            setSaving(true);
            const dadosAtualizados = {
                ...trabalhoConclusao,
                ...formData,
                etapa: activeStep
            };

            await axiosInstance.put(`/trabalho-conclusao/${trabalhoConclusao.id}`, dadosAtualizados);
            setTrabalhoConclusao(dadosAtualizados);
        } catch (error) {
            console.error("Erro ao salvar etapa:", error);
            setMessageText("Erro ao salvar etapa atual!");
            setMessageSeverity("error");
            setOpenMessage(true);
        } finally {
            setSaving(false);
        }
    };

    const salvarTrabalhoConclusao = async () => {
        try {
            setSaving(true);
            const dadosAtualizados = {
                ...trabalhoConclusao,
                ...formData,
                etapa: steps.length - 1
            };

            await axiosInstance.put(`/trabalho-conclusao/${trabalhoConclusao.id}`, dadosAtualizados);
            setTrabalhoConclusao(dadosAtualizados);

            setMessageText("TCC salvo com sucesso!");
            setMessageSeverity("success");
            setOpenMessage(true);
        } catch (error) {
            console.error("Erro ao salvar TCC:", error);
            setMessageText("Erro ao salvar TCC!");
            setMessageSeverity("error");
            setOpenMessage(true);
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
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
                        <Typography variant="h6" gutterBottom>
                            Etapa 1: Tema do TCC
                        </Typography>
                        <TextField
                            fullWidth
                            label="Tema do TCC"
                            value={formData.tema}
                            onChange={(e) => handleInputChange("tema", e.target.value)}
                            multiline
                            rows={3}
                            placeholder="Descreva o tema do seu trabalho de conclusão de curso..."
                            helperText="Descreva de forma clara e objetiva o tema que será abordado no seu TCC"
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Etapa 2: Título do TCC
                        </Typography>
                        <TextField
                            fullWidth
                            label="Título do TCC"
                            value={formData.titulo}
                            onChange={(e) => handleInputChange("titulo", e.target.value)}
                            placeholder="Digite o título do seu trabalho de conclusão de curso..."
                            helperText="O título deve ser claro, conciso e representativo do conteúdo do trabalho"
                        />
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Etapa 3: Resumo do TCC
                        </Typography>
                        <TextField
                            fullWidth
                            label="Resumo do TCC"
                            value={formData.resumo}
                            onChange={(e) => handleInputChange("resumo", e.target.value)}
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
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom>
                Desenvolvimento do TCC
            </Typography>

            {ofertaAtual && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="h6" gutterBottom>
                        Oferta TCC Atual
                    </Typography>
                    <Typography variant="body2">
                        Ano: {ofertaAtual.ano} • Semestre: {ofertaAtual.semestre} •
                        Curso: {ofertaAtual.Curso?.nome} • Fase: {ofertaAtual.fase}
                    </Typography>
                </Paper>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label, index) => {
                        const stepProps = {};
                        const labelProps = {};
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps}>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>

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
                        {renderStepContent(activeStep)}

                        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                            <Button
                                color="inherit"
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                sx={{ mr: 1 }}
                            >
                                Voltar
                            </Button>
                            <Box sx={{ flex: '1 1 auto' }} />
                            <Button
                                onClick={handleNext}
                                disabled={saving}
                            >
                                {activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

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
        </Box>
    );
}