// Utilitários gerais
class Utils {
    static el(id) {
        return document.getElementById(id);
    }

    static mostrarMensagem(texto, tipo = 'success') {
        // Remove mensagens anteriores
        document.querySelectorAll('.message').forEach(msg => msg.remove());

        const message = document.createElement('div');
        message.className = `message ${tipo}`;
        message.textContent = texto;
        
        const container = this.el('authSection') || this.el('tarefasSection');
        container.insertBefore(message, container.firstChild);

        setTimeout(() => message.remove(), 5000);
    }

    static formatarData(dataString) {
        return new Date(dataString).toLocaleDateString('pt-BR');
    }

    static validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static toggleElement(id, mostrar) {
        const element = this.el(id);
        if (mostrar) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
}