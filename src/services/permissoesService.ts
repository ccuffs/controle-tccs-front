import type { Grupo, Permissao } from "../types/usuario";

type GrupoRequerido = number | string | { id?: number; nome?: string };

const permissoesService = {
	verificarPermissaoPorId(
		permissoes: Permissao[] | undefined,
		permissaoId: number,
	): boolean {
		if (!permissoes || !Array.isArray(permissoes)) {
			return false;
		}

		return permissoes.some((permissao) => permissao.id === permissaoId);
	},

	verificarPermissaoPorIds(
		permissoes: Permissao[] | undefined,
		permissaoIds: number | number[],
	): boolean {
		if (!permissoes || !Array.isArray(permissoes)) {
			return false;
		}

		const ids = Array.isArray(permissaoIds) ? permissaoIds : [permissaoIds];

		const resultado = ids.some((id) =>
			permissoes.some((permissao) => permissao.id === id),
		);

		return resultado;
	},

	verificarPermissaoPorGrupos(
		gruposUsuario: Grupo[] | undefined,
		gruposRequeridos: GrupoRequerido | GrupoRequerido[],
	): boolean {
		if (!gruposUsuario || !Array.isArray(gruposUsuario)) {
			return false;
		}

		const requeridos = Array.isArray(gruposRequeridos)
			? gruposRequeridos
			: [gruposRequeridos];

		// Verificar se o usuário tem pelo menos um dos grupos requeridos
		const resultado = requeridos.some((grupoRequerido) => {
			// Se grupoRequerido é um número (ID do grupo)
			if (typeof grupoRequerido === "number") {
				return gruposUsuario.some((grupo) => grupo.id === grupoRequerido);
			}
			// Se grupoRequerido é uma string (nome do grupo)
			else if (typeof grupoRequerido === "string") {
				return gruposUsuario.some((grupo) => grupo.nome === grupoRequerido);
			}
			// Se grupoRequerido é um objeto com id ou nome
			else if (typeof grupoRequerido === "object") {
				if (grupoRequerido.id) {
					return gruposUsuario.some(
						(grupo) => grupo.id === grupoRequerido.id,
					);
				}
				if (grupoRequerido.nome) {
					return gruposUsuario.some(
						(grupo) => grupo.nome === grupoRequerido.nome,
					);
				}
			}
			return false;
		});

		return resultado;
	},
};

export default permissoesService;
