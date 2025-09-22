const API_BASE='http://localhost:8080/api';
let token=localStorage.getItem('token');
let usuario=JSON.parse(localStorage.getItem('usuario')||'{}');
let tarefasLista=[];
let tarefaAtualEditando=null;

const el=id=>document.getElementById(id);
if(token) mostrarTarefas();

function mostrarMensagem(texto,tipo='success'){
    document.querySelectorAll('.message').forEach(m=>m.remove());
    const msg=document.createElement('div');
    msg.className=`message ${tipo}`;
    msg.textContent=texto;
    const container=el('authSection')||el('tarefasSection');
    container.insertBefore(msg,container.firstChild);
    setTimeout(()=>msg.remove(),5000);
}

async function apiRequest(endpoint,{method='GET',body=null}={}){
    const headers={'Authorization':`Bearer ${token}`,'Content-Type':'application/json'};
    const res=await fetch(`${API_BASE}${endpoint}`,{method,headers,body});
    if(!res.ok) throw new Error('Erro na API');
    return await res.json();
}

async function login(){
    try{
        const res=await fetch(`${API_BASE}/auth/login`,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({email:el('loginEmail').value,senha:el('loginSenha').value})
        });
        const data=await res.json();
        if(res.ok){token=data.token;usuario={nome:data.nome,email:data.email};localStorage.setItem('token',token);localStorage.setItem('usuario',JSON.stringify(usuario));mostrarTarefas();mostrarMensagem('Login realizado!');}
        else mostrarMensagem(data||'Erro no login','error');
    }catch(e){mostrarMensagem('Erro de conexão','error');}
}

async function registrar(){
    try{
        const res=await fetch(`${API_BASE}/auth/registro`,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({nome:el('regNome').value,email:el('regEmail').value,senha:el('regSenha').value})
        });
        const data=await res.json();
        if(res.ok){token=data.token;usuario={nome:data.nome,email:data.email};localStorage.setItem('token',token);localStorage.setItem('usuario',JSON.stringify(usuario));mostrarTarefas();mostrarMensagem('Conta criada!');}
        else mostrarMensagem(data||'Erro no registro','error');
    }catch(e){mostrarMensagem('Erro de conexão','error');}
}

function logout(){localStorage.removeItem('token');localStorage.removeItem('usuario');token=null;usuario={};mostrarLogin();}
function mostrarRegistro(){el('loginForm').classList.add('hidden');el('registroForm').classList.remove('hidden');}
function mostrarLogin(){el('registroForm').classList.add('hidden');el('loginForm').classList.remove('hidden');}
function mostrarTarefas(){el('authSection').classList.add('hidden');el('tarefasSection').classList.remove('hidden');el('userName').textContent=usuario.nome;el('userEmail').textContent=usuario.email;carregarTarefas();}

async function carregarTarefas(){
    let url='/tarefas';
    const params=new URLSearchParams();
    const status=el('filtroStatus').value,importante=el('filtroImportante').value;
    if(status) params.append('status',status);
    if(importante) params.append('importante',importante);
    if(params.toString()) url+='?'+params.toString();
    try{tarefasLista=await apiRequest(url);exibirTarefas();}
    catch(e){mostrarMensagem('Erro ao carregar tarefas','error');}
}

function exibirTarefas(){
    const container=el('listaTarefas');
    if(!tarefasLista.length){container.innerHTML='<p style="text-align:center;color:#7f8c8d;">Nenhuma tarefa encontrada</p>';return;}
    container.innerHTML='';
    tarefasLista.forEach(t=>{
        const div=document.createElement('div');
        div.className='tarefa-item';
        div.setAttribute('draggable','true');
        div.dataset.id=t.id;
        div.innerHTML=`
            <div class="tarefa-header">
                <div class="tarefa-titulo">${t.nome} ${t.importante?'<span class="tarefa-importante"> ⚠️</span>':''}</div>
                <span class="status status-${t.status.toLowerCase()}">${t.status}</span>
            </div>
            <div class="tarefa-descricao">${t.descricao||'Sem descrição'}</div>
            <div class="tarefa-meta">Criada: ${new Date(t.dataCriacao).toLocaleDateString()} ${t.dataPrazo?`| Prazo: ${new Date(t.dataPrazo).toLocaleDateString()}`:''}</div>
            <div class="acoes">
                <button onclick="abrirModal(${t.id})">✏️ Editar</button>
                <button class="danger" onclick="deletarTarefa(${t.id})">🗑️ Excluir</button>
            </div>`;
        container.appendChild(div);

        // Drag & Drop
        div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',t.id);});
        div.addEventListener('dragover',e=>e.preventDefault());
        div.addEventListener('drop',e=>{
            e.preventDefault();
            const draggedId=e.dataTransfer.getData('text/plain');
            reorderTarefas(draggedId,t.id);
        });
    });
}

function reorderTarefas(draggedId,targetId){
    const fromIndex=tarefasLista.findIndex(t=>t.id==draggedId);
    const toIndex=tarefasLista.findIndex(t=>t.id==targetId);
    const [moved]=tarefasLista.splice(fromIndex,1);
    tarefasLista.splice(toIndex,0,moved);
    exibirTarefas();
}

async function criarTarefa(){
    const nome=el('novaTarefaNome').value;
    if(!nome){mostrarMensagem('Digite um título','error');return;}
    const dados={nome,descricao:el('novaTarefaDesc').value,importante:el('novaTarefaImportante').checked,dataPrazo:el('novaTarefaPrazo').value||null};
    try{await apiRequest('/tarefas',{method:'POST',body:JSON.stringify(dados)});el('novaTarefaNome').value='';el('novaTarefaDesc').value='';el('novaTarefaImportante').checked=false;el('novaTarefaPrazo').value='';carregarTarefas();mostrarMensagem('Tarefa criada!');}
    catch(e){mostrarMensagem('Erro ao criar tarefa','error');}
}

function abrirModal(id){
    const t=tarefasLista.find(t=>t.id==id);
    if(!t) return;
    tarefaAtualEditando=id;
    el('editNome').value=t.nome;
    el('editDescricao').value=t.descricao||'';
    el('editImportante').checked=t.importante;
    el('editStatus').value=t.status;
    el('editModal').classList.remove('hidden');
}

function fecharModal(){el('editModal').classList.add('hidden');tarefaAtualEditando=null;}

async function salvarEdicao(){
    if(!tarefaAtualEditando) return;
    const dados={nome:el('editNome').value,descricao:el('editDescricao').value,importante:el('editImportante').checked,status:el('editStatus').value};
    try{await apiRequest(`/tarefas/${tarefaAtualEditando}`,{method:'PATCH',body:JSON.stringify(dados)});carregarTarefas();mostrarMensagem('Tarefa atualizada!');fecharModal();}
    catch(e){mostrarMensagem('Erro ao atualizar','error');}
}

async function deletarTarefa(id){
    if(!confirm('Deseja excluir esta tarefa?')) return;
    try{await apiRequest(`/tarefas/${id}`,{method:'DELETE'});carregarTarefas();mostrarMensagem('Tarefa excluída!');}
    catch(e){mostrarMensagem('Erro ao excluir','error');}
}
