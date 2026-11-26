import { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { usePeriodo } from "../../contexts/PeriodoContext";
import { useThemeContext } from "../customs/CustomThemeProvider";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { inicioDoPerfil, itensVisiveis, perfilDaUrl, perfisDoUsuario, type Perfil } from "./navegacao";

const CHAVE_RECOLHIDO = "menu_recolhido";

function lerRecolhido(): boolean {
	try {
		return localStorage.getItem(CHAVE_RECOLHIDO) === "true";
	} catch {
		return false;
	}
}

const ehTelaEstreita = () => typeof window !== "undefined" && window.matchMedia("(max-width: 800px)").matches;

/** Casca do app: menu lateral, barra superior e conteúdo da rota. */
export default function AppLayout() {
	const { usuario, gruposUsuario, logout } = useAuth();
	const { periodos, selecionado, selecionar } = usePeriodo();
	const { mode, toggleTheme } = useThemeContext();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const [recolhido, setRecolhido] = useState(lerRecolhido);
	const [abertoMobile, setAbertoMobile] = useState(false);

	const perfil = perfilDaUrl(pathname);
	const perfis = perfisDoUsuario(gruposUsuario);
	const itens = perfil ? itensVisiveis(perfil, gruposUsuario) : [];
	const segmento = pathname.split("/")[2] ?? "";
	const itemAtivo = itens.find((item) => item.caminho === segmento) ?? null;

	const navegar = useCallback(
		(caminho: string) => {
			navigate(caminho);
			setAbertoMobile(false);
			window.scrollTo({ top: 0, behavior: "smooth" });
		},
		[navigate],
	);

	const alternarRecolhido = useCallback(() => {
		setRecolhido((atual) => {
			try {
				localStorage.setItem(CHAVE_RECOLHIDO, String(!atual));
			} catch {
				// preferência apenas de conveniência
			}
			return !atual;
		});
	}, []);

	const trocarPerfil = (novo: Perfil) => {
		const destino = inicioDoPerfil(novo, gruposUsuario);
		if (destino) navegar(destino);
	};

	return (
		<div className="app">
			{perfil && (
				<Sidebar
					perfil={perfil}
					itens={itens}
					itemAtivo={itemAtivo?.id ?? null}
					recolhido={recolhido}
					abertoMobile={abertoMobile}
					onNavegar={navegar}
					onFecharMobile={() => setAbertoMobile(false)}
					onAlternarRecolhido={alternarRecolhido}
					onSair={logout}
				/>
			)}
			{abertoMobile && <div className="mobile-scrim" onClick={() => setAbertoMobile(false)} />}
			<div className="app-main" style={perfil ? undefined : { marginLeft: 0 }}>
				<Topbar
					tituloPagina={itemAtivo?.rotulo ?? "Gestão de TCCs"}
					nomeUsuario={usuario?.nome ?? usuario?.id ?? ""}
					perfil={perfil}
					perfisDisponiveis={perfis}
					periodos={periodos}
					periodoSelecionado={selecionado}
					escuro={mode === "dark"}
					onAbrirMenu={() => (ehTelaEstreita() ? setAbertoMobile(true) : alternarRecolhido())}
					onSelecionarPeriodo={selecionar}
					onAlternarTema={toggleTheme}
					onTrocarPerfil={trocarPerfil}
					onSair={logout}
				/>
				<main className="content">
					<Outlet />
				</main>
			</div>
			{perfil === "discente" && (
				<BottomNav perfil={perfil} itens={itens} itemAtivo={itemAtivo?.id ?? null} onNavegar={navegar} />
			)}
		</div>
	);
}
