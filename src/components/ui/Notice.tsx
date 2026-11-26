import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Alert, Snackbar, type AlertColor } from "@mui/material";

type Notificar = (mensagem: ReactNode, severidade?: AlertColor) => void;

const NoticeContext = createContext<Notificar>(() => {});

/** Snackbar único da aplicação (canto inferior direito), como no design. */
export function NoticeProvider({ children }: { children: ReactNode }) {
	const [aviso, setAviso] = useState<{ mensagem: ReactNode; severidade: AlertColor } | null>(null);
	const notificar = useCallback<Notificar>((mensagem, severidade = "success") => setAviso({ mensagem, severidade }), []);
	return (
		<NoticeContext.Provider value={notificar}>
			{children}
			<Snackbar
				open={Boolean(aviso)}
				autoHideDuration={3000}
				onClose={() => setAviso(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert severity={aviso?.severidade ?? "success"} variant="filled" onClose={() => setAviso(null)}>
					{aviso?.mensagem}
				</Alert>
			</Snackbar>
		</NoticeContext.Provider>
	);
}

/** `const notificar = useNotice(); notificar("Salvo com sucesso.")` */
export function useNotice(): Notificar {
	return useContext(NoticeContext);
}
