import { useState, useCallback, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import loginController from "../controllers/login-controller";

export function useLogin() {
	const [formData, setFormData] = useState({
		userId: "",
		senha: "",
	});
	const [error, setError] = useState("");
	const { login, loading } = useAuth();
	const navigate = useNavigate();

	const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
		setError(""); // Limpa erro ao digitar
	}, []);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			setError("");

			const validation = loginController.validateLoginForm(
				formData.userId,
				formData.senha,
			);

			if (!validation.isValid) {
				setError(validation.message ?? "");
				return;
			}

			try {
				const resultado = await login(formData.userId, formData.senha);
				const processedResult =
					loginController.processLoginResult(resultado);

				if (processedResult.success) {
					navigate("/");
				} else {
					setError(processedResult.error ?? "");
				}
			} catch (error) {
				const errorMessage = loginController.handleLoginError(error);
				setError(errorMessage);
			}
		},
		[formData, login, navigate],
	);

	return {
		formData,
		error,
		loading,
		handleInputChange,
		handleSubmit,
	};
}
