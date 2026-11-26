import { Icon, PlainButton } from "../ui";
import { caminhoDoItem, type ItemNavegacao, type Perfil } from "./navegacao";

interface SidebarProps {
	perfil: Perfil;
	itens: ItemNavegacao[];
	itemAtivo: string | null;
	recolhido: boolean;
	abertoMobile: boolean;
	badges?: Partial<Record<string, number>>;
	onNavegar: (caminho: string) => void;
	onFecharMobile: () => void;
	onAlternarRecolhido: () => void;
	onSair: () => void;
}

export function Sidebar({
	perfil,
	itens,
	itemAtivo,
	recolhido,
	abertoMobile,
	badges = {},
	onNavegar,
	onFecharMobile,
	onAlternarRecolhido,
	onSair,
}: SidebarProps) {
	return (
		<aside className={`sidebar ${recolhido ? "collapsed" : ""} ${abertoMobile ? "mobile-open" : ""}`}>
			<div className="sidebar-brand">
				<div className="brand-mark">
					<span>UFFS</span>
					<i />
				</div>
				<div>
					<strong>Gestão de TCCs</strong>
					<small>Campus Chapecó</small>
				</div>
				<PlainButton className="icon-button close-mobile" onClick={onFecharMobile} aria-label="Fechar menu">
					<Icon name="close" />
				</PlainButton>
			</div>
			<nav aria-label="Menu principal">
				{itens.map((item, indice) => {
					const grupoAnterior = indice > 0 ? itens[indice - 1]?.grupoMenu : undefined;
					const mostrarGrupo = item.grupoMenu && item.grupoMenu !== grupoAnterior;
					const ativo = item.id === itemAtivo;
					const badge = badges[item.id];
					return (
						<div key={item.id}>
							{mostrarGrupo && <span className="nav-group">{item.grupoMenu}</span>}
							<PlainButton
								className={ativo ? "active" : ""}
								aria-current={ativo ? "page" : undefined}
								onClick={() => onNavegar(caminhoDoItem(perfil, item))}
								title={recolhido ? item.rotulo : undefined}
							>
								<Icon name={item.icone} />
								<span>{item.rotulo}</span>
								{badge ? <em>{badge}</em> : null}
							</PlainButton>
						</div>
					);
				})}
			</nav>
			<div className="sidebar-bottom">
				<PlainButton onClick={onSair}>
					<Icon name="logout" />
					<span>Sair</span>
				</PlainButton>
				<PlainButton className="collapse-button" onClick={onAlternarRecolhido}>
					<Icon name={recolhido ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"} />
					<span>Recolher menu</span>
				</PlainButton>
			</div>
		</aside>
	);
}
