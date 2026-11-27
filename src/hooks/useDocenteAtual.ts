import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMeuPerfil } from "../services/perfil-orientador-service";
import type { Docente } from "../types/docente";

// Um carregamento por usuário logado, compartilhado entre as telas do orientador.
let cache: { usuario: string; promessa: Promise<Docente | null> } | null = null;

/** Docente vinculado ao usuário logado (GET /docentes/meu-perfil). */
export function useDocenteAtual() {
	const { usuario } = useAuth();
	const [docente, setDocente] = useState<Docente | null>(null);
	const [carregando, setCarregando] = useState(true);

	useEffect(() => {
		if (!usuario?.id) return;
		if (!cache || cache.usuario !== usuario.id) {
			const promessa: Promise<Docente | null> = getMeuPerfil().catch(() => {
				// Não guarda a falha: a próxima tela que usar o hook tenta de novo.
				if (cache?.promessa === promessa) cache = null;
				return null;
			});
			cache = { usuario: usuario.id, promessa };
		}
		let ativo = true;
		cache.promessa.then((d) => {
			if (!ativo) return;
			setDocente(d);
			setCarregando(false);
		});
		return () => {
			ativo = false;
		};
	}, [usuario?.id]);

	return { docente, codigo: docente?.codigo ?? null, carregando };
}
