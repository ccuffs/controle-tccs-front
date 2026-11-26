import { Box, Typography } from "@mui/material";
import { useModuloDiscente } from "../../hooks/useModuloDiscente";
import TccStepper from "../modulo-dicente/TccStepper";

/** Rota /discente/meu-tcc (antes, aba "Meu TCC" do Módulo do Discente). */
export default function MeuTcc() {
	const { etapaAtual, setEtapaAtual, loading } = useModuloDiscente();

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
				<Typography>Carregando...</Typography>
			</Box>
		);
	}

	return <TccStepper etapaInicial={etapaAtual} onEtapaChange={setEtapaAtual} />;
}
