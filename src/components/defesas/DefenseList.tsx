import { useState, type ReactNode } from "react";
import type { DefesaAgenda } from "../../types/dashboard";
import { ActionIconButton, Card, DateTile, Icon, StatusChip } from "../ui";
import DefenseDetailDrawer from "./DefenseDetailDrawer";

interface DefenseListProps {
	defesas: DefesaAgenda[];
	titulo?: string;
	subtitulo?: string;
	acao?: ReactNode;
	carregando?: boolean;
	/** Mostra o papel do docente (Orientador/Avaliador) na linha. */
	modoDocente?: boolean;
	/** Ações do rodapé do painel de detalhes. */
	acoesDetalhe?: (defesa: DefesaAgenda, fechar: () => void) => ReactNode;
	/** Conteúdo extra no fim do painel de detalhes (ex.: histórico). */
	extraDetalhe?: (defesa: DefesaAgenda) => ReactNode;
	vazio?: { titulo: string; texto: string };
	/** Quantidade máxima de linhas exibidas (ex.: 5 na Visão geral). */
	limite?: number;
}

/** Lista "Próximas defesas" do design, com painel de detalhes ao clicar. */
export default function DefenseList({
	defesas,
	titulo = "Próximas defesas",
	subtitulo = "Agenda confirmada para os próximos 30 dias",
	acao,
	carregando = false,
	modoDocente = false,
	acoesDetalhe,
	extraDetalhe,
	vazio = { titulo: "Nenhuma defesa encontrada", texto: "Não há defesas para a combinação de filtros selecionada." },
	limite,
}: DefenseListProps) {
	const visiveis = limite ? defesas.slice(0, limite) : defesas;
	const [selecionada, setSelecionada] = useState<DefesaAgenda | null>(null);

	return (
		<Card className="card defenses">
			<div className="card-title">
				<div>
					<h2>{titulo}</h2>
					<p>{subtitulo}</p>
				</div>
				{acao}
			</div>
			<div className="defense-list">
				{visiveis.map((defesa) => (
					<div className="defense-row" key={`${defesa.id_tcc}-${defesa.fase}-${defesa.data_hora}`}>
						<DateTile data={defesa.data} />
						<div className="defense-main">
							<strong>{defesa.estudante}</strong>
							<span>{defesa.titulo || "Título não informado"}</span>
							{modoDocente ? (
								<small className="participation-line">
									<StatusChip type="neutral">{defesa.papel_docente === "orientador" ? "Orientador" : "Avaliador"}</StatusChip>
									<span>Orientador: {defesa.orientador || "—"}</span>
								</small>
							) : (
								<small>
									<Icon name="person" size={15} /> {defesa.orientador || "Orientador não informado"}
								</small>
							)}
						</div>
						<div className="defense-place">
							<strong>{defesa.hora}</strong>
							<span>{defesa.local || "Local a definir"}</span>
						</div>
						<ActionIconButton
							className="icon-button"
							aria-label={`Ver detalhes da defesa de ${defesa.estudante}`}
							onClick={() => setSelecionada(defesa)}
						>
							<Icon name="chevron_right" />
						</ActionIconButton>
					</div>
				))}
			</div>
			{!carregando && defesas.length === 0 && (
				<div className="table-no-results defense-empty">
					<Icon name="event_busy" size={30} />
					<strong>{vazio.titulo}</strong>
					<span>{vazio.texto}</span>
				</div>
			)}
			<DefenseDetailDrawer
				defesa={selecionada}
				onClose={() => setSelecionada(null)}
				acoes={selecionada && acoesDetalhe ? acoesDetalhe(selecionada, () => setSelecionada(null)) : undefined}
				extra={selecionada && extraDetalhe ? extraDetalhe(selecionada) : undefined}
			/>
		</Card>
	);
}
