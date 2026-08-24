import { useState, useEffect, useContext, useCallback, type SyntheticEvent } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axiosInstance from "../auth/axios";
import dicentesService from "../services/dicentes-service";
import trabalhoConclusaoService from "../services/trabalho-conclusao-service";
import moduloDiscenteController from "../controllers/modulo-discente-controller";

interface OfertaResumo {
	ano: number;
	semestre: number;
}

interface TccResumo {
	ano?: number;
	semestre?: number;
	etapa?: number | null;
}

export function useModuloDiscente() {
	const { usuario } = useContext(AuthContext) ?? {};
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
				// Buscar a última oferta para determinar o semestre corrente
				let oferta: OfertaResumo | null = null;
				try {
					oferta = await axiosInstance.get<OfertaResumo>(
						"/ofertas-tcc/ultima",
					);
				} catch {
					// sem oferta cadastrada — etapa permanece 0
				}

				if (oferta?.ano && oferta?.semestre) {
					// O backend ordena por fase DESC, então o TCC retornado é
					// sempre o de fase mais avançada para o semestre corrente.
					try {
						const tcc: TccResumo | null =
							await trabalhoConclusaoService.getTrabalhoConclusaoByDiscente(
								matricula,
							);
						if (
							tcc &&
							tcc.ano === oferta.ano &&
							tcc.semestre === oferta.semestre
						) {
							etapa =
								moduloDiscenteController.processTccResponse(tcc);
						}
					} catch {
						// nenhum TCC encontrado — etapa permanece 0
					}
				}
			}

			setEtapaAtual(etapa);
		} catch (error) {
			console.error("Erro ao carregar etapa atual:", error);
			setEtapaAtual(0);
		} finally {
			setLoading(false);
		}
	}, [usuario]);

	useEffect(() => {
		carregarEtapaAtual();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usuario]);

	const handleTabChange = useCallback((_event: SyntheticEvent, newValue: number) => {
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
