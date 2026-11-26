import { Skeleton } from "@mui/material";
import {
	ActionIconButton,
	Button,
	Card,
	EmptyState,
	Icon,
	Input,
	PageHeader,
	PhaseChip,
	Select,
	StatusChip,
	Surface,
} from "../ui";

const CORES: [string, string][] = [
	["#20707C", "Teal 700"],
	["#70C8B7", "Teal 300"],
	["#FDAE16", "Laranja 500"],
	["#F5F4F6", "Neutro 50"],
	["#1D1B1B", "Neutro 950"],
	["#23845C", "Sucesso"],
	["#C27608", "Aviso"],
	["#C64242", "Erro"],
	["#3478B8", "Informação"],
];

/** Vitrine dos tokens e componentes de `components/ui` (rota interna, só ADMIN). */
export default function DesignSystem() {
	return (
		<>
			<PageHeader
				eyebrow="FUNDAÇÃO VISUAL"
				title="Design System UFFS"
				description="Tokens e componentes para uma experiência acadêmica coerente, acessível e responsiva."
			/>
			<section className="ds-section">
				<div className="ds-heading">
					<span>01</span>
					<div>
						<h2>Cores</h2>
						<p>Marca, superfícies e semântica com contraste WCAG AA.</p>
					</div>
				</div>
				<div className="swatches">
					{CORES.map(([cor, nome]) => (
						<div key={nome}>
							<i style={{ background: cor }} />
							<strong>{nome}</strong>
							<span>{cor}</span>
						</div>
					))}
				</div>
			</section>
			<section className="ds-section">
				<div className="ds-heading">
					<span>02</span>
					<div>
						<h2>Tipografia</h2>
						<p>Inter, com números tabulares para dados acadêmicos.</p>
					</div>
				</div>
				<Surface className="type-spec card">
					<div>
						<small>DISPLAY · 48/56</small>
						<div className="display">Clareza para avançar.</div>
					</div>
					<div>
						<small>H1 · 32/40</small>
						<h1>Gestão acadêmica</h1>
					</div>
					<div>
						<small>H2 · 24/32</small>
						<h2>Próximas defesas</h2>
					</div>
					<div>
						<small>CORPO · 16/24</small>
						<p>Informação acessível para toda a comunidade universitária.</p>
					</div>
				</Surface>
			</section>
			<section className="ds-section">
				<div className="ds-heading">
					<span>03</span>
					<div>
						<h2>Componentes</h2>
						<p>Estados e variantes reutilizáveis.</p>
					</div>
				</div>
				<Card className="card component-showcase">
					<h3>Botões</h3>
					<div className="component-row">
						<Button>Primário</Button>
						<Button variant="secondary">Secundário</Button>
						<Button variant="tertiary">Terciário</Button>
						<Button variant="danger">Remover</Button>
						<ActionIconButton className="icon-button bordered" aria-label="Mais ações">
							<Icon name="more_horiz" />
						</ActionIconButton>
					</div>
				</Card>
				<Card className="card component-showcase">
					<h3>Campos</h3>
					<div className="component-row fields">
						<label>
							<span>Rótulo</span>
							<Input placeholder="Digite aqui" />
						</label>
						<label>
							<span>Curso</span>
							<Select>
								<option>Ciência da Computação</option>
							</Select>
						</label>
						<label className="error-field">
							<span>E-mail</span>
							<Input value="email-inválido" readOnly />
							<small>Informe um e-mail válido.</small>
						</label>
					</div>
				</Card>
				<Card className="card component-showcase">
					<h3>Chips</h3>
					<div className="component-row">
						<PhaseChip />
						<PhaseChip final />
						<StatusChip type="warning">Pendente</StatusChip>
						<StatusChip type="success">Aceito</StatusChip>
						<StatusChip type="danger">Recusado</StatusChip>
						<StatusChip type="neutral">
							<Icon name="domain" size={14} />
							Externo
						</StatusChip>
					</div>
				</Card>
				<Card className="card component-showcase">
					<h3>Estados</h3>
					<div className="states-grid">
						<EmptyState title="Nenhum resultado" text="Tente ajustar os filtros ou faça um novo cadastro." action="Novo cadastro" />
						<div className="skeleton-state">
							<Skeleton variant="text" width="55%" height={34} />
							<Skeleton variant="text" />
							<Skeleton variant="text" width="70%" />
							<Skeleton variant="rounded" height={90} sx={{ mt: 2 }} />
						</div>
					</div>
				</Card>
			</section>
		</>
	);
}
