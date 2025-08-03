import axiosInstance from "../auth/axios";

const conviteService = {
    // Buscar convites com filtros
    getConvites: async (filtros = {}) => {
        try {
            const params = new URLSearchParams();
            if (filtros.id_tcc) params.append('id_tcc', filtros.id_tcc);
            if (filtros.codigo_docente) params.append('codigo_docente', filtros.codigo_docente);
            if (filtros.aceito !== undefined) params.append('aceito', filtros.aceito);

            const response = await axiosInstance.get(`/convites?${params.toString()}`);
            return response.data?.convites || response.convites || [];
        } catch (error) {
            console.error('Erro ao buscar convites:', error);
            throw error;
        }
    },

    // Criar novo convite
    criarConvite: async (dadosConvite) => {
        try {
            const response = await axiosInstance.post('/convites', {
                formData: dadosConvite
            });
            return response;
        } catch (error) {
            console.error('Erro ao criar convite:', error);
            throw error;
        }
    },

    // Responder convite (aceitar/rejeitar)
    responderConvite: async (idTcc, codigoDocente, aceito) => {
        try {
            const response = await axiosInstance.put(`/convites/${idTcc}/${codigoDocente}`, {
                aceito: aceito
            });
            return response;
        } catch (error) {
            console.error('Erro ao responder convite:', error);
            throw error;
        }
    },

    // Deletar convite
    deletarConvite: async (idTcc, codigoDocente) => {
        try {
            const response = await axiosInstance.delete(`/convites/${idTcc}/${codigoDocente}`);
            return response;
        } catch (error) {
            console.error('Erro ao deletar convite:', error);
            throw error;
        }
    },

    // Buscar convites pendentes de um docente
    getConvitesPendentes: async (codigoDocente) => {
        try {
            const response = await axiosInstance.get(`/convites/pendentes/${codigoDocente}`);
            return response.convites || [];
        } catch (error) {
            console.error('Erro ao buscar convites pendentes:', error);
            throw error;
        }
    }
};

export default conviteService;