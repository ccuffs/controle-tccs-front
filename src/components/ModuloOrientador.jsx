import React, { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import GerenciarTemasOrientador from "./GerenciarTemasOrientador";
import ConvitesRecebidosOrientador from "./ConvitesRecebidosOrientador";

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`orientador-tabpanel-${index}`}
            aria-labelledby={`orientador-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `orientador-tab-${index}`,
        "aria-controls": `orientador-tabpanel-${index}`,
    };
}

export default function ModuloOrientador() {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Módulo do Orientador
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="orientador tabs"
                >
                    <Tab label="Gerenciar Temas TCC" {...a11yProps(0)} />
                    <Tab label="Convites Recebidos" {...a11yProps(1)} />
                    <Tab label="Outras Funcionalidades" {...a11yProps(2)} />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <GerenciarTemasOrientador />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <ConvitesRecebidosOrientador />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" component="h2">
                    Outras Funcionalidades do Orientador
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Aqui serão adicionadas outras funcionalidades específicas
                    para orientadores.
                </Typography>
            </TabPanel>
        </Box>
    );
}
