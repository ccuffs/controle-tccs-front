import { useEffect, useRef } from "react";
import { useBlocker } from "react-router";
import type { GerenciarDisponibilidadeHandle } from "../../hooks/useGerenciarDisponibilidadeBanca";
import GerenciarDisponibilidadeBanca from "../modulo-orientador/GerenciarDisponibilidadeBanca";

/**
 * Rota /orientador/disponibilidade. Mantém a proteção que existia na troca de abas:
 * com alterações não salvas, a navegação é bloqueada e a tela mostra seu diálogo de confirmação.
 */
export default function Disponibilidade() {
	const ref = useRef<GerenciarDisponibilidadeHandle | null>(null);
	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			currentLocation.pathname !== nextLocation.pathname && Boolean(ref.current?.hasUnsavedChanges()),
	);

	useEffect(() => {
		if (blocker.state !== "blocked") return;
		// confirmNavigation abre o diálogo da própria tela e retorna false enquanto houver alterações.
		if (ref.current?.confirmNavigation()) blocker.proceed();
		else blocker.reset();
	}, [blocker]);

	return <GerenciarDisponibilidadeBanca ref={ref} />;
}
