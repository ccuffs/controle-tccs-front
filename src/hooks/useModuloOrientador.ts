import { useState, useRef, useCallback, useEffect, type SyntheticEvent } from "react";

const BANCA_DISABLED_TABS = new Set([0, 1, 2, 7]);

export interface GerenciarDisponibilidadeHandle {
	hasUnsavedChanges: () => boolean;
	confirmNavigation: () => boolean;
}

export function useModuloOrientador({ isBanca = false } = {}) {
	const [tabValue, setTabValue] = useState(0);
	const gerenciarDisponibilidadeRef = useRef<GerenciarDisponibilidadeHandle | null>(null);

	useEffect(() => {
		if (isBanca && BANCA_DISABLED_TABS.has(tabValue)) {
			setTabValue(3);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isBanca]);

	const handleTabChange = useCallback(
		(_event: SyntheticEvent, newValue: number) => {
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
