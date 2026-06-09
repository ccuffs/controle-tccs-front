import { useState, useRef, useCallback, useEffect } from "react";

const BANCA_DISABLED_TABS = new Set([0, 1, 2, 7]);

export function useModuloOrientador({ isBanca = false } = {}) {
	const [tabValue, setTabValue] = useState(0);
	const gerenciarDisponibilidadeRef = useRef(null);

	useEffect(() => {
		if (isBanca && BANCA_DISABLED_TABS.has(tabValue)) {
			setTabValue(3);
		}
	}, [isBanca]);

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
