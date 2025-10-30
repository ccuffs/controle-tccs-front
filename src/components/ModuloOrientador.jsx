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
import { AccessibleTabPanel, getA11yProps } from "./customs/AccessibleTabs.jsx";



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
					<Tab label="Dashboard" {...getA11yProps("orientador", 0)} />
					<Tab label="Trabalhos Orientados" {...getA11yProps("orientador", 1)} />
					<Tab label="Gerenciar Temas TCC" {...getA11yProps("orientador", 2)} />
					<Tab label="Convites Recebidos" {...getA11yProps("orientador", 3)} />
					<Tab label="Disponibilidade Bancas" {...getA11yProps("orientador", 4)} />
					<Tab label="Avaliar Defesas" {...getA11yProps("orientador", 5)} />
					<Tab label="Emitir Declarações" {...getA11yProps("orientador", 6)} />
					<Tab label="Meu Perfil" {...getA11yProps("orientador", 7)} />
				</Tabs>
			</Box>

			<AccessibleTabPanel idPrefix="orientador" value={tabValue} index={0}>
				<Dashboard forceOrientador={true} />
			</AccessibleTabPanel>

			<AccessibleTabPanel idPrefix="orientador" value={tabValue} index={1}>
				<Orientacao isOrientadorView={true} />
			</AccessibleTabPanel>

			<AccessibleTabPanel idPrefix="orientador" value={tabValue} index={2}>
				<TemasTcc isOrientadorView={true} />
			</AccessibleTabPanel>

			<AccessibleTabPanel idPrefix="orientador" value={tabValue} index={3}>
				<ConvitesRecebidosOrientador />
			</AccessibleTabPanel>

			<AccessibleTabPanel idPrefix="orientador" value={tabValue} index={4}>
				<GerenciarDisponibilidadeBanca
					ref={gerenciarDisponibilidadeRef}
				/>
			</AccessibleTabPanel>

			<AccessibleTabPanel idPrefix="orientador" value={tabValue} index={5}>
				<AvaliarDefesasOrientador />
			</AccessibleTabPanel>

			<AccessibleTabPanel idPrefix="orientador" value={tabValue} index={6}>
				<EmitirDeclaracoes />
			</AccessibleTabPanel>

			<AccessibleTabPanel idPrefix="orientador" value={tabValue} index={7}>
				<PerfilOrientador />
			</AccessibleTabPanel>
		</Box>
	);
}
