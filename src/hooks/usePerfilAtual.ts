import { useLocation } from "react-router";
import { perfilDaUrl, type Perfil } from "../components/layout/navegacao";

/** Perfil ativo (primeiro segmento da URL), para telas compartilhadas entre perfis. */
export function usePerfilAtual(): Perfil | null {
	return perfilDaUrl(useLocation().pathname);
}
