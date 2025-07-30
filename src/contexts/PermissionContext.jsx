import React from "react";
import { Alert, Box } from "@mui/material";
import { useAuth } from "./AuthContext";
import { verificarPermissaoPorIds } from "../utils/permissions";

export default function PermissionContext({
    children,
    permissoes,
    fallback = null,
    showError = true,
}) {
    const { permissoesUsuario } = useAuth();

    let hasPermission = false;

    hasPermission = verificarPermissaoPorIds(permissoesUsuario, permissoes);

    if (!hasPermission) {
        if (fallback) {
            return fallback;
        }

        if (showError) {
            return (
                <Box sx={{ p: 2 }}>
                    <Alert severity="warning">
                        Você não tem permissão para acessar este recurso.
                    </Alert>
                </Box>
            );
        }

        return null;
    }

    return children;
}
