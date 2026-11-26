import { useEffect, useState } from "react";
import { atualizarEmailDicente, getMeuPerfil } from "../../services/perfil-dicente-service";
import type { Dicente } from "../../types/dicente";
import { getErrorMessage } from "../../utils/apiError";
import { Avatar, Button, Card, Input, PageHeader, useNotice } from "../ui";

/** Perfil do discente: nome e matrícula só leitura, e-mail editável. */
export default function PerfilDiscente() {
	const notificar = useNotice();
	const [dicente, setDicente] = useState<Dicente | null>(null);
	const [email, setEmail] = useState("");
	const [salvando, setSalvando] = useState(false);

	useEffect(() => {
		getMeuPerfil()
			.then((d) => {
				setDicente(d);
				setEmail(d.email ?? "");
			})
			.catch((e) => notificar(getErrorMessage(e, "Erro ao carregar o perfil"), "error"));
	}, [notificar]);

	const salvar = async () => {
		if (!dicente) return;
		if (!email.includes("@")) {
			notificar("Informe um e-mail válido.", "error");
			return;
		}
		setSalvando(true);
		try {
			await atualizarEmailDicente(dicente.matricula, email.trim());
			notificar("Perfil atualizado com sucesso.");
		} catch (e) {
			notificar(getErrorMessage(e, "Não foi possível salvar o perfil."), "error");
		} finally {
			setSalvando(false);
		}
	};

	return (
		<>
			<PageHeader title="Meu perfil" description="Consulte e mantenha seus dados pessoais atualizados." />
			<Card className="card profile-card">
				<div className="profile-identity">
					<Avatar nome={dicente?.nome} className="profile-avatar" />
					<div>
						<h2>{dicente?.nome ?? "—"}</h2>
						<p>Discente</p>
					</div>
				</div>
				<div className="form-grid">
					<label>
						<span>Nome completo</span>
						<Input value={dicente?.nome ?? ""} readOnly />
					</label>
					<label>
						<span>Matrícula</span>
						<Input value={dicente?.matricula ?? ""} readOnly />
					</label>
					<label className="full">
						<span>E-mail</span>
						<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
					</label>
				</div>
				<div className="profile-actions">
					<Button icon="save" onClick={salvar} disabled={salvando || !dicente}>
						Salvar alterações
					</Button>
				</div>
			</Card>
		</>
	);
}
