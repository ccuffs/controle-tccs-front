import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { Card, EmptyState } from "../ui";
import { NAVEGACAO, inicioDoPerfil, inicioDoUsuario, itemPermitido, perfisDoUsuario, type Perfil } from "./navegacao";

/** Redireciona para a página inicial do usuário conforme seus grupos. */
export function RedirecionarInicio() {
	const { gruposUsuario } = useAuth();
	const destino = inicioDoUsuario(gruposUsuario);
	if (destino) return <Navigate to={destino} replace />;
	return (
		<Card className="card">
			<EmptyState
				icon="lock"
				title="Sem perfil de acesso"
				text="Seu usuário ainda não está vinculado a nenhum perfil do sistema. Procure a coordenação do curso."
			/>
		</Card>
	);
}

/** Índice de um perfil (ex.: /orientador): vai para a primeira página permitida dele. */
export function RedirecionarInicioPerfil({ perfil }: { perfil: Perfil }) {
	const { gruposUsuario } = useAuth();
	const destino = inicioDoPerfil(perfil, gruposUsuario);
	return destino ? <Navigate to={destino} replace /> : <RedirecionarInicio />;
}

/** Libera as rotas filhas apenas para quem tem o perfil. */
export function ExigirPerfil({ perfil }: { perfil: Perfil }) {
	const { gruposUsuario } = useAuth();
	if (!perfisDoUsuario(gruposUsuario).includes(perfil)) return <RedirecionarInicio />;
	return <Outlet />;
}

/** Libera a página apenas se o item de menu correspondente for permitido ao usuário. */
export function ExigirItem({ perfil, id, children }: { perfil: Perfil; id: string; children: ReactNode }) {
	const { gruposUsuario } = useAuth();
	const item = NAVEGACAO[perfil].find((i) => i.id === id);
	if (!item || !itemPermitido(item, gruposUsuario)) return <RedirecionarInicio />;
	return <>{children}</>;
}
