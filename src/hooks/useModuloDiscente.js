import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import dicentesService from "../services/dicentes-service.js";
import trabalhoConclusaoService from "../services/trabalho-conclusao-service.js";
import moduloDiscenteController from "../controllers/modulo-discente-controller.js";

export function useModuloDiscente() {
	const { usuario } = useContext(AuthContext);
	const [tabValue, setTabValue] = useState(0);
	const [etapaAtual, setEtapaAtual] = useState(0);
	const [loading, setLoading] = useState(true);

	const carregarEtapaAtual = useCallback(async () => {
		if (!usuario) return;

		try {
			setLoading(true);

			// Buscar o dicente pelo id_usuario
			const responseDiscente = await dicentesService.getDicenteByUsuario(
				usuario.id,
			);
			const matricula =
				moduloDiscenteController.processDicenteResponse(
					responseDiscente,
				);

			let etapa = 0;

			if (matricula) {
				// Buscar o trabalho de conclusão do discente
				try {
					const responseTcc =
						await trabalhoConclusaoService.getTrabalhoConclusaoByDiscente(
							matricula,
						);
					etapa =
						moduloDiscenteController.processTccResponse(
							responseTcc,
						);
				} catch (tccError) {
					// Se não existe TCC ou erro ao buscar, etapa permanece 0
					console.log("Trabalho de conclusão não encontrado");
					etapa = 0;
				}
			}

			setEtapaAtual(etapa);
		} catch (error) {
			console.error("Erro ao carregar etapa atual:", error);
			setEtapaAtual(0); // Em caso de erro, começa na etapa 0
		} finally {
			setLoading(false);
		}
	}, [usuario]);

	useEffect(() => {
		carregarEtapaAtual();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usuario]);

	const handleTabChange = useCallback((event, newValue) => {
		setTabValue(newValue);
	}, []);

	return {
		tabValue,
		etapaAtual,
		setEtapaAtual,
		loading,
		handleTabChange,
	};
}
