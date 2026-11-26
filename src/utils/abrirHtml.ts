/**
 * Abre um documento HTML gerado pela API em nova aba (atas e declarações).
 * A aba é aberta antes da requisição para não ser bloqueada como pop-up.
 */
export async function abrirHtmlEmNovaAba(gerar: () => Promise<string>): Promise<void> {
	const aba = window.open("", "_blank");
	if (!aba) throw new Error("Permita pop-ups para visualizar o documento.");
	try {
		const html = await gerar();
		aba.document.write(html);
		aba.document.close();
	} catch (erro) {
		aba.close();
		throw erro;
	}
}
