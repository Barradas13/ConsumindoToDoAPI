// js/apiService.js - Versão Corrigida
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE;
    }

    async request(endpoint, options = {}) {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            console.log(`🌐 API Request: ${config.method} ${this.baseUrl}${endpoint}`);
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }

            // Para respostas sem conteúdo (como DELETE)
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API Request failed:', error);
            
            // Mensagens de erro mais específicas
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
            }
            
            throw error;
        }
    }

    // Métodos específicos para Auth
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: credentials
        });
    }

    async registrar(userData) {
        return this.request('/auth/registro', {
            method: 'POST',
            body: userData
        });
    }

    // Métodos específicos para Tarefas
    async getTarefas(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined) {
                params.append(key, filters[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = queryString ? `/tarefas?${queryString}` : '/tarefas';
        
        return this.request(endpoint);
    }

    async criarTarefa(tarefaData) {
        return this.request('/tarefas', {
            method: 'POST',
            body: tarefaData
        });
    }

    async atualizarTarefa(id, tarefaData) {
        return this.request(`/tarefas/${id}`, {
            method: 'PATCH',
            body: tarefaData
        });
    }

    async deletarTarefa(id) {
        return this.request(`/tarefas/${id}`, {
            method: 'DELETE'
        });
    }
}

// Instância global do serviço API
const apiService = new ApiService();