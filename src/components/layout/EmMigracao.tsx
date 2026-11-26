import { Card, EmptyState, PageHeader } from "../ui";

/** Página provisória para telas do novo design que ainda serão migradas. */
export default function EmMigracao({ titulo, fase, observacao }: { titulo: string; fase: string; observacao?: string }) {
	return (
		<>
			<PageHeader title={titulo} />
			<Card className="card">
				<EmptyState
					icon="construction"
					title="Tela em migração"
					text={`Esta tela será entregue na ${fase} da migração para o novo design.${observacao ? ` ${observacao}` : ""}`}
				/>
			</Card>
		</>
	);
}
