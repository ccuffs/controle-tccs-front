import { Button } from "./Button";
import { Icon } from "./Icon";

interface EmptyStateProps {
	icon?: string;
	title: string;
	text: string;
	action?: string;
	onAction?: () => void;
}

export function EmptyState({ icon = "inbox", title, text, action, onAction }: EmptyStateProps) {
	return (
		<div className="empty-state">
			<div className="empty-illustration">
				<Icon name={icon} size={34} />
			</div>
			<h3>{title}</h3>
			<p>{text}</p>
			{action && (
				<Button variant="secondary" onClick={onAction}>
					{action}
				</Button>
			)}
		</div>
	);
}
