import { useState, useCallback } from "react";

export function useTheme() {
	const [mode, setMode] = useState("light");

	const toggleTheme = useCallback(() => {
		setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
	}, []);

	return {
		mode,
		toggleTheme,
	};
}

