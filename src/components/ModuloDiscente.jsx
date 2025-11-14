import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";

import TccStepper from "./modulo-dicente/TccStepper";
import PerfilDiscente from "./modulo-dicente/PerfilDiscente";
import { useModuloDiscente } from "../hooks/useModuloDiscente.js";
import { AccessibleTabPanel, getA11yProps } from "./customs/AccessibleTabs.jsx";

export default function ModuloDiscente() {
	const { tabValue, etapaAtual, setEtapaAtual, loading, handleTabChange } =
		useModuloDiscente();

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
					<Tab label="Meu TCC" {...getA11yProps("dicente", 0)} />
					<Tab label="Meu Perfil" {...getA11yProps("dicente", 1)} />
				</Tabs>
			</Box>

			<AccessibleTabPanel idPrefix="dicente" value={tabValue} index={0}>
				{renderizarConteudo()}
			</AccessibleTabPanel>

			<AccessibleTabPanel idPrefix="dicente" value={tabValue} index={1}>
				<PerfilDiscente />
			</AccessibleTabPanel>
		</Box>
	);
}
