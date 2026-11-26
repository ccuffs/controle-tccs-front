import { Button } from "./Button";

interface SaveBarProps {
	changes: number;
	onDiscard: () => void;
	onSave: () => void;
	saving?: boolean;
}

/** Barra flutuante de alterações não salvas (ex.: Disponibilidade). Some quando não há alterações. */
export function SaveBar({ changes, onDiscard, onSave, saving = false }: SaveBarProps) {
	if (changes <= 0) return null;
	return (
		<div className="save-bar">
			<div>
				<span className="unsaved-dot" />
				<strong>
					{changes} {changes === 1 ? "alteração não salva" : "alterações não salvas"}
				</strong>
			</div>
			<div>
				<Button variant="tertiary" onClick={onDiscard} disabled={saving}>
					Descartar
				</Button>
				<Button icon="save" onClick={onSave} disabled={saving}>
					Salvar alterações
				</Button>
			</div>
		</div>
	);
}
