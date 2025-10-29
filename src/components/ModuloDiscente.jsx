import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";

import TccStepper from "./modulo-dicente/TccStepper";
import PerfilDiscente from "./modulo-dicente/PerfilDiscente";
import { useModuloDiscente } from "../hooks/useModuloDiscente.js";

function TabPanel({ children, value, index, ...other }) {
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`dicente-tabpanel-${index}`}
			aria-labelledby={`dicente-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index) {
	return {
		id: `dicente-tab-${index}`,
		"aria-controls": `dicente-tabpanel-${index}`,
	};
}

export default function ModuloDiscente() {
	const {
		tabValue,
		etapaAtual,
		setEtapaAtual,
		loading,
		handleTabChange,
	} = useModuloDiscente();

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
		<Box sx={{ width: 1400 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Módulo do Discente
			</Typography>

			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					aria-label="dicente tabs"
				>
					<Tab label="Meu TCC" {...a11yProps(0)} />
					<Tab label="Meu Perfil" {...a11yProps(1)} />
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				{renderizarConteudo()}
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<PerfilDiscente />
			</TabPanel>
		</Box>
	);
}
