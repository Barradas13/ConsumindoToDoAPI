// Arquivo principal que inicializa a aplicação
class App {
    constructor() {
        this.init();
    }

    async init() {
        // Testa a conexão com a API
        await this.testarConexaoAPI();
        
        // Verifica se o usuário já está logado
        if (authController.token) {
            authController.mostrarTarefas();
        }

        this.configurarEventos();
    }

    async testarConexaoAPI() {
        try {
            // Tenta fazer uma requisição simples para a API
            const response = await fetch(`${CONFIG.API_BASE}/auth`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.log('✅ API está respondendo, mas com erro:', response.status);
            } else {
                console.log('✅ API está funcionando corretamente');
            }
        } catch (error) {
            console.error('❌ API não está acessível:', error);
            Utils.mostrarMensagem(
                '⚠️ Não foi possível conectar ao servidor. Verifique se a API Spring Boot está rodando na porta 8080.', 
                'error'
            );
        }
    }

    configurarEventos() {
        // Enter nos campos de login/registro
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (Utils.el('loginForm') && !Utils.el('loginForm').classList.contains('hidden')) {
                    authController.login();
                } else if (Utils.el('registroForm') && !Utils.el('registroForm').classList.contains('hidden')) {
                    authController.registrar();
                }
            }
        });

    }
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new App();
});