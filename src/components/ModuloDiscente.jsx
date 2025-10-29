import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import TccStepper from "./modulo-discente/TccStepper";
import PerfilDiscente from "./modulo-discente/PerfilDiscente";
import { AuthContext } from "../contexts/AuthContext";
import axiosInstance from "../auth/axios";

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
	const { usuario } = useContext(AuthContext);
	const [tabValue, setTabValue] = useState(0);
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
				`/dicentes/usuario/${usuario.id}`,
			);

			if (responseDiscente && responseDiscente.matricula) {
				// Buscar o trabalho de conclusão do discente
				const responseTcc = await axiosInstance.get(
					`/trabalho-conclusao/discente/${responseDiscente.matricula}`,
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

	const handleTabChange = (event, newValue) => {
		setTabValue(newValue);
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
