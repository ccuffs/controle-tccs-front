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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Chip,
} from "@mui/material";
import axiosInstance from "../auth/axios";
import { AuthContext } from "../contexts/AuthContext";
import VisualizarTemasTCC from "./VisualizarTemasTCC";
import ConviteOrientadorModal from "./ConviteOrientadorModal";
import ConviteBancaModal from "./ConviteBancaModal";

const steps = ["1", "2", "3", "4", "5", "6", "7"];

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
        seminario_andamento: "",
    });
    const [openMessage, setOpenMessage] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [messageSeverity, setMessageSeverity] = useState("success");
    const [openConviteModal, setOpenConviteModal] = useState(false);
    const [conviteExistente, setConviteExistente] = useState(null);
    const [convitesBanca, setConvitesBanca] = useState([]);
    const [openConviteBancaModal, setOpenConviteBancaModal] = useState(false);
    const [openConviteBancaFinalModal, setOpenConviteBancaFinalModal] =
        useState(false);
    const [tccAnterior, setTccAnterior] = useState(null);
    const [openImportModal, setOpenImportModal] = useState(false);
    const [showCompletedMessage, setShowCompletedMessage] = useState(false);
    const [modalType, setModalType] = useState(""); // 'import', 'next_phase'

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
                    // Verificar se o TCC é da oferta atual ou anterior
                    const isTccOfertaAtual =
                        responseTcc.ano === responseOferta.ano &&
                        responseTcc.semestre === responseOferta.semestre;

                    if (!isTccOfertaAtual) {
                        // TCC é de oferta anterior - aplicar regras de importação
                        setTccAnterior(responseTcc);

                        if (responseTcc.aprovado_tcc) {
                            // 1.3 TCC já concluído - exibir mensagem
                            setShowCompletedMessage(true);
                            return;
                        } else if (responseTcc.aprovado_projeto) {
                            // 1.1 Projeto aprovado - perguntar se quer seguir com próxima fase
                            setModalType("next_phase");
                            setOpenImportModal(true);
                            return;
                        } else {
                            // 1.2 Projeto não aprovado - perguntar se quer importar TCC anterior
                            setModalType("import");
                            setOpenImportModal(true);
                            return;
                        }
                    } else {
                        // TCC da oferta atual - carregar normalmente
                        setTrabalhoConclusao(responseTcc);
                        setFormData({
                            tema: responseTcc.tema || "",
                            titulo: responseTcc.titulo || "",
                            resumo: responseTcc.resumo || "",
                            seminario_andamento:
                                responseTcc.seminario_andamento || "",
                        });

                        // Usar a etapa do banco de dados
                        const etapaBanco = responseTcc.etapa || 0;
                        setActiveStep(etapaBanco);
                        if (onEtapaChange) {
                            onEtapaChange(etapaBanco);
                        }

                        // Carregar convites existentes se houver
                        await carregarConvites(responseTcc.id);
                    }
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

    const carregarConvites = async (idTcc) => {
        try {
            const params = new URLSearchParams();
            params.append("id_tcc", idTcc);
            const response = await axiosInstance.get(
                `/convites?${params.toString()}`
            );
            const convites = response.data?.convites || response.convites || [];

            // Separar convites de orientação e banca
            const conviteOrientacao = convites.find(
                (convite) => convite.orientacao === true
            );
            const convitesBancaArray = convites.filter(
                (convite) => convite.orientacao === false
            );

            if (conviteOrientacao) {
                setConviteExistente(conviteOrientacao);
            }
            setConvitesBanca(convitesBancaArray);
        } catch (error) {
            console.error("Erro ao carregar convites:", error);
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
            await carregarConvites(response.id);
        } catch (error) {
            console.error("Erro ao criar trabalho de conclusão:", error);
            setMessageText("Erro ao criar novo TCC!");
            setMessageSeverity("error");
            setOpenMessage(true);
        }
    };

    // Função para determinar quais etapas são válidas baseado na fase do TCC
    const getEtapasValidas = () => {
        if (trabalhoConclusao && trabalhoConclusao.fase === 1) {
            return steps.slice(0, 5); // Etapas 1-5 para fase 1 (TCC I) - incluindo banca projeto
        }
        return steps; // Todas as etapas para fase 2 (TCC II) - incluindo banca trabalho
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
            case 4:
                // Etapa 4 (convite para banca do projeto - fase 1) - precisa de 2 convites aceitos
                const convitesAceitosFase1 = convitesBanca.filter(
                    (convite) => convite.aceito === true && convite.fase === 1
                );
                return convitesAceitosFase1.length >= 2;
            case 5:
                // Etapa 5 (seminário de andamento) só é obrigatória para fase 2
                if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
                    return (
                        formData.seminario_andamento &&
                        formData.seminario_andamento.trim().length > 0
                    );
                }
                return true; // Para fase 1, a etapa 5 não é obrigatória
            case 6:
                // Etapa 6 (convite para banca do trabalho final - fase 2) - só existe na fase 2
                if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
                    // Para etapa 7, considerar apenas convites da fase 2 e aceitos
                    const convitesAceitosFase2 = convitesBanca.filter(
                        (convite) =>
                            convite.aceito === true && convite.fase === 2
                    );
                    return convitesAceitosFase2.length >= 2;
                }
                return true; // Para fase 1, não existe esta etapa
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
            const etapasValidas = getEtapasValidas();
            if (activeStep === etapasValidas.length - 1) {
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
                // Salvar etapa atual e avançar para próxima etapa (incluindo etapa 0)
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

        // Ao voltar, apenas atualizar o estado local sem persistir no banco de dados
        // A etapa no banco só deve ser atualizada ao avançar (handleNext)
        if (onEtapaChange) {
            onEtapaChange(novaEtapa);
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
            const novaEtapa = activeStep + 1;
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
            const etapasValidas = getEtapasValidas();
            const dadosAtualizados = {
                ...trabalhoConclusao,
                ...formData,
                etapa: etapasValidas.length,
            };

            await axiosInstance.put(
                `/trabalho-conclusao/${trabalhoConclusao.id}`,
                dadosAtualizados
            );
            setTrabalhoConclusao(dadosAtualizados);

            // Notificar componente pai sobre mudança de etapa
            if (onEtapaChange) {
                onEtapaChange(etapasValidas.length);
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

    const handleOpenConviteBancaModal = () => {
        setOpenConviteBancaModal(true);
    };

    const handleCloseConviteBancaModal = () => {
        setOpenConviteBancaModal(false);
    };

    const handleOpenConviteBancaFinalModal = () => {
        setOpenConviteBancaFinalModal(true);
    };

    const handleCloseConviteBancaFinalModal = () => {
        setOpenConviteBancaFinalModal(false);
    };

    const handleConviteEnviado = async () => {
        if (trabalhoConclusao) {
            await carregarConvites(trabalhoConclusao.id);
        }
        setMessageText("Convite enviado com sucesso!");
        setMessageSeverity("success");
        setOpenMessage(true);
    };

    const handleConviteBancaEnviado = async () => {
        if (trabalhoConclusao) {
            await carregarConvites(trabalhoConclusao.id);
        }
        setMessageText("Convites para banca enviados com sucesso!");
        setMessageSeverity("success");
        setOpenMessage(true);
    };

    const handleImportModalClose = () => {
        setOpenImportModal(false);
    };

    const handleImportData = async (opcaoSelecionada) => {
        setOpenImportModal(false);

        if (!tccAnterior || !ofertaAtual) return;

        try {
            setLoading(true);
            const responseDiscente = await axiosInstance.get(
                `/dicentes/usuario/${usuario.id}`
            );

            if (modalType === "next_phase") {
                // 1.1 Projeto aprovado - pergunta sobre próxima fase
                if (opcaoSelecionada) {
                    // Sim: atualizar TCC existente para oferta atual (próxima fase)
                    const dadosAtualizados = {
                        ...tccAnterior,
                        ano: ofertaAtual.ano,
                        semestre: ofertaAtual.semestre,
                        id_curso: ofertaAtual.id_curso,
                        fase: 2, // TCC II (próxima fase)
                    };

                    const response = await axiosInstance.put(
                        `/trabalho-conclusao/${tccAnterior.id}`,
                        dadosAtualizados
                    );

                    const tccAtualizado = response.trabalho;
                    setTrabalhoConclusao(tccAtualizado);
                    setFormData({
                        tema: tccAtualizado.tema || "",
                        titulo: tccAtualizado.titulo || "",
                        resumo: tccAtualizado.resumo || "",
                        seminario_andamento:
                            tccAtualizado.seminario_andamento || "",
                    });

                    const etapaAtual = tccAnterior.etapa || 0;
                    setActiveStep(etapaAtual);
                    if (onEtapaChange) {
                        onEtapaChange(etapaAtual);
                    }

                    await carregarConvites(tccAnterior.id);

                    setMessageText(
                        `TCC atualizado para ${ofertaAtual.ano}/${ofertaAtual.semestre}! Você está na fase TCC II.`
                    );
                    setMessageSeverity("success");
                    setOpenMessage(true);
                } else {
                    // Não: criar novo TCC em etapa 0
                    await criarNovoTrabalhoConclusao(
                        responseDiscente.matricula
                    );
                    setMessageText(
                        `Novo TCC criado para ${ofertaAtual.ano}/${ofertaAtual.semestre}!`
                    );
                    setMessageSeverity("success");
                    setOpenMessage(true);
                }
            } else if (modalType === "import") {
                // 1.2 Projeto não aprovado - pergunta sobre importar
                if (opcaoSelecionada) {
                    // Sim: criar novo TCC copiando valores do anterior
                    const novoTcc = {
                        matricula: responseDiscente.matricula,
                        tema: tccAnterior.tema || "",
                        titulo: tccAnterior.titulo || "",
                        resumo: tccAnterior.resumo || "",
                        etapa: tccAnterior.etapa,
                        ano: ofertaAtual.ano,
                        semestre: ofertaAtual.semestre,
                        id_curso: ofertaAtual.id_curso,
                        fase: ofertaAtual.fase,
                    };

                    const response = await axiosInstance.post(
                        "/trabalho-conclusao",
                        novoTcc
                    );
                    setTrabalhoConclusao(response);
                    setFormData({
                        tema: novoTcc.tema,
                        titulo: novoTcc.titulo,
                        resumo: novoTcc.resumo,
                        seminario_andamento: novoTcc.seminario_andamento || "",
                    });
                    setActiveStep(0);
                    if (onEtapaChange) {
                        onEtapaChange(0);
                    }

                    await carregarConvites(response.id);

                    setMessageText(
                        `TCC importado com sucesso para ${ofertaAtual.ano}/${ofertaAtual.semestre}!`
                    );
                    setMessageSeverity("success");
                    setOpenMessage(true);
                } else {
                    // Não: criar novo TCC em etapa 0
                    await criarNovoTrabalhoConclusao(
                        responseDiscente.matricula
                    );
                    setMessageText(
                        `Novo TCC criado para ${ofertaAtual.ano}/${ofertaAtual.semestre}!`
                    );
                    setMessageSeverity("success");
                    setOpenMessage(true);
                }
            }
        } catch (error) {
            console.error("Erro ao processar ação:", error);
            setMessageText("Erro ao processar ação. Tente novamente.");
            setMessageSeverity("error");
            setOpenMessage(true);
        } finally {
            setLoading(false);
        }
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
                                            severity={
                                                conviteExistente.aceito
                                                    ? "success"
                                                    : "warning"
                                            }
                                            sx={{ mb: 2 }}
                                        >
                                            <Typography variant="body2">
                                                <strong>
                                                    Status do Convite:
                                                </strong>{" "}
                                                {conviteExistente.aceito
                                                    ? "Aceito"
                                                    : "Pendente"}
                                            </Typography>
                                            {conviteExistente.data_envio && (
                                                <Typography variant="body2">
                                                    <strong>Enviado em:</strong>{" "}
                                                    {new Date(
                                                        conviteExistente.data_envio
                                                    ).toLocaleDateString(
                                                        "pt-BR"
                                                    )}
                                                </Typography>
                                            )}
                                            {conviteExistente.Docente && (
                                                <Typography variant="body2">
                                                    <strong>Orientador:</strong>{" "}
                                                    {
                                                        conviteExistente.Docente
                                                            .nome
                                                    }
                                                </Typography>
                                            )}
                                        </Alert>

                                        <Button
                                            variant="outlined"
                                            onClick={handleOpenConviteModal}
                                            disabled={conviteExistente.aceito}
                                        >
                                            {conviteExistente.aceito
                                                ? "Convite Aceito"
                                                : "Ver Detalhes do Convite"}
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box>
                                        {conviteExistente &&
                                        !conviteExistente.aceito ? (
                                            <Alert
                                                severity="info"
                                                sx={{ mb: 2 }}
                                            >
                                                <Typography variant="body2">
                                                    Você já possui um convite
                                                    pendente para um orientador.
                                                    Aguarde a resposta antes de
                                                    prosseguir com o TCC.
                                                </Typography>
                                            </Alert>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 2 }}
                                            >
                                                Para prosseguir com o TCC, você
                                                precisa enviar um convite para
                                                um orientador.
                                            </Typography>
                                        )}

                                        <Button
                                            variant="contained"
                                            onClick={handleOpenConviteModal}
                                            disabled={
                                                conviteExistente &&
                                                !conviteExistente.aceito
                                            }
                                        >
                                            {conviteExistente &&
                                            !conviteExistente.aceito
                                                ? "Convite Pendente"
                                                : "Enviar Convite para Orientador"}
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
            case 4:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Etapa 5: Convite para Banca de Avaliação do Projeto
                        </Typography>

                        {trabalhoConclusao && (
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Composição da Banca de Avaliação do Projeto
                                </Typography>

                                {/* Filtrar apenas convites da fase 1 (banca do projeto) */}
                                {(() => {
                                    const convitesBancaFase1 =
                                        convitesBanca.filter(
                                            (c) => c.fase === 1
                                        );
                                    const convitesAceitosFase1 =
                                        convitesBancaFase1.filter(
                                            (c) => c.aceito === true
                                        );

                                    return (
                                        <>
                                            {/* Mostrar mensagem explicativa apenas se não há convites aceitos ainda */}
                                            {convitesAceitosFase1.length ===
                                                0 && (
                                                <Alert
                                                    severity="info"
                                                    sx={{ mb: 2 }}
                                                >
                                                    <Typography variant="body2">
                                                        Para prosseguir, você
                                                        precisa convidar 2
                                                        docentes para compor a
                                                        banca de avaliação do
                                                        seu projeto. Você pode
                                                        enviar até 2 convites
                                                        por vez.
                                                    </Typography>
                                                </Alert>
                                            )}

                                            {convitesBancaFase1.length > 0 ? (
                                                <Box>
                                                    {/* Mostrar status detalhado dos convites da fase 1 */}
                                                    <Typography
                                                        variant="subtitle1"
                                                        gutterBottom
                                                    >
                                                        Status dos Convites para
                                                        Banca do Projeto:
                                                    </Typography>

                                                    {convitesBancaFase1.map(
                                                        (convite, index) => (
                                                            <Alert
                                                                key={index}
                                                                severity={
                                                                    convite.aceito ===
                                                                    true
                                                                        ? "success"
                                                                        : convite.data_feedback &&
                                                                          !convite.aceito
                                                                        ? "error"
                                                                        : "warning"
                                                                }
                                                                sx={{ mb: 2 }}
                                                            >
                                                                <Typography variant="body2">
                                                                    <strong>
                                                                        Docente:
                                                                    </strong>{" "}
                                                                    {convite
                                                                        .Docente
                                                                        ?.nome ||
                                                                        convite.codigo_docente}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>
                                                                        Status:
                                                                    </strong>{" "}
                                                                    {convite.aceito ===
                                                                    true
                                                                        ? "Aceito"
                                                                        : convite.data_feedback &&
                                                                          !convite.aceito
                                                                        ? "Recusado"
                                                                        : "Pendente"}
                                                                </Typography>
                                                                {convite.data_envio && (
                                                                    <Typography variant="body2">
                                                                        <strong>
                                                                            Enviado
                                                                            em:
                                                                        </strong>{" "}
                                                                        {new Date(
                                                                            convite.data_envio
                                                                        ).toLocaleDateString(
                                                                            "pt-BR"
                                                                        )}
                                                                    </Typography>
                                                                )}
                                                                {convite.data_feedback && (
                                                                    <Typography variant="body2">
                                                                        <strong>
                                                                            Respondido
                                                                            em:
                                                                        </strong>{" "}
                                                                        {new Date(
                                                                            convite.data_feedback
                                                                        ).toLocaleDateString(
                                                                            "pt-BR"
                                                                        )}
                                                                    </Typography>
                                                                )}
                                                                {convite.mensagem_feedback &&
                                                                    convite.data_feedback && (
                                                                        <Typography variant="body2">
                                                                            <strong>
                                                                                Mensagem
                                                                                do
                                                                                docente:
                                                                            </strong>{" "}
                                                                            {
                                                                                convite.mensagem_feedback
                                                                            }
                                                                        </Typography>
                                                                    )}
                                                                {convite.mensagem_envio && (
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            mt: 1,
                                                                            fontStyle:
                                                                                "italic",
                                                                        }}
                                                                    >
                                                                        <strong>
                                                                            Sua
                                                                            mensagem:
                                                                        </strong>{" "}
                                                                        "
                                                                        {
                                                                            convite.mensagem_envio
                                                                        }
                                                                        "
                                                                    </Typography>
                                                                )}
                                                            </Alert>
                                                        )
                                                    )}

                                                    {/* Resumo visual com chips para fase 1 */}
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            gutterBottom
                                                        >
                                                            Resumo:
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexWrap:
                                                                    "wrap",
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <Chip
                                                                label={`${convitesAceitosFase1.length} Aceito(s)`}
                                                                color="success"
                                                                size="small"
                                                            />
                                                            <Chip
                                                                label={`${
                                                                    convitesBancaFase1.filter(
                                                                        (c) =>
                                                                            !c.data_feedback
                                                                    ).length
                                                                } Pendente(s)`}
                                                                color="warning"
                                                                size="small"
                                                            />
                                                            <Chip
                                                                label={`${
                                                                    convitesBancaFase1.filter(
                                                                        (c) =>
                                                                            c.data_feedback &&
                                                                            !c.aceito
                                                                    ).length
                                                                } Recusado(s)`}
                                                                color="error"
                                                                size="small"
                                                            />
                                                        </Box>
                                                    </Box>

                                                    {convitesAceitosFase1.length ===
                                                    2 ? (
                                                        <Alert
                                                            severity="success"
                                                            sx={{ mb: 2 }}
                                                        >
                                                            <Typography variant="body2">
                                                                🎉 Excelente!
                                                                Sua banca de
                                                                avaliação está
                                                                completa com 2
                                                                membros
                                                                confirmados.
                                                                Agora você pode
                                                                prosseguir para
                                                                a próxima etapa.
                                                            </Typography>
                                                        </Alert>
                                                    ) : (
                                                        <Button
                                                            variant="contained"
                                                            onClick={
                                                                handleOpenConviteBancaModal
                                                            }
                                                            disabled={
                                                                convitesBancaFase1.filter(
                                                                    (c) =>
                                                                        !c.data_feedback
                                                                ).length >= 2
                                                            }
                                                        >
                                                            {convitesBancaFase1.filter(
                                                                (c) =>
                                                                    !c.data_feedback
                                                            ).length >= 2
                                                                ? "Limite de Convites Atingido"
                                                                : `Enviar ${
                                                                      2 -
                                                                      convitesAceitosFase1.length
                                                                  } Convite(s) para Banca do Projeto`}
                                                        </Button>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mb: 2 }}
                                                    >
                                                        Você ainda não enviou
                                                        convites para a banca de
                                                        avaliação do projeto.
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        onClick={
                                                            handleOpenConviteBancaModal
                                                        }
                                                    >
                                                        Enviar 2 Convites para
                                                        Banca do Projeto
                                                    </Button>
                                                </Box>
                                            )}
                                        </>
                                    );
                                })()}
                            </Paper>
                        )}
                    </Box>
                );
            case 5:
                // Etapa 6: Seminário de Andamento - apenas para fase 2
                if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
                    return (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Etapa 6: Seminário de Andamento
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    Esta etapa é específica para estudantes na
                                    fase TCC II. Descreva as atividades e
                                    progresso do seu seminário de andamento.
                                </Typography>
                            </Alert>
                            <TextField
                                fullWidth
                                label="Seminário de Andamento *"
                                value={formData.seminario_andamento}
                                onChange={(e) =>
                                    handleInputChange(
                                        "seminario_andamento",
                                        e.target.value
                                    )
                                }
                                multiline
                                rows={6}
                                placeholder="Descreva as atividades, progresso e resultados do seminário de andamento..."
                                helperText="Apresente o desenvolvimento do trabalho, metodologia aplicada, resultados parciais e próximos passos"
                            />
                        </Box>
                    );
                } else {
                    // Para fase 1, pular esta etapa
                    return (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Etapa Não Aplicável
                                </Typography>
                                <Typography variant="body2">
                                    A etapa de Seminário de Andamento é
                                    específica para estudantes na fase TCC II.
                                    Como você está na fase TCC I, esta etapa
                                    será automaticamente ignorada.
                                </Typography>
                            </Alert>
                        </Box>
                    );
                }
            case 6:
                // Etapa 7: Convite para Banca de Avaliação do Trabalho Final - apenas para fase 2
                if (trabalhoConclusao && trabalhoConclusao.fase === 2) {
                    // Separar convites por fase
                    const convitesFase1 = convitesBanca.filter(
                        (c) => c.fase === 1
                    ); // Convites da etapa 5 (banca do projeto)
                    const convitesFase2 = convitesBanca.filter(
                        (c) => c.fase === 2
                    ); // Convites da etapa 7 (banca final)
                    const convitesAceitosFase2 = convitesFase2.filter(
                        (c) => c.aceito === true
                    );

                    return (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Etapa 7: Convite para Banca de Avaliação do
                                Trabalho Final
                            </Typography>

                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Composição da Banca de Avaliação Final
                                </Typography>

                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Nova Etapa:</strong> Para a
                                        avaliação final do seu trabalho, você
                                        precisa convidar 2 docentes para uma
                                        nova banca. Os docentes que participaram
                                        da banca do projeto (etapa 5) vêm
                                        pré-selecionados como sugestão.
                                    </Typography>
                                </Alert>

                                {/* Histórico de convites da fase 1 (etapa 5) */}
                                {convitesFase1.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography
                                            variant="subtitle2"
                                            color="text.secondary"
                                            gutterBottom
                                        >
                                            📚 Histórico - Banca do Projeto
                                            (Etapa 5):
                                        </Typography>
                                        {convitesFase1.map((convite, index) => (
                                            <Alert
                                                key={`fase1-${index}`}
                                                severity={
                                                    convite.aceito
                                                        ? "success"
                                                        : "info"
                                                }
                                                sx={{ mb: 1, opacity: 0.7 }}
                                            >
                                                <Typography variant="caption">
                                                    <strong>
                                                        {convite.Docente
                                                            ?.nome ||
                                                            convite.codigo_docente}
                                                    </strong>{" "}
                                                    -{" "}
                                                    {convite.aceito
                                                        ? "Participou da banca do projeto"
                                                        : convite.data_feedback
                                                        ? "Recusou participar"
                                                        : "Convite pendente"}{" "}
                                                    {convite.data_feedback &&
                                                        `em ${new Date(
                                                            convite.data_feedback
                                                        ).toLocaleDateString(
                                                            "pt-BR"
                                                        )}`}
                                                </Typography>
                                            </Alert>
                                        ))}
                                    </Box>
                                )}

                                {/* Convites da fase 2 para banca final */}
                                {convitesFase2.length > 0 ? (
                                    <Box>
                                        <Typography
                                            variant="subtitle1"
                                            gutterBottom
                                        >
                                            📋 Convites para Banca de Avaliação
                                            Final:
                                        </Typography>

                                        {convitesFase2.map((convite, index) => (
                                            <Alert
                                                key={`fase2-${index}`}
                                                severity={
                                                    convite.aceito === true
                                                        ? "success"
                                                        : convite.data_feedback &&
                                                          !convite.aceito
                                                        ? "error"
                                                        : "warning"
                                                }
                                                sx={{ mb: 2 }}
                                            >
                                                <Typography variant="body2">
                                                    <strong>Docente:</strong>{" "}
                                                    {convite.Docente?.nome ||
                                                        convite.codigo_docente}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Status:</strong>{" "}
                                                    {convite.aceito === true
                                                        ? "Aceito"
                                                        : convite.data_feedback &&
                                                          !convite.aceito
                                                        ? "Recusado"
                                                        : "Pendente"}
                                                </Typography>
                                                {convite.data_envio && (
                                                    <Typography variant="body2">
                                                        <strong>
                                                            Enviado em:
                                                        </strong>{" "}
                                                        {new Date(
                                                            convite.data_envio
                                                        ).toLocaleDateString(
                                                            "pt-BR"
                                                        )}
                                                    </Typography>
                                                )}
                                                {convite.data_feedback && (
                                                    <Typography variant="body2">
                                                        <strong>
                                                            Respondido em:
                                                        </strong>{" "}
                                                        {new Date(
                                                            convite.data_feedback
                                                        ).toLocaleDateString(
                                                            "pt-BR"
                                                        )}
                                                    </Typography>
                                                )}
                                                {convite.mensagem_feedback &&
                                                    convite.data_feedback && (
                                                        <Typography variant="body2">
                                                            <strong>
                                                                Mensagem do
                                                                docente:
                                                            </strong>{" "}
                                                            {
                                                                convite.mensagem_feedback
                                                            }
                                                        </Typography>
                                                    )}
                                                {convite.mensagem_envio && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mt: 1,
                                                            fontStyle: "italic",
                                                        }}
                                                    >
                                                        <strong>
                                                            Sua mensagem:
                                                        </strong>{" "}
                                                        "
                                                        {convite.mensagem_envio}
                                                        "
                                                    </Typography>
                                                )}
                                            </Alert>
                                        ))}

                                        {/* Resumo dos convites da fase 2 */}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                gutterBottom
                                            >
                                                Status da Banca Final:
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 1,
                                                }}
                                            >
                                                <Chip
                                                    label={`${convitesAceitosFase2.length} Aceito(s)`}
                                                    color="success"
                                                    size="small"
                                                />
                                                <Chip
                                                    label={`${
                                                        convitesFase2.filter(
                                                            (c) =>
                                                                !c.data_feedback
                                                        ).length
                                                    } Pendente(s)`}
                                                    color="warning"
                                                    size="small"
                                                />
                                                <Chip
                                                    label={`${
                                                        convitesFase2.filter(
                                                            (c) =>
                                                                c.data_feedback &&
                                                                !c.aceito
                                                        ).length
                                                    } Recusado(s)`}
                                                    color="error"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>

                                        {convitesAceitosFase2.length === 2 ? (
                                            <Alert
                                                severity="success"
                                                sx={{ mb: 2 }}
                                            >
                                                <Typography variant="body2">
                                                    🎉 Excelente! Sua banca de
                                                    avaliação final está
                                                    completa com 2 membros
                                                    confirmados. Agora você pode
                                                    finalizar seu TCC.
                                                </Typography>
                                            </Alert>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                onClick={
                                                    handleOpenConviteBancaFinalModal
                                                }
                                                disabled={
                                                    convitesFase2.filter(
                                                        (c) => !c.data_feedback
                                                    ).length >= 2
                                                }
                                            >
                                                {convitesFase2.filter(
                                                    (c) => !c.data_feedback
                                                ).length >= 2
                                                    ? "Aguardando Respostas"
                                                    : `Enviar ${
                                                          2 -
                                                          convitesAceitosFase2.length
                                                      } Convite(s) para Banca Final`}
                                            </Button>
                                        )}
                                    </Box>
                                ) : (
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2 }}
                                        >
                                            Inicie o processo de convites para a
                                            banca de avaliação final.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={
                                                handleOpenConviteBancaFinalModal
                                            }
                                        >
                                            Enviar 2 Convites para Banca Final
                                        </Button>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    );
                } else {
                    // Para fase 1, esta etapa não existe
                    return (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Etapa Não Aplicável
                                </Typography>
                                <Typography variant="body2">
                                    A etapa de Convite para Banca Final é
                                    específica para estudantes na fase TCC II.
                                    Como você está na fase TCC I, esta etapa não
                                    está disponível.
                                </Typography>
                            </Alert>
                        </Box>
                    );
                }
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

    // Exibir mensagem de TCC concluído
    if (showCompletedMessage && tccAnterior) {
        return (
            <Box sx={{ width: "100%" }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    TCC Concluído
                </Typography>

                <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Alert severity="success" sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            🎉 Parabéns! Seu TCC foi concluído com sucesso!
                        </Typography>
                        <Typography variant="body1">
                            Você já concluiu seu Trabalho de Conclusão de Curso
                            no período de {tccAnterior.ano}/
                            {tccAnterior.semestre}.
                        </Typography>
                    </Alert>

                    <Paper sx={{ p: 2, bgcolor: "grey.50", mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Dados do seu TCC:
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 1,
                                mb: 2,
                            }}
                        >
                            <Chip label="TCC Aprovado" color="success" />
                            <Chip
                                label={`${tccAnterior.ano}/${tccAnterior.semestre}`}
                                color="info"
                            />
                            <Chip
                                label={`Fase ${tccAnterior.fase}`}
                                color="primary"
                            />
                        </Box>

                        {tccAnterior.titulo && (
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Título:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {tccAnterior.titulo}
                                </Typography>
                            </Box>
                        )}

                        {tccAnterior.tema && (
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Tema:
                                </Typography>
                                <Typography variant="body2">
                                    {tccAnterior.tema}
                                </Typography>
                            </Box>
                        )}
                    </Paper>

                    <Typography variant="body2" color="text.secondary">
                        Como você já concluiu seu TCC, não é necessário realizar
                        novamente o processo. Entre em contato com a coordenação
                        caso tenha dúvidas.
                    </Typography>
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
                    {getEtapasValidas().map((label, index) => {
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
                                case 4:
                                    // Etapa 4 (convite para banca do projeto - fase 1) - precisa de 2 convites aceitos
                                    const convitesAceitosBancaFase1 =
                                        convitesBanca.filter(
                                            (convite) =>
                                                convite.aceito === true &&
                                                convite.fase === 1
                                        );
                                    return (
                                        convitesAceitosBancaFase1.length >= 2
                                    );
                                case 5:
                                    // Etapa 5 (seminário) só é obrigatória para fase 2
                                    if (
                                        trabalhoConclusao &&
                                        trabalhoConclusao.fase === 2
                                    ) {
                                        return (
                                            formData.seminario_andamento &&
                                            formData.seminario_andamento.trim()
                                                .length > 0
                                        );
                                    }
                                    return true; // Para fase 1, considera completa
                                case 6:
                                    // Etapa 6 (convite para banca final - fase 2) - só existe na fase 2
                                    if (
                                        trabalhoConclusao &&
                                        trabalhoConclusao.fase === 2
                                    ) {
                                        const convitesAceitosBancaFase2 =
                                            convitesBanca.filter(
                                                (convite) =>
                                                    convite.aceito === true &&
                                                    convite.fase === 2
                                            );
                                        return (
                                            convitesAceitosBancaFase2.length >=
                                            2
                                        );
                                    }
                                    return true; // Para fase 1, não existe
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
                {activeStep !== getEtapasValidas().length && (
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
                            ) : activeStep === getEtapasValidas().length - 1 ? (
                                "Finalizar"
                            ) : (
                                "Próximo"
                            )}
                        </Button>
                    </Box>
                )}

                {activeStep === getEtapasValidas().length ? (
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
                                    Para prosseguir, você precisa ter um convite
                                    aceito por um orientador.
                                </Typography>
                            </Alert>
                        )}

                        {/* Mensagem de ajuda para etapa 4 (banca) */}
                        {activeStep === 4 &&
                            !validarEtapaAtual() &&
                            convitesBanca.length > 0 && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>
                                            Aguardando confirmação da banca:
                                        </strong>{" "}
                                        Para prosseguir, você precisa ter 2
                                        convites aceitos.
                                        {convitesBanca.filter(
                                            (c) => c.aceito === true
                                        ).length > 0
                                            ? ` Você já tem ${
                                                  convitesBanca.filter(
                                                      (c) => c.aceito === true
                                                  ).length
                                              } convite(s) aceito(s), falta(m) ${
                                                  2 -
                                                  convitesBanca.filter(
                                                      (c) => c.aceito === true
                                                  ).length
                                              }.`
                                            : " Ainda não há convites aceitos."}
                                    </Typography>
                                </Alert>
                            )}

                        {/* Mensagem de ajuda para etapa 6 (banca final) */}
                        {activeStep === 6 && !validarEtapaAtual() && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    <strong>
                                        Aguardando confirmação da banca final:
                                    </strong>{" "}
                                    Para finalizar seu TCC, você precisa ter 2
                                    convites aceitos para a banca de avaliação
                                    final.
                                    {(() => {
                                        const convitesFase2Atuais =
                                            convitesBanca.filter(
                                                (c) => c.fase === 2
                                            );
                                        const convitesAceitosFase2 =
                                            convitesFase2Atuais.filter(
                                                (c) => c.aceito === true
                                            );
                                        return convitesAceitosFase2.length > 0
                                            ? ` Você já tem ${
                                                  convitesAceitosFase2.length
                                              } convite(s) aceito(s) para a banca final, falta(m) ${
                                                  2 -
                                                  convitesAceitosFase2.length
                                              }.`
                                            : " Ainda não há convites aceitos para a banca final.";
                                    })()}
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

            {/* Modal de Convite para Banca */}
            {trabalhoConclusao && (
                <ConviteBancaModal
                    open={openConviteBancaModal}
                    onClose={handleCloseConviteBancaModal}
                    idTcc={trabalhoConclusao.id}
                    idCurso={trabalhoConclusao.id_curso}
                    onConviteEnviado={handleConviteBancaEnviado}
                    convitesExistentes={convitesBanca.filter(
                        (c) => c.fase === 1
                    )} // Apenas convites da fase 1 (banca do projeto)
                    conviteOrientacao={conviteExistente}
                    tipoConvite="banca_projeto"
                    docentesPreSelecionados={[]} // Etapa 5 não tem pré-seleção
                />
            )}

            {/* Modal de Convite para Banca Final */}
            {trabalhoConclusao && (
                <ConviteBancaModal
                    open={openConviteBancaFinalModal}
                    onClose={handleCloseConviteBancaFinalModal}
                    idTcc={trabalhoConclusao.id}
                    idCurso={trabalhoConclusao.id_curso}
                    onConviteEnviado={handleConviteBancaEnviado}
                    convitesExistentes={convitesBanca.filter(
                        (c) => c.fase === 2
                    )} // Apenas convites da fase 2 (banca final)
                    conviteOrientacao={conviteExistente}
                    tipoConvite="banca_trabalho"
                    docentesPreSelecionados={convitesBanca
                        .filter((c) => c.fase === 1 && c.aceito === true)
                        .map((c) => c.codigo_docente)} // Docentes aceitos na fase 1
                />
            )}

            {/* Modal de Importação de Dados */}
            <Dialog
                open={openImportModal}
                onClose={handleImportModalClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {modalType === "next_phase"
                        ? "Projeto Aprovado Encontrado"
                        : "TCC Anterior Encontrado"}
                </DialogTitle>
                <DialogContent>
                    {tccAnterior && (
                        <Box>
                            <DialogContentText sx={{ mb: 2 }}>
                                {modalType === "next_phase" ? (
                                    <>
                                        Seu projeto de TCC foi aprovado em{" "}
                                        {tccAnterior.ano}/{tccAnterior.semestre}
                                        . Deseja continuar para a próxima fase
                                        (TCC II) na oferta atual{" "}
                                        {ofertaAtual?.ano}/
                                        {ofertaAtual?.semestre}?
                                    </>
                                ) : (
                                    <>
                                        Encontramos um TCC seu de{" "}
                                        {tccAnterior.ano}/{tccAnterior.semestre}
                                        . Deseja importar os dados deste TCC
                                        para a oferta atual {ofertaAtual?.ano}/
                                        {ofertaAtual?.semestre}?
                                    </>
                                )}
                            </DialogContentText>

                            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Dados do TCC Anterior:
                                </Typography>

                                <Box sx={{ mb: 1 }}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Status:
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1,
                                            mt: 0.5,
                                        }}
                                    >
                                        <Chip
                                            label={
                                                tccAnterior.aprovado_projeto
                                                    ? "Projeto Aprovado"
                                                    : "Projeto Não Aprovado"
                                            }
                                            color={
                                                tccAnterior.aprovado_projeto
                                                    ? "success"
                                                    : "default"
                                            }
                                            size="small"
                                        />
                                        <Chip
                                            label={`Fase ${tccAnterior.fase}`}
                                            color="info"
                                            size="small"
                                        />
                                    </Box>
                                </Box>

                                {tccAnterior.tema && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Tema:
                                        </Typography>
                                        <Typography variant="body2">
                                            {tccAnterior.tema}
                                        </Typography>
                                    </Box>
                                )}

                                {tccAnterior.titulo && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Título:
                                        </Typography>
                                        <Typography variant="body2">
                                            {tccAnterior.titulo}
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>

                            {modalType === "next_phase" && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        Ao continuar, você será direcionado para
                                        a fase TCC II mantendo seus dados
                                        anteriores.
                                    </Typography>
                                </Alert>
                            )}

                            {modalType === "import" && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        Ao importar, um novo TCC será criado com
                                        os dados do TCC anterior.
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => handleImportData(false)}
                        color="inherit"
                    >
                        {modalType === "next_phase"
                            ? "Criar Novo TCC"
                            : "Não Importar"}
                    </Button>
                    <Button
                        onClick={() => handleImportData(true)}
                        variant="contained"
                        color="primary"
                    >
                        {modalType === "next_phase"
                            ? "Continuar TCC II"
                            : "Importar Dados"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
