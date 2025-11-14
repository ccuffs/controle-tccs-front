import { useState, useRef, useCallback } from "react";

export function useModuloOrientador() {
	const [tabValue, setTabValue] = useState(0);
	const gerenciarDisponibilidadeRef = useRef(null);

	const handleTabChange = useCallback(
		(event, newValue) => {
			// Verificar se há mudanças não sincronizadas na aba de disponibilidade
			if (
				tabValue === 4 &&
				newValue !== 4 &&
				gerenciarDisponibilidadeRef.current
			) {
				const hasUnsavedChanges =
					gerenciarDisponibilidadeRef.current.hasUnsavedChanges();
				if (hasUnsavedChanges) {
					const shouldProceed =
						gerenciarDisponibilidadeRef.current.confirmNavigation();
					if (!shouldProceed) {
						return; // Não muda a aba
					}
				}
			}
			setTabValue(newValue);
		},
		[tabValue],
	);

	return {
		tabValue,
		gerenciarDisponibilidadeRef,
		handleTabChange,
	};
}
