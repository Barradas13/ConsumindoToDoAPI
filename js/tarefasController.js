// Controlador de Tarefas
class TarefasController {
    constructor() {
        this.tarefasLista = [];
        this.tarefaAtualEditando = null;
        this.configurarEventosModal();
    }

    // Novo método para configurar eventos do modal
    configurarEventosModal() {
        // Fechar modal clicando no X
        document.querySelector('.close').addEventListener('click', () => {
            this.fecharModal();
        });

        // Fechar modal clicando fora do conteúdo
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                this.fecharModal();
            }
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modalEstaFechado()) {
                this.fecharModal();
            }
        });
    }

    modalEstaFechado() {
        return document.getElementById('editModal').classList.contains('hidden');
    }

    abrirModal(id) {
        const tarefa = this.tarefasLista.find(t => t.id == id);
        if (!tarefa) return;

        this.tarefaAtualEditando = id;
        
        Utils.el('editNome').value = tarefa.nome;
        Utils.el('editDescricao').value = tarefa.descricao || '';
        Utils.el('editImportante').checked = tarefa.importante;
        Utils.el('editStatus').value = tarefa.status;
        
        // Remove a classe hidden para mostrar o modal
        document.getElementById('editModal').classList.remove('hidden');
        
        // Foca no primeiro campo
        setTimeout(() => {
            Utils.el('editNome').focus();
        }, 100);
    }

    fecharModal() {
        // Adiciona a classe hidden para esconder o modal
        document.getElementById('editModal').classList.add('hidden');
        this.tarefaAtualEditando = null;
        
        // Limpa os campos (opcional)
        Utils.el('editNome').value = '';
        Utils.el('editDescricao').value = '';
        Utils.el('editImportante').checked = false;
        Utils.el('editStatus').value = 'AFAZER';
    }

    async salvarEdicao() {
        if (!this.tarefaAtualEditando) {
            this.fecharModal();
            return;
        }

        const nome = Utils.el('editNome').value.trim();
        if (!nome) {
            Utils.mostrarMensagem('Digite um título para a tarefa', 'error');
            Utils.el('editNome').focus();
            return;
        }

        const dados = {
            nome: nome,
            descricao: Utils.el('editDescricao').value.trim(),
            importante: Utils.el('editImportante').checked,
            status: Utils.el('editStatus').value
        };

        try {
            await apiService.atualizarTarefa(this.tarefaAtualEditando, dados);
            await this.carregarTarefas();
            Utils.mostrarMensagem('Tarefa atualizada com sucesso!');
            this.fecharModal();
        } catch (error) {
            Utils.mostrarMensagem('Erro ao atualizar tarefa', 'error');
        }
    }

    async carregarTarefas() {
        const status = Utils.el('filtroStatus').value;
        const importante = Utils.el('filtroImportante').value;

        const filters = {};
        if (status) filters.status = status;
        if (importante) filters.importante = importante;

        try {
            this.tarefasLista = await apiService.getTarefas(filters);
            this.exibirTarefas();
        } catch (error) {
            Utils.mostrarMensagem('Erro ao carregar tarefas', 'error');
        }
    }

    exibirTarefas() {
        const container = Utils.el('listaTarefas');
        
        if (!this.tarefasLista.length) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhuma tarefa encontrada</p>';
            return;
        }

        container.innerHTML = this.tarefasLista.map(tarefa => this.criarElementoTarefa(tarefa)).join('');
        this.configurarDragAndDrop();
    }

    criarElementoTarefa(tarefa) {
        return `
            <div class="tarefa-item" draggable="true" data-id="${tarefa.id}">
                <div class="tarefa-header">
                    <div class="tarefa-titulo">
                        ${tarefa.nome} 
                        ${tarefa.importante ? '<span class="tarefa-importante"> ⚠️</span>' : ''}
                    </div>
                    <span class="status status-${tarefa.status.toLowerCase()}">${tarefa.status}</span>
                </div>
                <div class="tarefa-descricao">${tarefa.descricao || 'Sem descrição'}</div>
                <div class="tarefa-meta">
                    <span>Criada: ${Utils.formatarData(tarefa.dataCriacao)}</span>
                    ${tarefa.dataPrazo ? `<span>Prazo: ${Utils.formatarData(tarefa.dataPrazo)}</span>` : ''}
                </div>
                <div class="acoes">
                    <button onclick="tarefasController.abrirModal(${tarefa.id})">✏️ Editar</button>
                    <button class="danger" onclick="tarefasController.deletarTarefa(${tarefa.id})">🗑️ Excluir</button>
                </div>
            </div>
        `;
    }

    configurarDragAndDrop() {
        const tarefasElements = document.querySelectorAll('.tarefa-item');
        
        tarefasElements.forEach(element => {
            element.addEventListener('dragstart', this.handleDragStart);
            element.addEventListener('dragover', this.handleDragOver);
            element.addEventListener('drop', this.handleDrop);
        });
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = e.target.closest('.tarefa-item').dataset.id;
        tarefasController.reordenarTarefas(draggedId, targetId);
    }

    reordenarTarefas(draggedId, targetId) {
        const fromIndex = this.tarefasLista.findIndex(t => t.id == draggedId);
        const toIndex = this.tarefasLista.findIndex(t => t.id == targetId);
        
        const [moved] = this.tarefasLista.splice(fromIndex, 1);
        this.tarefasLista.splice(toIndex, 0, moved);
        
        this.exibirTarefas();
    }

    async criarTarefa() {
        const nome = Utils.el('novaTarefaNome').value.trim();
        
        if (!nome) {
            Utils.mostrarMensagem('Digite um título para a tarefa', 'error');
            return;
        }

        const dados = {
            nome,
            descricao: Utils.el('novaTarefaDesc').value.trim(),
            importante: Utils.el('novaTarefaImportante').checked,
            dataPrazo: Utils.el('novaTarefaPrazo').value || null
        };

        try {
            await apiService.criarTarefa(dados);
            
            // Limpa o formulário
            Utils.el('novaTarefaNome').value = '';
            Utils.el('novaTarefaDesc').value = '';
            Utils.el('novaTarefaImportante').checked = false;
            Utils.el('novaTarefaPrazo').value = '';
            
            // Recarrega a lista
            await this.carregarTarefas();
            Utils.mostrarMensagem('Tarefa criada com sucesso!');
        } catch (error) {
            Utils.mostrarMensagem('Erro ao criar tarefa', 'error');
        }
    }

    abrirModal(id) {
        const tarefa = this.tarefasLista.find(t => t.id == id);
        if (!tarefa) return;

        this.tarefaAtualEditando = id;
        
        Utils.el('editNome').value = tarefa.nome;
        Utils.el('editDescricao').value = tarefa.descricao || '';
        Utils.el('editImportante').checked = tarefa.importante;
        Utils.el('editStatus').value = tarefa.status;
        
        Utils.toggleElement('editModal', true);
    }

    fecharModal() {
        Utils.toggleElement('editModal', false);
        this.tarefaAtualEditando = null;
    }

    async salvarEdicao() {
        if (!this.tarefaAtualEditando) return;

        const dados = {
            nome: Utils.el('editNome').value.trim(),
            descricao: Utils.el('editDescricao').value.trim(),
            importante: Utils.el('editImportante').checked,
            status: Utils.el('editStatus').value
        };

        try {
            await apiService.atualizarTarefa(this.tarefaAtualEditando, dados);
            await this.carregarTarefas();
            Utils.mostrarMensagem('Tarefa atualizada com sucesso!');
            this.fecharModal();
        } catch (error) {
            Utils.mostrarMensagem('Erro ao atualizar tarefa', 'error');
        }
    }

    async deletarTarefa(id) {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
            return;
        }

        try {
            await apiService.deletarTarefa(id);
            await this.carregarTarefas();
            Utils.mostrarMensagem('Tarefa excluída com sucesso!');
        } catch (error) {
            Utils.mostrarMensagem('Erro ao excluir tarefa', 'error');
        }
    }
}

// Instância global do controlador de tarefas
const tarefasController = new TarefasController();