/** Iniciais de um nome, ignorando títulos (Prof., Profa., Dr., Dra.). */
export function iniciais(nome: string | null | undefined): string {
	const partes = (nome ?? "")
		.replace(/\b(Prof(a)?|Dr(a)?)\.\s*/gi, "")
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (partes.length === 0) return "?";
	const primeira = partes[0]?.[0] ?? "";
	const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
	return (primeira + ultima).toUpperCase();
}

interface AvatarProps {
	nome: string | null | undefined;
	size?: "small" | "normal";
	className?: string;
}

export function Avatar({ nome, size = "normal", className = "" }: AvatarProps) {
	return <div className={`avatar ${size === "small" ? "small" : ""} ${className}`}>{iniciais(nome)}</div>;
}
