import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Chip,
    OutlinedInput,
    ListItemText,
    Checkbox,
} from "@mui/material";
import axiosInstance from "../auth/axios";

export default function ConviteBancaModal({
    open,
    onClose,
    idTcc,
    idCurso,
    onConviteEnviado,
    convitesExistentes = [],
    conviteOrientacao = null, // Convite de orientação para excluir orientador da lista
    tipoConvite = "banca_projeto", // "banca_projeto" ou "banca_trabalho"
}) {
    const [orientadores, setOrientadores] = useState([]);
    const [orientadoresSelecionados, setOrientadoresSelecionados] = useState(
        []
    );
    const [mensagem, setMensagem] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingOrientadores, setLoadingOrientadores] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && idCurso) {
            carregarOrientadores();
        }
    }, [open, idCurso]);

    useEffect(() => {
        if (open) {
            // Resetar seleções quando abrir o modal
            setOrientadoresSelecionados([]);
            setMensagem("");
            setError("");
        }
    }, [open]);

    const carregarOrientadores = async () => {
        try {
            setLoadingOrientadores(true);
            const response = await axiosInstance.get(
                `/orientadores/curso/${idCurso}`
            );

            // Extrair os docentes das orientações
            const orientacoes =
                response.data?.orientacoes || response.orientacoes || [];
            const docentes = orientacoes
                .map((orientacao) => orientacao.docente)
                .filter(Boolean);

            setOrientadores(docentes);
        } catch (error) {
            console.error("Erro ao carregar orientadores do curso:", error);
            setError("Erro ao carregar lista de orientadores do curso");
        } finally {
            setLoadingOrientadores(false);
        }
    };

    // Filtrar convites de banca (orientacao = false)
    const convitesBanca = convitesExistentes.filter(
        (convite) => convite.orientacao === false
    );

    // Contar convites pendentes (sem data_feedback)
    const convitesPendentes = convitesBanca.filter(
        (convite) => !convite.data_feedback
    );

    // Contar convites aceitos
    const convitesAceitos = convitesBanca.filter(
        (convite) => convite.aceito === true
    );

    // Determinar se o botão deve estar desabilitado
    const deveBotaoEstarDesabilitado = (
        convitesPendentes.length === 2 ||  // 2 pendentes
        convitesAceitos.length === 2 ||    // 2 aceitos
        (convitesAceitos.length === 1 && convitesPendentes.length === 1) // 1 aceito + 1 pendente
    );

    // Para o formulário, só mostrar se ainda pode enviar convites
    const podeEnviarMaisConvites = !deveBotaoEstarDesabilitado;

    // Calcular quantos convites ainda pode enviar
    const convitesDisponiveis = 2 - convitesPendentes.length;

    const handleEnviarConvites = async () => {
        if (orientadoresSelecionados.length === 0) {
            setError("Por favor, selecione pelo menos um orientador");
            return;
        }

        if (orientadoresSelecionados.length > convitesDisponiveis) {
            setError(
                `Você só pode enviar mais ${convitesDisponiveis} convite(s). Você já tem ${convitesPendentes.length} convite(s) pendente(s).`
            );
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Enviar convites para cada orientador selecionado
            for (const codigoDocente of orientadoresSelecionados) {
                const dadosConvite = {
                    id_tcc: idTcc,
                    codigo_docente: codigoDocente,
                    mensagem_envio:
                        mensagem ||
                        `Convite para banca de avaliação - ${
                            tipoConvite === "banca_projeto"
                                ? "Projeto"
                                : "Trabalho Final"
                        }`,
                    orientacao: false, // Sempre false para convites de banca
                };

                await axiosInstance.post("/convites", {
                    formData: dadosConvite,
                });
            }

            if (onConviteEnviado) {
                onConviteEnviado();
            }

            handleClose();
        } catch (error) {
            console.error("Erro ao enviar convites:", error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError("Erro ao enviar convites. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOrientadoresSelecionados([]);
        setMensagem("");
        setError("");
        onClose();
    };

    const handleChangeOrientadores = (event) => {
        const value = event.target.value;

        // Limitar a 2 seleções e verificar disponibilidade
        if (value.length <= convitesDisponiveis) {
            setOrientadoresSelecionados(
                typeof value === "string" ? value.split(",") : value
            );
        } else {
            setError(
                `Você só pode selecionar até ${convitesDisponiveis} orientador(es).`
            );
        }
    };

    // Obter nomes dos orientadores já convidados
    const getOrientadorNome = (codigo) => {
        const orientador = orientadores.find((o) => o.codigo === codigo);
        return orientador ? orientador.nome : codigo;
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {tipoConvite === "banca_projeto"
                    ? "Convite para Banca de Avaliação do Projeto"
                    : "Convite para Banca de Avaliação do Trabalho Final"}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {!idCurso && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Não foi possível identificar o curso. Entre em
                            contato com o suporte.
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Informações sobre convites existentes */}
                    {convitesBanca.length > 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Status dos Convites de Banca:
                            </Typography>

                            {convitesPendentes.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                        <strong>
                                            Pendentes (
                                            {convitesPendentes.length}):
                                        </strong>
                                    </Typography>
                                    {convitesPendentes.map((convite, index) => (
                                        <Chip
                                            key={index}
                                            label={`${getOrientadorNome(
                                                convite.codigo_docente
                                            )} - Aguardando resposta`}
                                            color="warning"
                                            size="small"
                                            sx={{ mr: 1, mb: 0.5 }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {convitesAceitos.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                        <strong>
                                            Aceitos ({convitesAceitos.length}):
                                        </strong>
                                    </Typography>
                                    {convitesAceitos.map((convite, index) => (
                                        <Chip
                                            key={index}
                                            label={`${getOrientadorNome(
                                                convite.codigo_docente
                                            )} - Aceito`}
                                            color="success"
                                            size="small"
                                            sx={{ mr: 1, mb: 0.5 }}
                                        />
                                    ))}
                                </Box>
                            )}

                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Você pode enviar até {convitesDisponiveis}{" "}
                                convite(s) adicional(is).
                                {convitesAceitos.length === 2 &&
                                    " Você já tem 2 convites aceitos! 🎉"}
                            </Typography>
                        </Alert>
                    )}

                    {!deveBotaoEstarDesabilitado ? (
                        <>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>
                                    Selecione os Orientadores para a Banca
                                </InputLabel>
                                <Select
                                    multiple
                                    value={orientadoresSelecionados}
                                    onChange={handleChangeOrientadores}
                                    input={
                                        <OutlinedInput label="Selecione os Orientadores para a Banca" />
                                    }
                                    renderValue={(selected) => (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 0.5,
                                            }}
                                        >
                                            {selected.map((codigo) => (
                                                <Chip
                                                    key={codigo}
                                                    label={getOrientadorNome(
                                                        codigo
                                                    )}
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                    disabled={
                                        loadingOrientadores ||
                                        !idCurso ||
                                        convitesDisponiveis === 0
                                    }
                                >
                                    {loadingOrientadores ? (
                                        <MenuItem disabled>
                                            <CircularProgress
                                                size={20}
                                                sx={{ mr: 1 }}
                                            />
                                            Carregando orientadores...
                                        </MenuItem>
                                    ) : (
                                        (Array.isArray(orientadores)
                                            ? orientadores
                                            : []
                                        ).map((orientador) => {
                                            // Verificar se é o orientador atual
                                            const ehOrientador =
                                                conviteOrientacao &&
                                                conviteOrientacao.codigo_docente ===
                                                    orientador.codigo &&
                                                conviteOrientacao.aceito ===
                                                    true;

                                            // Verificar se o orientador já tem convite pendente ou aceito para banca
                                            const jaConvidado =
                                                convitesBanca.some(
                                                    (convite) =>
                                                        convite.codigo_docente ===
                                                            orientador.codigo &&
                                                        (!convite.data_feedback ||
                                                            convite.aceito)
                                                );

                                            const isDisabled =
                                                jaConvidado || ehOrientador;
                                            const secondaryText = ehOrientador
                                                ? "Orientador do TCC"
                                                : jaConvidado
                                                ? "Já convidado"
                                                : "";

                                            return (
                                                <MenuItem
                                                    key={orientador.codigo}
                                                    value={orientador.codigo}
                                                    disabled={isDisabled}
                                                >
                                                    <Checkbox
                                                        checked={
                                                            orientadoresSelecionados.indexOf(
                                                                orientador.codigo
                                                            ) > -1
                                                        }
                                                    />
                                                    <ListItemText
                                                        primary={`${orientador.nome} - ${orientador.codigo}`}
                                                        secondary={
                                                            secondaryText
                                                        }
                                                    />
                                                </MenuItem>
                                            );
                                        })
                                    )}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Mensagem do Convite"
                                value={mensagem}
                                onChange={(e) => setMensagem(e.target.value)}
                                placeholder="Escreva uma mensagem personalizada para os membros da banca..."
                                sx={{ mb: 2 }}
                                helperText={`Você pode selecionar até ${convitesDisponiveis} orientador(es) para enviar convites.`}
                            />
                        </>
                    ) : (
                        <Alert severity="info">
                            <Typography variant="body2">
                                {convitesAceitos.length === 2
                                    ? "Sua banca está completa com 2 membros confirmados!"
                                    : convitesPendentes.length === 2
                                    ? "Você tem 2 convites pendentes. Aguarde as respostas antes de enviar novos convites."
                                    : "Você tem 1 convite aceito e 1 pendente. Aguarde a resposta do convite pendente."
                                }
                            </Typography>
                        </Alert>
                    )}

                    {convitesAceitos.length === 2 && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Excelente!</strong> Você já tem 2
                                membros confirmados para sua banca de avaliação.
                                Agora você pode prosseguir para a próxima etapa.
                            </Typography>
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Fechar
                </Button>
                <Button
                    onClick={handleEnviarConvites}
                    variant="contained"
                    disabled={
                        loading ||
                        deveBotaoEstarDesabilitado ||
                        orientadoresSelecionados.length === 0
                    }
                >
                    {loading ? (
                        <CircularProgress size={20} />
                    ) : deveBotaoEstarDesabilitado ? (
                        convitesAceitos.length === 2 ? "Banca Completa" :
                        convitesPendentes.length === 2 ? "Aguardando Respostas" :
                        "Aguardando Confirmação"
                    ) : (
                        `Enviar ${orientadoresSelecionados.length} Convite(s)`
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
