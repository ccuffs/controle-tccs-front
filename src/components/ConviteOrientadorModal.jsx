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
} from "@mui/material";
import axiosInstance from "../auth/axios";

export default function ConviteOrientadorModal({
    open,
    onClose,
    idTcc,
    idCurso,
    onConviteEnviado,
    conviteExistente = null
}) {
    const [orientadores, setOrientadores] = useState([]);
    const [orientadorSelecionado, setOrientadorSelecionado] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingOrientadores, setLoadingOrientadores] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && idCurso) {
            carregarOrientadores();
            if (conviteExistente) {
                setOrientadorSelecionado(conviteExistente.codigo_docente);
                setMensagem(conviteExistente.mensagem_envio || "");
            }
        }
    }, [open, conviteExistente, idCurso]);

    const carregarOrientadores = async () => {
        try {
            setLoadingOrientadores(true);
            const response = await axiosInstance.get(`/orientadores/curso/${idCurso}`);

            // Extrair os docentes das orientações
            const orientacoes = response.data?.orientacoes || response.orientacoes || [];
            const docentes = orientacoes.map(orientacao => orientacao.docente).filter(Boolean);

            setOrientadores(docentes);
        } catch (error) {
            console.error("Erro ao carregar orientadores do curso:", error);
            setError("Erro ao carregar lista de orientadores do curso");
        } finally {
            setLoadingOrientadores(false);
        }
    };

    const handleEnviarConvite = async () => {
        if (!orientadorSelecionado) {
            setError("Por favor, selecione um orientador");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const dadosConvite = {
                id_tcc: idTcc,
                codigo_docente: orientadorSelecionado,
                mensagem_envio: mensagem || "Convite para orientação de TCC",
            };

            await axiosInstance.post('/convites', {
                formData: dadosConvite
            });

            if (onConviteEnviado) {
                onConviteEnviado();
            }

            handleClose();
        } catch (error) {
            console.error("Erro ao enviar convite:", error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError("Erro ao enviar convite. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOrientadorSelecionado("");
        setMensagem("");
        setError("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {conviteExistente ? "Convite de Orientador" : "Enviar Convite para Orientador"}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {!idCurso && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Não foi possível identificar o curso. Entre em contato com o suporte.
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Selecione o Orientador</InputLabel>
                        <Select
                            value={orientadorSelecionado}
                            onChange={(e) => setOrientadorSelecionado(e.target.value)}
                            disabled={loadingOrientadores || !!conviteExistente || !idCurso}
                        >
                            {loadingOrientadores ? (
                                <MenuItem disabled>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Carregando orientadores...
                                </MenuItem>
                            ) : (
                                (Array.isArray(orientadores) ? orientadores : []).map((orientador) => (
                                    <MenuItem key={orientador.codigo} value={orientador.codigo}>
                                        {orientador.nome} - {orientador.codigo}
                                    </MenuItem>
                                ))
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
                        placeholder="Escreva uma mensagem personalizada para o orientador..."
                        disabled={!!conviteExistente}
                        sx={{ mb: 2 }}
                    />

                    {conviteExistente && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Status:</strong> {conviteExistente.aceito ? "Aceito" : "Pendente"}
                            </Typography>
                            {conviteExistente.data_envio && (
                                <Typography variant="body2">
                                    <strong>Enviado em:</strong> {new Date(conviteExistente.data_envio).toLocaleDateString('pt-BR')}
                                </Typography>
                            )}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                {!conviteExistente && (
                    <Button
                        onClick={handleEnviarConvite}
                        variant="contained"
                        disabled={loading || !orientadorSelecionado}
                    >
                        {loading ? <CircularProgress size={20} /> : "Enviar Convite"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}