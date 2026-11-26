import { Icon, Input, Textarea } from "../../ui";

interface Campos {
	tema: string;
	titulo: string;
	resumo: string;
}

interface EtapaTemaTituloResumoProps {
	dados: Campos;
	onChange: (campo: keyof Campos, valor: string) => void;
}

/**
 * Passo "Tema, título e resumo" (antes etapas 1, 2 e 3 do stepper, uma tela cada).
 * Os três campos ficam juntos; a etapa gravada continua seguindo o preenchimento.
 */
export default function EtapaTemaTituloResumo({ dados, onChange }: EtapaTemaTituloResumoProps) {
	const preenchidos = [dados.tema, dados.titulo, dados.resumo].filter((v) => v.trim()).length;
	return (
		<div className="form-stack">
			<label>
				<span>Tema</span>
				<Textarea
					rows={3}
					value={dados.tema}
					onChange={(e) => onChange("tema", e.target.value)}
					placeholder="Descreva o tema do seu trabalho de conclusão de curso..."
					helperText="Descreva de forma clara e objetiva o tema que será abordado no seu TCC."
				/>
			</label>
			<label>
				<span>Título</span>
				<Input
					value={dados.titulo}
					onChange={(e) => onChange("titulo", e.target.value)}
					placeholder="Digite o título do seu trabalho de conclusão de curso..."
					helperText="O título deve ser claro, conciso e representativo do conteúdo do trabalho."
				/>
			</label>
			<label>
				<span>Resumo</span>
				<Textarea
					rows={7}
					value={dados.resumo}
					onChange={(e) => onChange("resumo", e.target.value)}
					placeholder="Escreva um resumo do seu trabalho de conclusão de curso..."
					helperText="Apresente objetivos, metodologia, resultados esperados e principais conclusões."
				/>
			</label>
			<span className="autosave" style={{ color: preenchidos === 3 ? "var(--success)" : "var(--muted)" }}>
				<Icon name={preenchidos === 3 ? "task_alt" : "edit_note"} size={16} />
				{preenchidos === 3
					? "Tudo preenchido. Continue para convidar a banca do projeto."
					: `${preenchidos} de 3 campos preenchidos. Você pode salvar e continuar depois.`}
			</span>
		</div>
	);
}
