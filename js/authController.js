// Controlador de Autenticação
class AuthController {
    constructor() {
        this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        this.usuario = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USUARIO) || '{}');
    }

    async login() {
        const email = Utils.el('loginEmail').value;
        const senha = Utils.el('loginSenha').value;

        if (!email || !senha) {
            Utils.mostrarMensagem('Preencha email e senha', 'error');
            return;
        }

        try {
            const data = await apiService.login({ email, senha });
            
            this.token = data.token;
            this.usuario = { nome: data.nome, email: data.email };
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, this.token);
            localStorage.setItem(CONFIG.STORAGE_KEYS.USUARIO, JSON.stringify(this.usuario));
            
            this.mostrarTarefas();
            Utils.mostrarMensagem('Login realizado com sucesso!');
        } catch (error) {
            console.error('Erro no login:', error);
            
            if (error.message.includes('Não foi possível conectar')) {
                Utils.mostrarMensagem('Servidor indisponível. Verifique se a API está rodando na porta 8080.', 'error');
            } else if (error.message.includes('401')) {
                Utils.mostrarMensagem('Email ou senha inválidos', 'error');
            } else {
                Utils.mostrarMensagem('Erro ao fazer login: ' + error.message, 'error');
            }
        }
    }

    async registrar() {
        const nome = Utils.el('regNome').value;
        const email = Utils.el('regEmail').value;
        const senha = Utils.el('regSenha').value;

        if (!nome || !email || !senha) {
            Utils.mostrarMensagem('Preencha todos os campos', 'error');
            return;
        }

        if (!Utils.validarEmail(email)) {
            Utils.mostrarMensagem('Email inválido', 'error');
            return;
        }

        try {
            const data = await apiService.registrar({ nome, email, senha });
            
            this.token = data.token;
            this.usuario = { nome: data.nome, email: data.email };
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, this.token);
            localStorage.setItem(CONFIG.STORAGE_KEYS.USUARIO, JSON.stringify(this.usuario));
            
            this.mostrarTarefas();
            Utils.mostrarMensagem('Conta criada com sucesso!');
        } catch (error) {
            Utils.mostrarMensagem('Erro ao criar conta. Tente novamente.', 'error');
        }
    }

    logout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USUARIO);
        this.token = null;
        this.usuario = {};
        this.mostrarLogin();
        location.reload();
    }

    mostrarRegistro() {
        Utils.toggleElement('loginForm', false);
        Utils.toggleElement('registroForm', true);
    }

    mostrarLogin() {
        Utils.toggleElement('registroForm', false);
        Utils.toggleElement('loginForm', true);
    }

    mostrarTarefas() {
        Utils.toggleElement('authSection', false);
        Utils.toggleElement('tarefasSection', true);
        
        Utils.el('userName').textContent = this.usuario.nome;
        Utils.el('userEmail').textContent = this.usuario.email;
        
        // Carrega as tarefas do usuário
        tarefasController.carregarTarefas();
    }
}

// Instância global do controlador de auth
const authController = new AuthController();