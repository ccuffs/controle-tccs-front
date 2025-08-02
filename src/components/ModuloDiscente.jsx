import React, { useState, useEffect, useContext } from "react";
import { Box, Typography } from "@mui/material";
import TccStepper from "./TccStepper";
import { AuthContext } from "../contexts/AuthContext";
import axiosInstance from "../auth/axios";

export default function ModuloDiscente() {
    const { usuario } = useContext(AuthContext);
    const [etapaAtual, setEtapaAtual] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (usuario) {
            carregarEtapaAtual();
        }
    }, [usuario]);

    const carregarEtapaAtual = async () => {
        try {
            setLoading(true);

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
                    setEtapaAtual(responseTcc.etapa || 0);
                } else {
                    setEtapaAtual(0); // Se não existe TCC, começa na etapa 0
                }
            } else {
                setEtapaAtual(0); // Se não existe discente, começa na etapa 0
            }
        } catch (error) {
            console.error("Erro ao carregar etapa atual:", error);
            setEtapaAtual(0); // Em caso de erro, começa na etapa 0
        } finally {
            setLoading(false);
        }
    };

    const renderizarConteudo = () => {
        if (loading) {
            return (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                    <Typography>Carregando...</Typography>
                </Box>
            );
        }

        return (
            <TccStepper
                etapaInicial={etapaAtual}
                onEtapaChange={setEtapaAtual}
            />
        );
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Módulo do Discente
            </Typography>

            {renderizarConteudo()}
        </Box>
    );
}
