import { rotuloPeriodo, usePeriodo } from "../../contexts/PeriodoContext";
import { Icon } from "./Icon";

/**
 * Aviso para telas que mostram um único período (painéis, grade, vagas…):
 * com "Todos os períodos" no topo, elas exibem o período atual.
 */
export function AvisoPeriodoUnico() {
	const { todos, periodoEfetivo } = usePeriodo();
	if (!todos) return null;
	return (
		<div className="inline-banner" role="status" style={{ margin: "0 0 16px", alignItems: "center" }}>
			<Icon name="info" size={18} />
			<span>
				Esta tela mostra um período por vez — exibindo {rotuloPeriodo(periodoEfetivo)} (atual). Escolha outro período no
				seletor do topo.
			</span>
		</div>
	);
}
