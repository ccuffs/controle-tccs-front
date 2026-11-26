import { useRef } from "react";
import type { GerenciarDisponibilidadeHandle } from "../../hooks/useGerenciarDisponibilidadeBanca";
import GradeDisponibilidade from "../orientador/GradeDisponibilidade";

/** Rota /orientador/disponibilidade. A confirmação de saída com alterações fica na própria grade. */
export default function Disponibilidade() {
	const ref = useRef<GerenciarDisponibilidadeHandle | null>(null);
	return <GradeDisponibilidade ref={ref} />;
}
