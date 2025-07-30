import React from "react";
import { Alert, Box } from "@mui/material";
import { useAuth } from "./AuthContext";
import { verificarPermissaoPorIds } from "../utils/permissions";

export default function PermissionContext({
    children,
    permissoes,
    fallback = null,
    showError = true, // Controla se deve exibir a mensagem de alerta quando não há permissão
}) {
    const { permissoesUsuario } = useAuth();

    let hasPermission = false;

    hasPermission = verificarPermissaoPorIds(permissoesUsuario, permissoes);

    if (!hasPermission) {
        // Se um fallback foi fornecido, sempre retorna ele
        if (fallback) {
            return fallback;
        }

        // Se showError é true, exibe a mensagem de alerta
        if (showError) {
            return (
                <Box sx={{ p: 2 }}>
                    <Alert severity="warning">
                        Você não tem permissão para acessar este recurso.
                    </Alert>
                </Box>
            );
        }

        // Se showError é false, retorna null (não exibe nada)
        return null;
    }

    return children;
}
