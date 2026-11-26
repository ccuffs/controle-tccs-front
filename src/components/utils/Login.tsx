import { useState } from "react";
import { Alert } from "@mui/material";

import { useLogin } from "../../hooks/useLogin";
import { Button, Icon, Input, PlainButton } from "../ui";

/** Tela de login do novo design (duas colunas). Acesso apenas com o ID UFFS. */
export default function Login() {
	const { formData, error, loading, handleInputChange, handleSubmit } = useLogin();
	const [mostrarSenha, setMostrarSenha] = useState(false);

	return (
		<main className="login-page">
			<section className="login-brand">
				<div className="brand-mark large">
					<span>UFFS</span>
					<i />
				</div>
				<div>
					<span className="eyebrow light">UNIVERSIDADE FEDERAL DA FRONTEIRA SUL</span>
					<h1>Projetos que transformam conhecimento em futuro.</h1>
					<p>Uma jornada mais simples para discentes, docentes e coordenações.</p>
				</div>
				<div className="academic-art">
					<i />
					<i />
					<i />
					<Icon name="school" size={80} />
				</div>
			</section>
			<section className="login-form">
				<div className="mobile-brand">
					<div className="brand-mark">
						<span>UFFS</span>
						<i />
					</div>
					<strong>Gestão de TCCs</strong>
				</div>
				<form className="login-box" onSubmit={handleSubmit} noValidate>
					<span className="eyebrow">BEM-VINDO DE VOLTA</span>
					<h2>Acesse sua conta</h2>
					<p>Use suas credenciais institucionais para continuar.</p>
					{error && (
						<Alert severity="error" sx={{ mb: 1 }}>
							{error}
						</Alert>
					)}
					<label>
						<span>ID UFFS</span>
						<div className="input-with-icon">
							<Icon name="badge" />
							<Input
								name="userId"
								value={formData.userId}
								onChange={handleInputChange}
								placeholder="Digite seu ID UFFS"
								autoComplete="username"
								autoFocus
								disabled={loading}
							/>
						</div>
					</label>
					<label>
						<span>Senha</span>
						<div className="input-with-icon">
							<Icon name="lock" />
							<Input
								name="senha"
								type={mostrarSenha ? "text" : "password"}
								value={formData.senha}
								onChange={handleInputChange}
								placeholder="Digite sua senha"
								autoComplete="current-password"
								disabled={loading}
							/>
							<PlainButton
								onClick={() => setMostrarSenha((x) => !x)}
								aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
							>
								<Icon name={mostrarSenha ? "visibility_off" : "visibility"} />
							</PlainButton>
						</div>
					</label>
					<div className="login-help" />
					<Button type="submit" disabled={loading}>
						{loading ? "Entrando…" : "Entrar"} <Icon name="arrow_forward" />
					</Button>
				</form>
				<footer>© {new Date().getFullYear()} UFFS · Gestão de TCCs</footer>
			</section>
		</main>
	);
}
