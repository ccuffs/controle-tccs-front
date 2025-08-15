import React, { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import TemasTcc from "./TemasTcc";
import ConvitesRecebidosOrientador from "./ConvitesRecebidosOrientador";
import TrabalhosOrientador from "./TrabalhosOrientador";
import GerenciarDisponibilidadeBanca from "./GerenciarDisponibilidadeBanca";
import AvaliarDefesasOrientador from "./AvaliarDefesasOrientador";
import Dashboard from "./Dashboard";

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
		<Box sx={{ width: 1400 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Módulo do Orientador
			</Typography>

			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					aria-label="orientador tabs"
				>
					<Tab label="Dashboard" {...a11yProps(0)} />
					<Tab label="Trabalhos Orientados" {...a11yProps(1)} />
					<Tab label="Gerenciar Temas TCC" {...a11yProps(2)} />
					<Tab label="Convites Recebidos" {...a11yProps(3)} />
					<Tab label="Disponibilidade Bancas" {...a11yProps(4)} />
					<Tab label="Avaliar Defesas" {...a11yProps(5)} />
					<Tab label="Outras Funcionalidades" {...a11yProps(6)} />
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<Dashboard forceOrientador={true} />
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<TrabalhosOrientador />
			</TabPanel>

			<TabPanel value={tabValue} index={2}>
				<TemasTcc isOrientadorView={true} />
			</TabPanel>

			<TabPanel value={tabValue} index={3}>
				<ConvitesRecebidosOrientador />
			</TabPanel>

			<TabPanel value={tabValue} index={4}>
				<GerenciarDisponibilidadeBanca />
			</TabPanel>

			<TabPanel value={tabValue} index={5}>
				<AvaliarDefesasOrientador />
			</TabPanel>

			<TabPanel value={tabValue} index={6}>
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
