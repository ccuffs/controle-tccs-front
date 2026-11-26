import type { ReactNode } from "react";

interface PageHeaderProps {
	eyebrow?: string;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
	return (
		<header className="page-header">
			<div>
				{eyebrow && <div className="eyebrow">{eyebrow}</div>}
				<h1>{title}</h1>
				{description && <p>{description}</p>}
			</div>
			{action && <div className="header-action">{action}</div>}
		</header>
	);
}
