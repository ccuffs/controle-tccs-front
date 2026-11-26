import { useCallback, useEffect, useState } from "react";
import { getMeuPerfil } from "../services/perfil-dicente-service";
import trabalhoConclusaoService from "../services/trabalho-conclusao-service";
import type { Dicente } from "../types/dicente";
import type { TrabalhoConclusao } from "../types/trabalho-conclusao";

/** Discente logado e seu TCC da oferta atual (ou o mais recente, se não houver na oferta atual). */
export function useTccDiscente() {
	const [dicente, setDicente] = useState<Dicente | null>(null);
	const [tcc, setTcc] = useState<TrabalhoConclusao | null>(null);
	const [carregando, setCarregando] = useState(true);
	const [versao, setVersao] = useState(0);

	useEffect(() => {
		let ativo = true;
		(async () => {
			setCarregando(true);
			try {
				const d = await getMeuPerfil();
				if (!ativo) return;
				setDicente(d);
				const atual = await trabalhoConclusaoService.getTrabalhoConclusaoByDiscenteOfertaAtual(d.matricula);
				const trabalho = atual ?? (await trabalhoConclusaoService.getTrabalhoConclusaoByDiscente(d.matricula).catch(() => null));
				if (ativo) setTcc(trabalho);
			} catch {
				if (ativo) setTcc(null);
			} finally {
				if (ativo) setCarregando(false);
			}
		})();
		return () => {
			ativo = false;
		};
	}, [versao]);

	const recarregar = useCallback(() => setVersao((v) => v + 1), []);
	return { dicente, tcc, carregando, recarregar };
}
