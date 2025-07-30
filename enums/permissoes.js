const Permissoes = {};

Permissoes.CURSO = {
    VISUALIZAR: 1,
    VISUALIZAR_TODOS: 2,
    CRIAR: 3,
    EDITAR: 4,
    DELETAR: 5,
};

Permissoes.ORIENTADOR = {
    VISUALIZAR: 6,
    VISUALIZAR_TODOS: 7,
    CRIAR: 8,
    EDITAR: 9,
    DELETAR: 10,
};

Permissoes.DOCENTE = {
    VISUALIZAR: 6,
    VISUALIZAR_TODOS: 7,
    CRIAR: 8,
    EDITAR: 9,
    DELETAR: 10,
};

Permissoes.ORIENTACAO = {
    VISUALIZAR: 11,
    VISUALIZAR_TODAS: 12,
    CRIAR: 13,
    EDITAR: 14,
    DELETAR: 15,
};

Permissoes.DICENTE = {
    VISUALIZAR: 16,
    VISUALIZAR_TODOS: 17,
    CRIAR: 18,
    EDITAR: 19,
    DELETAR: 20,
};

Permissoes.TEMA_TCC = {
    VISUALIZAR: 21,
    VISUALIZAR_TODOS: 22,
    CRIAR: 23,
    EDITAR: 24,
    DELETAR: 25,
};

Permissoes.OFERTA_TCC = {
    VISUALIZAR: 26,
    VISUALIZAR_TODAS: 27,
    CRIAR: 28,
    EDITAR: 29,
    DELETAR: 30,
};

Permissoes.AREA_TCC = {
    VISUALIZAR: 31,
    VISUALIZAR_TODAS: 32,
    CRIAR: 33,
    EDITAR: 34,
    DELETAR: 35,
};

module.exports = { Permissoes };