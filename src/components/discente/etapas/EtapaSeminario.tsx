import { Icon, Textarea } from "../../ui";

interface EtapaSeminarioProps {
	texto: string;
	onChange: (valor: string) => void;
	/** O TCC II só avança depois da aprovação do projeto (TCC I). */
	projetoAprovado: boolean;
}

/** Passo "Seminário de andamento" (etapa 6 do stepper, só no TCC II). */
export default function EtapaSeminario({ texto, onChange, projetoAprovado }: EtapaSeminarioProps) {
	const preenchido = texto.trim().length > 0;
	return (
		<>
			{projetoAprovado ? (
				<div className="readonly-box success-box" style={{ marginTop: 0 }}>
					<Icon name="verified" />
					<span>Projeto aprovado no TCC I. Registre agora o andamento do trabalho.</span>
				</div>
			) : (
				<div className="readonly-box warning-box" style={{ marginTop: 0 }}>
					<Icon name="info" />
					<span>
						O projeto ainda não consta como aprovado. Você pode escrever e salvar o seminário, mas só poderá continuar depois da
						aprovação.
					</span>
				</div>
			)}
			<div className="form-stack">
				<label>
					<span>Seminário de andamento</span>
					<Textarea
						rows={10}
						value={texto}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Descreva as atividades realizadas, a metodologia aplicada, os resultados parciais e os próximos passos..."
					/>
				</label>
				<span className="autosave" style={{ color: preenchido ? "var(--success)" : "var(--muted)" }}>
					<Icon name={preenchido ? "task_alt" : "edit_note"} size={16} />
					{preenchido
						? projetoAprovado
							? "Seminário preenchido. Continue para convidar a banca final."
							: "Seminário preenchido. Salve para não perder o texto."
						: "Você pode salvar um rascunho e continuar depois."}
				</span>
			</div>
		</>
	);
}
