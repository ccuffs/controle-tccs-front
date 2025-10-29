import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";

import Dashboard from "./Dashboard";
import Orientacao from "./modulo-orientador/Orientacao";
import TemasTcc from "./modulo-orientador/TemasTcc";
import ConvitesRecebidosOrientador from "./modulo-orientador/ConvitesRecebidosOrientador";
import GerenciarDisponibilidadeBanca from "./modulo-orientador/GerenciarDisponibilidadeBanca";
import AvaliarDefesasOrientador from "./modulo-orientador/AvaliarDefesasOrientador";
import EmitirDeclaracoes from "./modulo-orientador/EmitirDeclaracoes";
import PerfilOrientador from "./modulo-orientador/PerfilOrientador";
import { useModuloOrientador } from "../hooks/useModuloOrientador.js";

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
	const { tabValue, gerenciarDisponibilidadeRef, handleTabChange } =
		useModuloOrientador();

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
					<Tab label="Emitir Declarações" {...a11yProps(6)} />
					<Tab label="Meu Perfil" {...a11yProps(7)} />
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<Dashboard forceOrientador={true} />
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<Orientacao isOrientadorView={true} />
			</TabPanel>

			<TabPanel value={tabValue} index={2}>
				<TemasTcc isOrientadorView={true} />
			</TabPanel>

			<TabPanel value={tabValue} index={3}>
				<ConvitesRecebidosOrientador />
			</TabPanel>

			<TabPanel value={tabValue} index={4}>
				<GerenciarDisponibilidadeBanca
					ref={gerenciarDisponibilidadeRef}
				/>
			</TabPanel>

			<TabPanel value={tabValue} index={5}>
				<AvaliarDefesasOrientador />
			</TabPanel>

			<TabPanel value={tabValue} index={6}>
				<EmitirDeclaracoes />
			</TabPanel>

			<TabPanel value={tabValue} index={7}>
				<PerfilOrientador />
			</TabPanel>
		</Box>
	);
}
