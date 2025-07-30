export const verificarPermissaoPorId = (permissoes, permissaoId) => {
    if (!permissoes || !Array.isArray(permissoes)) {
        return false;
    }

    return permissoes.some((permissao) => permissao.id === permissaoId);
};

export const verificarPermissaoPorIds = (permissoes, permissaoIds) => {

    if (!permissoes || !Array.isArray(permissoes)) {
        return false;
    }

    if (!Array.isArray(permissaoIds)) {
        permissaoIds = [permissaoIds];
    }

    const resultado = permissaoIds.some((id) =>
        permissoes.some((permissao) => permissao.id === id)
    );

    return resultado;
};
