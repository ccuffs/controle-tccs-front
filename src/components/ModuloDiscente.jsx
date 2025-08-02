import React, { useState } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab
} from "@mui/material";
import VisualizarTemasTCC from "./VisualizarTemasTCC";
import TccStepper from "./TccStepper";

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`discente-tabpanel-${index}`}
            aria-labelledby={`discente-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `discente-tab-${index}`,
        'aria-controls': `discente-tabpanel-${index}`,
    };
}

export default function ModuloDiscente() {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Módulo do Discente
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="discente tabs"
                >
                    <Tab
                        label="Visualizar Temas TCC"
                        {...a11yProps(0)}
                    />
                    <Tab
                        label="Desenvolvimento do TCC"
                        {...a11yProps(1)}
                    />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <VisualizarTemasTCC />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <TccStepper />
            </TabPanel>
        </Box>
    );
}