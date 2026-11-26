import { Icon, PlainButton } from "../ui";
import { caminhoDoItem, type ItemNavegacao, type Perfil } from "./navegacao";

/** Navegação inferior do discente no celular (visível só em telas estreitas, via CSS). */
export function BottomNav({
	perfil,
	itens,
	itemAtivo,
	onNavegar,
}: {
	perfil: Perfil;
	itens: ItemNavegacao[];
	itemAtivo: string | null;
	onNavegar: (caminho: string) => void;
}) {
	return (
		<nav className="bottom-nav" aria-label="Navegação">
			{itens.slice(0, 4).map((item) => (
				<PlainButton
					key={item.id}
					className={item.id === itemAtivo ? "active" : ""}
					onClick={() => onNavegar(caminhoDoItem(perfil, item))}
				>
					<Icon name={item.icone} />
					<span>{item.rotulo}</span>
				</PlainButton>
			))}
		</nav>
	);
}
