import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Permissoes } from "../enums/permissoes";
import cursosService from "../services/cursos-service";
import type { Curso } from "../types/curso";

/**
 * Cursos que o coordenador pode filtrar: ADMIN vê todos; PROFESSOR_CCR vê os
 * cursos vinculados ao usuário. `padrao` é o id do curso quando há apenas um.
 */
export function useCursosCoordenacao() {
	const { usuario, gruposUsuario } = useAuth();
	const ehAdmin = gruposUsuario.some((g) => g.id === Permissoes.GRUPOS.ADMIN);
	const [cursos, setCursos] = useState<Curso[]>([]);
	const [carregando, setCarregando] = useState(true);

	useEffect(() => {
		let ativo = true;
		(async () => {
			setCarregando(true);
			try {
				const lista = ehAdmin ? await cursosService.getCursos() : (usuario?.cursos ?? []);
				if (ativo) setCursos(lista ?? []);
			} catch {
				if (ativo) setCursos(usuario?.cursos ?? []);
			} finally {
				if (ativo) setCarregando(false);
			}
		})();
		return () => {
			ativo = false;
		};
	}, [ehAdmin, usuario]);

	const padrao = cursos.length === 1 && cursos[0] ? String(cursos[0].id) : "";
	return { cursos, padrao, carregando };
}

export function nomeCurso(curso: Pick<Curso, "nome" | "codigo">): string {
	return curso.nome ?? `Curso ${curso.codigo ?? ""}`.trim();
}
